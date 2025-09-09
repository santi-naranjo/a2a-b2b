import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { vendor_id } = await req.json();
    if (!vendor_id) return NextResponse.json({ ok: false, error: 'vendor_id is required' }, { status: 400 });

    const sample = [
      { sku: 'NIKE-AIR-001', name: 'Nike Air Zoom Pegasus', description: 'Running shoes', brand: 'Nike', category: 'Shoes', price: 120, currency: 'USD', stock: 200, unit: 'pair', lead_time_days: 5 },
      { sku: 'NIKE-AIR-002', name: 'Nike Air Force 1', description: 'Classic sneakers', brand: 'Nike', category: 'Shoes', price: 110, currency: 'USD', stock: 150, unit: 'pair', lead_time_days: 7 },
      { sku: 'NIKE-AIR-003', name: 'Nike Revolution 6', description: 'Everyday running', brand: 'Nike', category: 'Shoes', price: 70, currency: 'USD', stock: 300, unit: 'pair', lead_time_days: 4 }
    ];

    const rows = sample.map(p => ({ ...p, vendor_id }));
    const { data, error } = await supabaseAdmin.from('products').insert(rows).select();
    if (error) throw error;
    return NextResponse.json({ ok: true, count: data?.length || 0, products: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



