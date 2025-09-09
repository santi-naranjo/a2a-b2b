import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_NEGOTIATOR_PROMPT = `You are a vendor negotiator agent. 
Goals: negotiate offers, respect vendor constraints (stock, min order, lead times), and respond clearly.
Use allowed tools to draft counter offers and update pre-orders.`;

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  try {
    const { name, user_id, role, website, contact_email } = await req.json();
    if (!name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });

    const { data: vendor, error: venErr } = await supabaseAdmin
      .from('vendors')
      .insert({ name, website, contact_email })
      .select()
      .single();
    if (venErr) throw venErr;

    if (user_id) {
      const userRole = role && ['owner','admin','member'].includes(role) ? role : 'owner';
      const { error: memErr } = await supabaseAdmin
        .from('vendor_members')
        .insert({ vendor_id: vendor.id, user_id, role: userRole });
      if (memErr) throw memErr;
    }

    const { data: agent, error: agentErr } = await supabaseAdmin
      .from('agents')
      .insert({
        owner_type: 'vendor',
        owner_id: vendor.id,
        kind: 'negotiator',
        name: 'Default Negotiator Agent',
        system_prompt: DEFAULT_NEGOTIATOR_PROMPT,
        model: 'gpt-4o-mini',
        temperature: 0.2
      })
      .select()
      .single();
    if (agentErr) throw agentErr;

    return NextResponse.json({ ok: true, vendor, agent });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const qRaw = searchParams.get('q');
    const q = qRaw && qRaw.trim().length > 0 ? qRaw.trim() : null;

    let vendorIds: string[] | null = null;
    if (q) {
      const like = `%${q}%`;
      const [byName, byProducts] = await Promise.all([
        supabaseAdmin
          .from('vendors')
          .select('id')
          .ilike('name', like),
        supabaseAdmin
          .from('products')
          .select('vendor_id')
          .or(`sku.ilike.${like},name.ilike.${like},brand.ilike.${like},category.ilike.${like}`)
      ]);
      const set = new Set<string>();
      for (const row of byName.data ?? []) { if (row?.id) set.add(row.id as string); }
      for (const row of byProducts.data ?? []) { if (row?.vendor_id) set.add(row.vendor_id as string); }
      vendorIds = Array.from(set);
      if (vendorIds.length === 0) {
        return NextResponse.json({ ok: true, vendors: [] });
      }
    }

    let baseQuery = supabaseAdmin
      .from('vendors')
      .select('id, name, website, contact_email')
      .order('name');
    if (vendorIds && vendorIds.length > 0) baseQuery = baseQuery.in('id', vendorIds);
    const { data: vendors, error } = await baseQuery;
    if (error) throw error;
    // Load categories per vendor from products
    let prodQuery = supabaseAdmin
      .from('products')
      .select('vendor_id, category, stock, price, lead_time_days');
    if (vendorIds && vendorIds.length > 0) prodQuery = prodQuery.in('vendor_id', vendorIds);
    const { data: prodRows, error: prodErr } = await prodQuery;
    if (prodErr) throw prodErr;
    const vendorIdToCategories = new Map<string, Set<string>>();
    const vendorIdToTotals = new Map<string, { total: number; minPrice: number; fastest: number }>();
    for (const row of prodRows ?? []) {
      if (!row?.vendor_id) continue;
      const cat = row?.category as string | null;
      if (!cat) continue;
      if (!vendorIdToCategories.has(row.vendor_id)) vendorIdToCategories.set(row.vendor_id, new Set());
      vendorIdToCategories.get(row.vendor_id)!.add(cat);
      const stock = typeof row.stock === 'number' ? row.stock : 0;
      const price = typeof row.price === 'number' ? row.price : undefined;
      const lead = typeof row.lead_time_days === 'number' ? row.lead_time_days : undefined;
      const acc = vendorIdToTotals.get(row.vendor_id) ?? { total: 0, minPrice: Number.POSITIVE_INFINITY, fastest: Number.POSITIVE_INFINITY };
      acc.total += stock;
      if (price !== undefined && price < acc.minPrice) acc.minPrice = price;
      if (lead !== undefined && lead < acc.fastest) acc.fastest = lead;
      vendorIdToTotals.set(row.vendor_id, acc);
    }
    const enriched = (vendors ?? []).map((v) => ({
      ...v,
      categories: Array.from(vendorIdToCategories.get(v.id) ?? new Set<string>()),
      total_inventory: vendorIdToTotals.has(v.id) ? vendorIdToTotals.get(v.id)!.total : 0,
      min_price: vendorIdToTotals.has(v.id) && isFinite(vendorIdToTotals.get(v.id)!.minPrice) ? vendorIdToTotals.get(v.id)!.minPrice : null,
      fastest_lead_time: vendorIdToTotals.has(v.id) && isFinite(vendorIdToTotals.get(v.id)!.fastest) ? vendorIdToTotals.get(v.id)!.fastest : null,
    }));
    return NextResponse.json({ ok: true, vendors: enriched });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

