import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    // Pick latest org and vendor as demo context
    const [{ data: org, error: orgErr }, { data: vendor, error: venErr }] = await Promise.all([
      supabaseAdmin.from('organizations').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabaseAdmin.from('vendors').select('*').order('created_at', { ascending: false }).limit(1).single()
    ]);
    if (orgErr || !org) throw orgErr || new Error('No organization found');
    if (venErr || !vendor) throw venErr || new Error('No vendor found');

    // Reuse open conversation if exists
    const { data: existing, error: findErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('organization_id', org.id)
      .eq('vendor_id', vendor.id)
      .eq('status', 'open')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findErr) throw findErr;

    if (existing) {
      return NextResponse.json({ ok: true, data: existing, reused: true });
    }

    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .insert({ organization_id: org.id, vendor_id: vendor.id, topic: 'A2A console conversation' })
      .select()
      .single();
    if (convErr) throw convErr;

    return NextResponse.json({ ok: true, data: conv, reused: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


