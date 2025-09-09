import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const auth = req.headers.get('Authorization');
    let userId: string | null = null;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data?.user?.id || null;
    }

    let orgId: string | null = null;
    let vendorId: string | null = null;
    if (userId) {
      const { data: om } = await supabaseAdmin.from('organization_members').select('organization_id').eq('user_id', userId).limit(1);
      orgId = om && om.length > 0 ? (om[0] as any).organization_id : null;
      const { data: vm } = await supabaseAdmin.from('vendor_members').select('vendor_id').eq('user_id', userId).limit(1);
      vendorId = vm && vm.length > 0 ? (vm[0] as any).vendor_id : null;
    }

    const vendors = await supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true });
    const products = await supabaseAdmin.from('products').select('id', { count: 'exact', head: true });
    // Total inventory across all vendors (sum of stock)
    let inventoryTotal = 0;
    try {
      const { data: stockRows } = await supabaseAdmin.from('products').select('stock');
      inventoryTotal = (stockRows || []).reduce((s: number, r: any) => s + (Number(r?.stock) || 0), 0);
    } catch {}
    const missions = orgId
      ? await supabaseAdmin.from('missions').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
      : { count: 0 } as any;

    // Conversations: any linked to org or vendor
    let conversationsCount = 0;
    if (orgId || vendorId) {
      const filters: string[] = [];
      if (orgId) filters.push(`organization_id.eq.${orgId}`);
      if (vendorId) filters.push(`vendor_id.eq.${vendorId}`);
      const q = supabaseAdmin.from('conversations').select('id', { count: 'exact', head: true });
      // @ts-ignore
      if (filters.length === 1) {
        // @ts-ignore
        const conv = await q.or(filters[0]);
        conversationsCount = conv.count || 0;
      } else if (filters.length === 2) {
        // @ts-ignore
        const conv = await q.or(filters.join(','));
        conversationsCount = conv.count || 0;
      }
    }

    // Orders: by org or vendor
    let ordersCount = 0;
    if (orgId || vendorId) {
      const filters: string[] = [];
      if (orgId) filters.push(`organization_id.eq.${orgId}`);
      if (vendorId) filters.push(`vendor_id.eq.${vendorId}`);
      const q = supabaseAdmin.from('pre_orders').select('id', { count: 'exact', head: true });
      // @ts-ignore
      if (filters.length === 1) {
        // @ts-ignore
        const ord = await q.or(filters[0]);
        ordersCount = ord.count || 0;
      } else if (filters.length === 2) {
        // @ts-ignore
        const ord = await q.or(filters.join(','));
        ordersCount = ord.count || 0;
      }
    }

    return NextResponse.json({
      ok: true,
      stats: {
        vendors: vendors.count || 0,
        products: products.count || 0,
        missions: missions.count || 0,
        conversations: conversationsCount,
        orders: ordersCount,
        inventoryTotal,
      }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


