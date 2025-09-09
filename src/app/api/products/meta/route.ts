import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const [{ data: brandsRows }, { data: catRows }, { data: agg }] = await Promise.all([
      supabaseAdmin.from('products').select('brand').not('brand', 'is', null),
      supabaseAdmin.from('products').select('category').not('category', 'is', null),
      supabaseAdmin
        .from('products')
        .select('min(price) as price_min, max(price) as price_max, min(stock) as stock_min, max(stock) as stock_max, min(lead_time_days) as lead_min, max(lead_time_days) as lead_max')
        .single()
    ]);

    const brands = Array.from(new Set((brandsRows || []).map((r: any) => r.brand).filter(Boolean))).sort();
    const categories = Array.from(new Set((catRows || []).map((r: any) => r.category).filter(Boolean))).sort();
    const bounds = {
      price: { min: Number(agg?.price_min ?? 0) || 0, max: Number(agg?.price_max ?? 0) || 0 },
      stock: { min: Number(agg?.stock_min ?? 0) || 0, max: Number(agg?.stock_max ?? 0) || 0 },
      lead: { min: Number(agg?.lead_min ?? 0) || 0, max: Number(agg?.lead_max ?? 0) || 0 }
    };

    return NextResponse.json({ ok: true, brands, categories, bounds });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


