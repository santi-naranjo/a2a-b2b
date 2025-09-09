import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Row = {
  sku?: string;
  name?: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: string | number;
  currency?: string;
  stock?: string | number;
  unit?: string;
  lead_time_days?: string | number;
};

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map(h => h.trim());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const row: Record<string, string> = {};
    header.forEach((h, idx) => { row[h] = (parts[idx] || '').trim(); });
    rows.push(row as Row);
  }
  return rows;
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { vendor_id, csv_text } = await req.json();
    if (!vendor_id || !csv_text) return NextResponse.json({ ok: false, error: 'vendor_id and csv_text are required' }, { status: 400 });

    const rows = parseCsv(csv_text);
    if (rows.length === 0) return NextResponse.json({ ok: false, error: 'No rows parsed' }, { status: 400 });

    const inserts = rows.map((r) => ({
      vendor_id,
      sku: r.sku || null,
      name: r.name || 'Unnamed',
      description: r.description || null,
      brand: r.brand || null,
      category: r.category || null,
      price: r.price != null ? Number(r.price) : null,
      currency: r.currency || 'USD',
      stock: r.stock != null ? Number(r.stock) : null,
      unit: r.unit || null,
      lead_time_days: r.lead_time_days != null ? Number(r.lead_time_days) : null
    }));

    const { data, error } = await supabaseAdmin.from('products').insert(inserts).select();
    if (error) throw error;

    return NextResponse.json({ ok: true, inserted: data?.length || 0 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}






