import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organization_id');
  const vendorId = searchParams.get('vendor_id');

  let query = supabaseAdmin.from('conversations').select('*').order('updated_at', { ascending: false });
  if (organizationId) query = query.eq('organization_id', organizationId);
  if (vendorId) query = query.eq('vendor_id', vendorId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Enrich with organization names for vendor view
  const orgIds = Array.from(new Set((data || []).map((c: any) => c.organization_id).filter(Boolean)));
  let orgMap: Record<string, string> = {};
  if (orgIds.length > 0) {
    const { data: orgs } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);
    orgMap = Object.fromEntries((orgs || []).map((o: any) => [o.id, o.name]));
  }
  const enriched = (data || []).map((c: any) => ({ ...c, organization_name: orgMap[c.organization_id || ''] || null }));
  return NextResponse.json({ ok: true, data: enriched });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const {
      organization_id,
      vendor_id,
      buyer_agent_id,
      negotiator_agent_id,
      topic,
      created_by_user
    } = await req.json();

    if (!organization_id && !vendor_id) {
      return NextResponse.json({ ok: false, error: 'organization_id or vendor_id is required' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    const convPayload: any = { topic };
    if (vendor_id && typeof vendor_id === 'string' && uuidRegex.test(vendor_id)) convPayload.vendor_id = vendor_id;
    if (organization_id && typeof organization_id === 'string' && uuidRegex.test(organization_id)) convPayload.organization_id = organization_id;
    if (buyer_agent_id && typeof buyer_agent_id === 'string' && uuidRegex.test(buyer_agent_id)) convPayload.buyer_agent_id = buyer_agent_id;
    if (negotiator_agent_id && typeof negotiator_agent_id === 'string' && uuidRegex.test(negotiator_agent_id)) convPayload.negotiator_agent_id = negotiator_agent_id;
    if (created_by_user && typeof created_by_user === 'string' && uuidRegex.test(created_by_user)) convPayload.created_by_user = created_by_user;

    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .insert(convPayload)
      .select()
      .single();
    if (convErr) throw convErr;

    return NextResponse.json({ ok: true, data: conv });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


