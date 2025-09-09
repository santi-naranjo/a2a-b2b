import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ['status', 'notes', 'payload', 'total_amount', 'currency'];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) updates[k] = (body as any)[k];
    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: false, error: 'no valid fields' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('pre_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



