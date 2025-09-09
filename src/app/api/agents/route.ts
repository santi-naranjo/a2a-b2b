import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const ownerType = searchParams.get('owner_type') as 'organization' | 'vendor' | null;
  const ownerId = searchParams.get('owner_id');

  let query = supabaseAdmin.from('agents').select('*');
  if (ownerType && ownerId) {
    query = query.eq('owner_type', ownerType).eq('owner_id', ownerId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    // Authenticate request with Supabase token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userRes?.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { id, system_prompt } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: 'id is required' }, { status: 400 });

    // Load agent and authorize membership
    const { data: agent, error: aErr } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();
    if (aErr || !agent) return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 });

    const userId = userRes.user.id;
    let allowed = false;
    if (agent.owner_type === 'vendor') {
      const { data: mem } = await supabaseAdmin
        .from('vendor_members')
        .select('id')
        .eq('vendor_id', agent.owner_id)
        .eq('user_id', userId)
        .maybeSingle();
      allowed = Boolean(mem);
    } else if (agent.owner_type === 'organization') {
      const { data: mem } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', agent.owner_id)
        .eq('user_id', userId)
        .maybeSingle();
      allowed = Boolean(mem);
    }
    if (!allowed) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof system_prompt === 'string') updateFields.system_prompt = system_prompt;

    const { data, error } = await supabaseAdmin
      .from('agents')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


