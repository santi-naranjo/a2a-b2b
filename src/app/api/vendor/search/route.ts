import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }
  try {
    const { query } = await req.json();
    const term: string = String(query || '').trim();
    if (!term) {
      return NextResponse.json({ ok: true, vendor_ids: [] });
    }

    const like = `%${term}%`;
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('vendor_id', { distinct: true })
      .or(`name.ilike.${like},category.ilike.${like},brand.ilike.${like},sku.ilike.${like}`)
      .limit(5000);
    if (error) throw error;
    const vendorIds = Array.from(new Set((data || []).map((r: any) => r.vendor_id).filter(Boolean)));
    return NextResponse.json({ ok: true, vendor_ids: vendorIds });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


