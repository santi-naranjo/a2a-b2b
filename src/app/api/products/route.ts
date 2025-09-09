import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const vendorName = searchParams.get('vendor');
    const priceMin = Number(searchParams.get('price_min') || '');
    const priceMax = Number(searchParams.get('price_max') || '');
    const stockMin = Number(searchParams.get('stock_min') || '');
    const stockMax = Number(searchParams.get('stock_max') || '');
    const leadMin = Number(searchParams.get('lead_min') || '');
    const leadMax = Number(searchParams.get('lead_max') || '');

    let query = supabaseAdmin
      .from('products')
      .select('id, vendor_id, sku, name, brand, category, price, currency, stock, lead_time_days')
      .order('updated_at', { ascending: false })
      .limit(1000);

    // vendor filter by name handled after fetch by mapping names

    const hasQ = Boolean(q && q.trim().length > 0);
    if (hasQ) {
      const like = `%${q!.trim()}%`;
      query = query.or(`sku.ilike.${like},name.ilike.${like},brand.ilike.${like},category.ilike.${like}`);
    }
    if (category && category !== 'all') query = query.eq('category', category);
    if (brand && brand.trim().length > 0) query = query.ilike('brand', `%${brand.trim()}%`);
    if (!Number.isNaN(priceMin)) query = query.gte('price', priceMin);
    if (!Number.isNaN(priceMax) && priceMax > 0) query = query.lte('price', priceMax);
    if (!Number.isNaN(stockMin)) query = query.gte('stock', stockMin);
    if (!Number.isNaN(stockMax) && stockMax > 0) query = query.lte('stock', stockMax);
    if (!Number.isNaN(leadMin)) query = query.gte('lead_time_days', leadMin);
    if (!Number.isNaN(leadMax) && leadMax > 0) query = query.lte('lead_time_days', leadMax);

    const { data, error } = await query;
    if (error) throw error;

    const vendorIds = Array.from(new Set((data || []).map((r: any) => r.vendor_id).filter(Boolean)));
    let nameByVendor: Record<string, string> = {};
    if (vendorIds.length > 0) {
      const { data: vrows } = await supabaseAdmin.from('vendors').select('id,name').in('id', vendorIds);
      nameByVendor = Object.fromEntries((vrows || []).map((v: any) => [v.id, v.name]));
    }
    let rows = (data || []).map((r: any) => ({ ...r, vendor_name: nameByVendor[r.vendor_id] || null }));
    if (vendorName && vendorName.trim().length > 0) {
      const term = vendorName.trim().toLowerCase();
      rows = rows.filter((r: any) => String(r.vendor_name || '').toLowerCase().includes(term));
    }
    // If q provided, also include products whose vendor name matches q (union)
    if (hasQ) {
      const like = `%${q!.trim()}%`;
      const { data: vLike } = await supabaseAdmin.from('vendors').select('id').ilike('name', like);
      const ids = (vLike || []).map((v: any) => v.id);
      if (ids.length > 0) {
        let q2 = supabaseAdmin
          .from('products')
          .select('id, vendor_id, sku, name, brand, category, price, currency, stock, lead_time_days')
          .in('vendor_id', ids)
          .order('updated_at', { ascending: false })
          .limit(1000);
        if (category && category !== 'all') q2 = q2.eq('category', category);
        if (brand && brand.trim().length > 0) q2 = q2.ilike('brand', `%${brand.trim()}%`);
        if (!Number.isNaN(priceMin)) q2 = q2.gte('price', priceMin);
        if (!Number.isNaN(priceMax) && priceMax > 0) q2 = q2.lte('price', priceMax);
        if (!Number.isNaN(stockMin)) q2 = q2.gte('stock', stockMin);
        if (!Number.isNaN(stockMax) && stockMax > 0) q2 = q2.lte('stock', stockMax);
        if (!Number.isNaN(leadMin)) q2 = q2.gte('lead_time_days', leadMin);
        if (!Number.isNaN(leadMax) && leadMax > 0) q2 = q2.lte('lead_time_days', leadMax);
        const { data: extra } = await q2;
        const extraWithNames = (extra || []).map((r: any) => ({ ...r, vendor_name: nameByVendor[r.vendor_id] || null }));
        const byId = new Map<string, any>(rows.map((r: any) => [r.id, r]));
        for (const r of extraWithNames) if (!byId.has(r.id)) byId.set(r.id, r);
        rows = Array.from(byId.values());
      }
    }
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


