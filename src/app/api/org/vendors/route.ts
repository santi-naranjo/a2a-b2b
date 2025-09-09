import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { searchParams } = new URL(req.url);
    const organization_id = searchParams.get('organization_id');
    if (!organization_id) return NextResponse.json({ ok: false, error: 'organization_id is required' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('organization_vendors')
      .select('vendor:vendors(id,name)')
      .eq('organization_id', organization_id)
      .eq('status', 'approved');
    if (error) throw error;
    const vendors = (data || []).map((r: any) => r.vendor).filter((v: any) => v && v.id && v.name);
    return NextResponse.json({ ok: true, vendors });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


