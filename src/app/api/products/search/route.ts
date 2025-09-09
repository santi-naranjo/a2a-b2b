import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { q } = await request.json();
    const query: string = (q || '').toString().trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    // Basic tokenization; keep tokens with length >= 3 to avoid noise
    const tokens = Array.from(new Set(
      query
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3)
    ));

    // Build an ilike OR filter across name and brand
    // Note: Supabase JS doesn't support dynamic OR with arrays directly; we compose the filter string
    const orClauses: string[] = [];
    for (const t of tokens) {
      const like = `%${t}%`;
      orClauses.push(`name.ilike.${like}`);
      orClauses.push(`brand.ilike.${like}`);
      orClauses.push(`category.ilike.${like}`);
    }

    let queryBuilder = supabaseAdmin
      .from('products')
      .select('id, vendor_id', { count: 'exact', head: false });

    if (orClauses.length > 0) {
      queryBuilder = queryBuilder.or(orClauses.join(','));
    }

    const { data, error } = await queryBuilder.limit(10000);
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const productCount = Array.isArray(data) ? data.length : 0;
    const vendorCount = Array.isArray(data)
      ? Array.from(new Set((data as Array<{ vendor_id: string }>).map((r) => r.vendor_id))).length
      : 0;

    return NextResponse.json({ vendorCount, productCount });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}


