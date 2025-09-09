import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  const { id: conversationId } = await params;
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { id: conversationId } = await params;
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json({ ok: false, error: 'Invalid conversation id' }, { status: 400 });
    }
    const { sender_type, sender_id, role, content, tool_name, tool_payload } = await req.json();
    if (!role || !content) return NextResponse.json({ ok: false, error: 'role and content are required' }, { status: 400 });

    const payload: any = { conversation_id: conversationId, role, content };
    if (sender_type) payload.sender_type = sender_type;
    if (typeof sender_id === 'string') {
      const trimmed = sender_id.trim();
      if (uuidRegex.test(trimmed)) payload.sender_id = trimmed;
    }
    if (tool_name) payload.tool_name = tool_name;
    if (tool_payload) payload.tool_payload = tool_payload;

    const { data: msg, error } = await supabaseAdmin.from('messages').insert(payload).select().single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    // Touch conversation updated_at
    await supabaseAdmin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);

    return NextResponse.json({ ok: true, data: msg });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


