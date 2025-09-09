import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { items, shipping, urgency } = await req.json();
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ ok: false, error: 'items required' }, { status: 400 });

    // Resolve org from token (optional enhancement: infer from default conversation policy)
    const auth = req.headers.get('Authorization');
    let orgId: string | null = null;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      try {
        const { data: user } = await supabaseAdmin.auth.getUser(token);
        if (user?.user?.id) {
          const { data: om } = await supabaseAdmin.from('organization_members').select('organization_id').eq('user_id', user.user.id).limit(1);
          orgId = om && om.length > 0 ? (om[0] as any).organization_id : null;
        }
      } catch {}
    }

    // Resolve candidate vendors per item by product lookup
    // 1) exact SKU fast path
    const skuList = items.map((i: any) => i.sku).filter(Boolean);
    const { data: bySku } = skuList.length > 0
      ? await supabaseAdmin.from('products').select('id, vendor_id, sku, name, price, stock, lead_time_days').in('sku', skuList)
      : { data: [] as any[] } as any;
    let productRows: any[] = bySku || [];
    // 2) fallback by ilike name/brand/category for items without SKU match
    for (const it of items) {
      if (it.sku && productRows.find((p: any) => p.sku === it.sku)) continue;
      const term = (it.name || it.sku || '').toString().trim();
      if (!term) continue;
      const like = `%${term}%`;
      const { data: byName } = await supabaseAdmin
        .from('products')
        .select('id, vendor_id, sku, name, price, stock, lead_time_days')
        .or(`sku.ilike.${like},name.ilike.${like},brand.ilike.${like},category.ilike.${like}`)
        .limit(20);
      productRows.push(...(byName || []));
    }

    // Group items by vendor candidates
    const vendorIdToItems = new Map<string, any[]>();
    for (const it of items) {
      const matches = productRows.filter((p) => p.sku === it.sku);
      for (const m of matches) {
        if (!vendorIdToItems.has(m.vendor_id)) vendorIdToItems.set(m.vendor_id, []);
        const list = vendorIdToItems.get(m.vendor_id)!;
        // Deduplicate same product per vendor (can occur due to fallback query also returning the same SKU)
        const exists = list.find((x) => x.product_id === m.id || (x.sku && x.sku === m.sku));
        if (exists) {
          // Ensure quantity reflects the mission request (don't duplicate line)
          exists.quantity = Number(it.quantity) || exists.quantity || 1;
          continue;
        }
        list.push({ product_id: m.id, name: m.name, sku: m.sku, price: Number(m.price)||0, quantity: Number(it.quantity)||1, stock: m.stock, lead_time_days: m.lead_time_days });
      }
    }

    // Build simple offers (sum prices) as a first functional pass; later we can call OpenAI to negotiate
    const offers = Array.from(vendorIdToItems.entries()).map(([vendor_id, list]) => {
      const total = list.reduce((s, it) => s + (it.price||0) * (it.quantity||1), 0);
      return { vendor_id, vendor_name: vendor_id, total_amount: total, items: list };
    });
    // Enrich vendor names
    const vendorIds = offers.map(o => o.vendor_id);
    if (vendorIds.length > 0) {
      const { data: vrows } = await supabaseAdmin.from('vendors').select('id,name').in('id', vendorIds);
      const map = new Map((vrows||[]).map((v:any)=>[v.id, v.name]));
      for (const o of offers) o.vendor_name = map.get(o.vendor_id) || o.vendor_id;
    }

    // For each vendor, create/reuse a conversation and ask Buyer Agent for an RFQ reply
    const host = req.headers.get('host');
    for (const o of offers) {
      try {
        let convId: string | null = null;
        if (orgId) {
          // Reuse existing conversation if any
          const { data: existing } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('organization_id', orgId)
            .eq('vendor_id', o.vendor_id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (existing?.id) convId = existing.id;
          if (!convId) {
            const { data: created } = await supabaseAdmin
              .from('conversations')
              .insert({ organization_id: orgId, vendor_id: o.vendor_id, topic: `RFQ ${new Date().toISOString()}` })
              .select('*')
              .single();
            convId = created?.id || null;
          }
        }
        if (!convId) continue;
        // Insert a user RFQ message
        const lines = o.items.map((it: any) => `- ${it.name || it.sku || it.product_id}: qty ${it.quantity}`).join('\n');
        const rfq = `Please provide a quotation for these items:\n${lines}\nShipping address: ${shipping?.address || 'N/A'}\nUrgency: ${urgency || 'not_urgent'}.`;
        await supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'user', sender_type: 'user', content: rfq });
        // Ask agent
        if (host) {
          const url = `http://${host}/api/mcp/respond`;
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: convId }) });
          const json = await res.json();
          if (res.ok && json?.ok) {
            o['agent_response'] = json.content;
          }
        }
      } catch {}
    }

    // Recommend lowest total for now
    const recommended_vendor = offers.length > 0 ? offers.reduce((a,b)=> (a.total_amount<=b.total_amount? a: b)).vendor_id : null;
    return NextResponse.json({ ok: true, offers, recommended_vendor });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


