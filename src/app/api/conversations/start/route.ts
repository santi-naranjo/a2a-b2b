import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { organization_id, vendor_id, topic } = await req.json();
    if (!organization_id || !vendor_id) return NextResponse.json({ ok: false, error: 'organization_id and vendor_id are required' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({ organization_id, vendor_id, topic: topic || 'New Conversation' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}






