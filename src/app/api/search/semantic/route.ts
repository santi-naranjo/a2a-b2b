import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
    const { conversation_id, query, vendor_scope = 'approved', limit = 10 } = await req.json();
    if (!query || !conversation_id) return NextResponse.json({ ok: false, error: 'query and conversation_id are required' }, { status: 400 });

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    // Get embedding for the query
    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query })
    });
    if (!embRes.ok) {
      const txt = await embRes.text();
      throw new Error(`Embeddings API error: ${embRes.status} ${txt}`);
    }
    const embJson = await embRes.json();
    const embedding: number[] = embJson?.data?.[0]?.embedding || [];
    if (!embedding.length) return NextResponse.json({ ok: false, error: 'Failed to generate embedding' }, { status: 500 });

    // Call SQL function for semantic search
    const { data, error } = await supabaseAdmin.rpc('semantic_search_products', {
      conv_id: conversation_id,
      query_embedding: embedding as unknown as any,
      scope: vendor_scope,
      limit_count: limit
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, results: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


