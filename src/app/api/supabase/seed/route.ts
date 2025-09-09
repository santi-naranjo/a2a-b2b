import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(_req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  try {
    // Create a demo organization and vendor with minimal fields
    const orgName = 'Demo Org';
    const vendorName = 'Demo Vendor';

    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({ name: orgName })
      .select()
      .single();
    if (orgErr) throw orgErr;

    const { data: vendor, error: venErr } = await supabaseAdmin
      .from('vendors')
      .insert({ name: vendorName })
      .select()
      .single();
    if (venErr) throw venErr;

    return NextResponse.json({ ok: true, org, vendor });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


