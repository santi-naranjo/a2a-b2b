import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversation_id');
    const organizationId = searchParams.get('organization_id');
    const vendorId = searchParams.get('vendor_id');
    const status = searchParams.get('status');

    let orgId = organizationId || undefined;
    let venId = vendorId || undefined;
    if (conversationId && (!orgId || !venId)) {
      const { data: conv, error: convErr } = await supabaseAdmin
        .from('conversations')
        .select('organization_id, vendor_id')
        .eq('id', conversationId)
        .single();
      if (convErr) throw convErr;
      orgId = orgId || conv?.organization_id || undefined;
      venId = venId || conv?.vendor_id || undefined;
    }

    let q = supabaseAdmin.from('pre_orders').select('*').order('created_at', { ascending: false });
    if (orgId) q = q.eq('organization_id', orgId);
    if (venId) q = q.eq('vendor_id', venId);
    if (status) q = q.eq('status', status);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const body = await req.json();
    const { organization_id, vendor_id, items, notes, currency = 'USD' } = body || {};
    if (!vendor_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'vendor_id and items are required' }, { status: 400 });
    }

    // Resolve org from token if not provided
    let orgId = organization_id || null;
    if (!orgId) {
      const auth = req.headers.get('Authorization');
      if (auth?.startsWith('Bearer ')) {
        const token = auth.slice('Bearer '.length);
        try {
          const { data: user } = await supabaseAdmin.auth.getUser(token);
          const uid = user?.user?.id || null;
          if (uid) {
            const { data: om } = await supabaseAdmin.from('organization_members').select('organization_id').eq('user_id', uid).limit(1);
            orgId = om && om.length > 0 ? (om[0] as any).organization_id : null;
          }
        } catch {}
      }
    }
    if (!orgId) return NextResponse.json({ ok: false, error: 'organization_id not resolved' }, { status: 400 });

    // Compute total, preferring negotiated_unit_price when provided; fallback to product price from DB
    const productIds = items.map((i: any) => i.product_id).filter(Boolean);
    const { data: prods } = productIds.length > 0 ? await supabaseAdmin.from('products').select('id, price').in('id', productIds) : { data: [] as any[] } as any;
    const priceById = new Map<string, number>((prods || []).map((p: any) => [p.id, Number(p.price) || 0]));
    const total = items.reduce((sum: number, it: any) => {
      const unit = (it.negotiated_unit_price != null ? Number(it.negotiated_unit_price) : undefined);
      const base = priceById.get(it.product_id) || 0;
      const unitPrice = !Number.isNaN(unit as number) && unit != null ? (unit as number) : base;
      return sum + unitPrice * (Number(it.quantity) || 1);
    }, 0);

    const { data, error } = await supabaseAdmin
      .from('pre_orders')
      .insert({
        organization_id: orgId,
        vendor_id,
        status: 'draft',
        total_amount: total,
        currency,
        notes: notes || null,
        payload: { items }
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



