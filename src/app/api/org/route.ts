import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_BUYER_PROMPT = `You are a B2B buyer agent acting on behalf of an organization. 
Goals: understand purchase intent, search vendors and products available to the organization, draft pre-orders, and communicate clearly.
Only act within allowed tools. Ask for missing constraints (quantity, delivery location/date, budget).`;

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  try {
    const { name, user_id, role } = await req.json();
    if (!name) return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });

    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({ name })
      .select()
      .single();
    if (orgErr) throw orgErr;

    if (user_id) {
      const userRole = role && ['owner','admin','member'].includes(role) ? role : 'owner';
      const { error: memErr } = await supabaseAdmin
        .from('organization_members')
        .insert({ organization_id: org.id, user_id, role: userRole });
      if (memErr) throw memErr;
    }

    const { data: agent, error: agentErr } = await supabaseAdmin
      .from('agents')
      .insert({
        owner_type: 'organization',
        owner_id: org.id,
        kind: 'buyer',
        name: 'Default Buyer Agent',
        system_prompt: DEFAULT_BUYER_PROMPT,
        model: 'gpt-4o-mini',
        temperature: 0.2
      })
      .select()
      .single();
    if (agentErr) throw agentErr;

    return NextResponse.json({ ok: true, organization: org, agent });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


