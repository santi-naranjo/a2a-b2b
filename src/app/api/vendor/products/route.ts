import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const vendor_id = searchParams.get('vendor_id');
    if (!vendor_id) {
      return NextResponse.json({ ok: false, error: 'vendor_id is required' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id,name,sku,brand,category,price,stock,lead_time_days,min_order_qty')
      .eq('vendor_id', vendor_id)
      .limit(2000);
    if (error) throw error;
    return NextResponse.json({ ok: true, products: data ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


