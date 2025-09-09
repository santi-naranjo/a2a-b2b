import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_BUYER_PROMPT = `You are a B2B buyer agent acting on behalf of an organization.\nGoals: understand purchase intent, search vendors and products available to the organization, draft pre-orders, and communicate clearly.\nOnly act within allowed tools. Ask for missing constraints (quantity, delivery location/date, budget).`;

const DEFAULT_NEGOTIATOR_PROMPT = `You are a vendor negotiator agent.\nGoals: negotiate offers, respect vendor constraints (stock, min order, lead times), and respond clearly.\nUse allowed tools to draft counter offers and update pre-orders.`;

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  }

  try {
    const { name, email, company_name, account_type } = await req.json();
    if (!name || !email || !company_name || !account_type) {
      return NextResponse.json({ ok: false, error: 'name, email, company_name, account_type are required' }, { status: 400 });
    }
    if (!['organization','vendor'].includes(account_type)) {
      return NextResponse.json({ ok: false, error: 'account_type must be organization or vendor' }, { status: 400 });
    }

    // Create user and send invite email
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name }
    });
    if (inviteErr) {
      return NextResponse.json({ ok: false, error: `Auth error: ${inviteErr.message}` }, { status: 409 });
    }
    const userId = inviteData.user?.id;
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Failed to create user' }, { status: 500 });
    }

    if (account_type === 'organization') {
      const { data: org, error: orgErr } = await supabaseAdmin
        .from('organizations')
        .insert({ name: company_name })
        .select()
        .single();
      if (orgErr) throw orgErr;

      const { error: memErr } = await supabaseAdmin
        .from('organization_members')
        .insert({ organization_id: org.id, user_id: userId, role: 'owner' });
      if (memErr) throw memErr;

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

      return NextResponse.json({ ok: true, user_id: userId, organization: org, agent, invite_sent: true });
    }

    // vendor account
    const { data: vendor, error: venErr } = await supabaseAdmin
      .from('vendors')
      .insert({ name: company_name })
      .select()
      .single();
    if (venErr) throw venErr;

    const { error: vmemErr } = await supabaseAdmin
      .from('vendor_members')
      .insert({ vendor_id: vendor.id, user_id: userId, role: 'owner' });
    if (vmemErr) throw vmemErr;

    const { data: agent, error: agentErr } = await supabaseAdmin
      .from('agents')
      .insert({
        owner_type: 'vendor',
        owner_id: vendor.id,
        kind: 'negotiator',
        name: 'Default Negotiator Agent',
        system_prompt: DEFAULT_NEGOTIATOR_PROMPT,
        model: 'gpt-4o-mini',
        temperature: 0.2
      })
      .select()
      .single();
    if (agentErr) throw agentErr;

    return NextResponse.json({ ok: true, user_id: userId, vendor, agent, invite_sent: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


