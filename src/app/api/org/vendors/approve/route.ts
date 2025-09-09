import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { organization_id, vendor_id } = await req.json();
    if (!organization_id || !vendor_id) return NextResponse.json({ ok: false, error: 'organization_id and vendor_id are required' }, { status: 400 });

    // Upsert relationship as approved
    const { data: existing, error: selErr } = await supabaseAdmin
      .from('organization_vendors')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('vendor_id', vendor_id)
      .maybeSingle();
    if (selErr) throw selErr;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('organization_vendors')
        .update({ status: 'approved' })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, data, updated: true });
    }

    const { data, error } = await supabaseAdmin
      .from('organization_vendors')
      .insert({ organization_id, vendor_id, status: 'approved' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data, updated: false });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



