import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }
  try {
    const { organization_id, vendor_id } = await req.json();
    if (!organization_id || !vendor_id) {
      return NextResponse.json({ ok: false, error: 'organization_id and vendor_id are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('organization_vendors')
      .delete()
      .eq('organization_id', organization_id)
      .eq('vendor_id', vendor_id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


