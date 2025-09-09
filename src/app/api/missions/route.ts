import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getOrgIdFromAuth(req: NextRequest): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  try {
    const { data: user } = await supabaseAdmin.auth.getUser(token);
    const userId = user?.user?.id;
    if (!userId) return null;
    const { data: om } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1);
    return om && om.length > 0 ? (om[0] as any).organization_id : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  const orgId = await getOrgIdFromAuth(req);
  if (!orgId) return NextResponse.json({ ok: false, error: 'No organization' }, { status: 401 });
  const { data: missions, error } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const ids = (missions || []).map((m: any) => m.id);
  const { data: items } = ids.length > 0
    ? await supabaseAdmin.from('mission_items').select('*').in('mission_id', ids)
    : { data: [] as any[] } as any;
  const missionIdToItems = new Map<string, any[]>();
  for (const it of items || []) {
    if (!missionIdToItems.has(it.mission_id)) missionIdToItems.set(it.mission_id, []);
    missionIdToItems.get(it.mission_id)!.push(it);
  }
  const payload = (missions || []).map((m: any) => ({ ...m, items: missionIdToItems.get(m.id) || [] }));
  return NextResponse.json({ ok: true, missions: payload });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 });
  try {
    const { name, shipping_address, urgency, items } = await req.json();
    if (!name || typeof name !== 'string' || name.trim() === '') return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
    if (!shipping_address || typeof shipping_address !== 'string' || shipping_address.trim() === '') return NextResponse.json({ ok: false, error: 'shipping_address required' }, { status: 400 });
    if (!urgency || (urgency !== 'not_urgent' && urgency !== 'urgent')) return NextResponse.json({ ok: false, error: 'urgency required' }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ ok: false, error: 'items required' }, { status: 400 });
    const orgId = await getOrgIdFromAuth(req);
    if (!orgId) return NextResponse.json({ ok: false, error: 'No organization' }, { status: 401 });
    const auth = req.headers.get('Authorization');
    let userId: string | null = null;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const { data: user } = await supabaseAdmin.auth.getUser(token);
      userId = user?.user?.id || null;
    }
    const { data: mission, error } = await supabaseAdmin
      .from('missions')
      .insert({ organization_id: orgId, name, shipping_address: shipping_address.trim(), urgency, created_by: userId })
      .select('*')
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    const toInsert = items.map((it: any) => ({
      mission_id: mission.id,
      product_id: it.product_id || null,
      vendor_id: it.vendor_id || null,
      sku: it.sku || null,
      name: it.name || null,
      quantity: Number(it.quantity) || 1,
    }));
    if (toInsert.length > 0) {
      await supabaseAdmin.from('mission_items').insert(toInsert);
    }
    return NextResponse.json({ ok: true, mission_id: mission.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


