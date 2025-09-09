import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  try {
    const p = 'then' in context.params ? await context.params : context.params;
    const id = p.id;
    const { data: mission, error } = await supabaseAdmin
      .from('missions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!mission) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
    const { data: items } = await supabaseAdmin
      .from('mission_items')
      .select('*')
      .eq('mission_id', id);
    return NextResponse.json({ ok: true, mission: { ...mission, items: items || [] } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  try {
    const p = 'then' in context.params ? await context.params : context.params;
    const id = p.id;
    const body = await req.json();
    const { name, shipping_address, urgency, items } = body || {};
    if (!name || !shipping_address || !urgency) return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 });
    await supabaseAdmin.from('missions').update({ name, shipping_address, urgency }).eq('id', id);
    if (Array.isArray(items)) {
      await supabaseAdmin.from('mission_items').delete().eq('mission_id', id);
      const toInsert = items.map((it: any) => ({
        mission_id: id,
        product_id: it.product_id || null,
        vendor_id: it.vendor_id || null,
        sku: it.sku || null,
        name: it.name || null,
        quantity: Number(it.quantity) || 1,
      }));
      if (toInsert.length > 0) await supabaseAdmin.from('mission_items').insert(toInsert);
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  try {
    const p = 'then' in context.params ? await context.params : context.params;
    const id = p.id;
    await supabaseAdmin.from('mission_items').delete().eq('mission_id', id);
    await supabaseAdmin.from('missions').delete().eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


