import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
    const { batch = 500, concurrency = 10 } = await req.json().catch(() => ({ batch: 500, concurrency: 10 }));
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    let from = 0;
    let totalUpdated = 0;
    while (true) {
      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('id, name, brand, sku, description, category')
        .is('embedding', null)
        .not('vendor_id', 'is', null)
        .range(from, from + batch - 1);
      if (error) throw error;
      if (!products || products.length === 0) break;

      const inputs = products.map((p: any) => [p.brand, p.sku, p.name, p.description, p.category].filter(Boolean).join(' '));
      const embRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs })
      });
      if (!embRes.ok) throw new Error(`Embeddings API error: ${embRes.status}`);
      const embJson = await embRes.json();
      const embeds: number[][] = embJson?.data?.map((d: any) => d.embedding) || [];

      // Update per-row to avoid upsert insert paths that require NOT NULL columns
      let idx = 0;
      while (idx < products.length) {
        const chunk = products.slice(idx, idx + concurrency);
        const ops = chunk.map((p: any, i: number) =>
          supabaseAdmin.from('products').update({ embedding: embeds[idx + i] }).eq('id', p.id)
        );
        const results = await Promise.all(ops);
        for (const r of results) {
          if (r.error) throw r.error;
          totalUpdated += r.count || 0;
        }
        idx += concurrency;
      }

      from += batch;
    }
    return NextResponse.json({ ok: true, updated: totalUpdated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


