import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type DbMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
};

type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
    });
    if (!res.ok) return null;
    const json = await res.json();
    const vec = json?.data?.[0]?.embedding as number[] | undefined;
    return Array.isArray(vec) ? vec : null;
  } catch {
    return null;
  }
}

async function searchProducts(params: { conversation_id: string; query?: string; limit?: number }) {
  const { conversation_id, query, limit = 10 } = params;
  const { data: conv, error: convErr } = await supabaseAdmin
    .from('conversations')
    .select('id, organization_id, vendor_id')
    .eq('id', conversation_id)
    .single();
  if (convErr || !conv) throw convErr || new Error('Conversation not found');

  // Try semantic search via pgvector if query provided
  if (query && query.trim().length > 0 && process.env.OPENAI_API_KEY) {
    const embedding = await generateEmbedding(query.trim(), process.env.OPENAI_API_KEY);
    if (embedding) {
      try {
        const { data, error } = await supabaseAdmin.rpc('semantic_search_products', {
          conv_id: conversation_id,
          query_embedding: embedding as unknown as any,
          scope: 'default',
          limit_count: limit
        });
        if (!error && data) return { products: data };
      } catch {}
    }
  }

  // Fallback to relational + ilike
  let base = supabaseAdmin
    .from('products')
    .select('id, vendor_id, sku, name, description, brand, category, price, currency, stock, lead_time_days')
    .limit(limit);

  if (conv.vendor_id) base = base.eq('vendor_id', conv.vendor_id);
  // Only apply organization-approved vendor filter when the conversation is NOT vendor-scoped
  if (!conv.vendor_id && conv.organization_id) {
    const approved = (
      await supabaseAdmin
        .from('organization_vendors')
        .select('vendor_id')
        .eq('organization_id', conv.organization_id)
        .eq('status', 'approved')
    ).data?.map((r: any) => r.vendor_id) || [];
    if (approved.length > 0) base = base.in('vendor_id', approved);
  }

  if (query && query.trim().length > 0) {
    const q = query.trim();
    const like = `%${q.replace(/[%]/g, '')}%`;
    base = base.or(
      [
        `sku.ilike.${like}`,
        `name.ilike.${like}`,
        `brand.ilike.${like}`,
        `category.ilike.${like}`
      ].join(',')
    );
  }

  const { data, error } = await base;
  if (error) throw error;
  return { products: data };
}

async function listVendors(params: { conversation_id?: string; organization_id?: string; limit?: number }) {
  const { conversation_id, organization_id, limit = 20 } = params;
  let orgId = organization_id;
  if (!orgId && conversation_id) {
    const { data: conv } = await supabaseAdmin
      .from('conversations')
      .select('organization_id')
      .eq('id', conversation_id)
      .single();
    orgId = conv?.organization_id || undefined;
  }

  if (orgId) {
    const { data, error } = await supabaseAdmin
      .from('organization_vendors')
      .select('vendor:vendors(id, name, website, contact_email)')
      .eq('organization_id', orgId)
      .eq('status', 'approved')
      .limit(limit);
    if (error) throw error;
    return { vendors: (data || []).map((r: any) => r.vendor) };
  }
  const { data, error } = await supabaseAdmin.from('vendors').select('id, name, website, contact_email').limit(limit);
  if (error) throw error;
  return { vendors: data };
}

async function createPreOrder(params: {
  conversation_id: string;
  vendor_id?: string;
  vendor_name?: string;
  items: Array<{ product_id: string; quantity: number }>;
  notes?: string;
  currency?: string;
}) {
  const { conversation_id, vendor_id: inputVendorId, vendor_name, items, notes, currency = 'USD' } = params;
  if (!items || items.length === 0) throw new Error('items required');

  const { data: conv, error: convErr } = await supabaseAdmin
    .from('conversations')
    .select('organization_id')
    .eq('id', conversation_id)
    .single();
  if (convErr || !conv?.organization_id) throw convErr || new Error('Conversation missing organization');

  // Resolve vendor id if missing or if name provided
  let vendorId: string | null = inputVendorId || null;
  if (!vendorId && vendor_name) {
    const { data: v } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .ilike('name', `%${vendor_name}%`)
      .limit(1)
      .maybeSingle();
    vendorId = v?.id || null;
  }

  // Normalize product identifiers: accept UUID, SKU, or Name (best-effort match within vendor)
  const normalizedItems: Array<{ product_id: string; quantity: number }> = [];
  for (const item of items) {
    const pid = String(item.product_id);
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(pid);
    if (isUuid) {
      normalizedItems.push({ product_id: pid, quantity: Number(item.quantity) || 1 });
      continue;
    }
    // Try match by SKU first
    let found: any = null;
    // If vendorId known, search within it first
    if (vendorId) {
      let { data: bySku } = await supabaseAdmin
        .from('products')
        .select('id, price, vendor_id')
        .eq('vendor_id', vendorId)
        .eq('sku', pid)
        .limit(1);
      if (bySku && bySku.length > 0) found = bySku[0];
    } else {
      let { data: bySkuAny } = await supabaseAdmin
        .from('products')
        .select('id, price, vendor_id')
        .eq('sku', pid)
        .limit(1);
      if (bySkuAny && bySkuAny.length > 0) found = bySkuAny[0];
    }
    // note: any bySku variables are scoped above; do not reference them here
    if (!found) {
      // Attempt name ilike within vendor (if known) else across approved vendors
      if (vendorId) {
        const { data: byName } = await supabaseAdmin
          .from('products')
          .select('id, price, vendor_id')
          .eq('vendor_id', vendorId)
          .ilike('name', `%${pid}%`)
          .limit(1);
        if (byName && byName.length > 0) found = byName[0];
      }
      if (!found) {
        // Find across approved vendors of org
        const approved = (
          await supabaseAdmin
            .from('organization_vendors')
            .select('vendor_id')
            .eq('organization_id', conv.organization_id)
            .eq('status', 'approved')
        ).data?.map((r: any) => r.vendor_id) || [];
        const { data: byNameAny } = await supabaseAdmin
          .from('products')
          .select('id, price, vendor_id')
          .in('vendor_id', approved)
          .ilike('name', `%${pid}%`)
          .limit(1);
        if (byNameAny && byNameAny.length > 0) found = byNameAny[0];
      }
    }
    if (!found) throw new Error(`Product not found for identifier: ${pid}`);
    if (!vendorId) vendorId = found.vendor_id;
    normalizedItems.push({ product_id: found.id, quantity: Number(item.quantity) || 1 });
  }

  const productIds = normalizedItems.map((i) => i.product_id);
  const { data: prods, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, price')
    .in('id', productIds);
  if (prodErr) throw prodErr;

  const priceById = new Map<string, number>((prods || []).map((p: any) => [p.id, Number(p.price) || 0]));
  const total = normalizedItems.reduce((sum, i) => sum + (priceById.get(i.product_id) || 0) * i.quantity, 0);

  const payload = { items };
  // Idempotency: reuse very recent identical draft
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
      .from('pre_orders')
      .select('id, total_amount, notes, payload, created_at')
      .eq('organization_id', conv.organization_id)
      .eq('vendor_id', vendorId)
      .eq('status', 'draft')
      .gt('created_at', twoMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const recentItems = recent?.payload?.items;
    const sameItems = recentItems && JSON.stringify(recentItems) === JSON.stringify(normalizedItems);
    const sameTotal = recent && Number(recent.total_amount) === Number(total);
    const sameNotes = (recent?.notes || '') === (notes || '');
    if (recent && sameItems && sameTotal && sameNotes) {
      return { pre_order: recent };
    }
  } catch {}
  const { data, error } = await supabaseAdmin
    .from('pre_orders')
    .insert({
      organization_id: conv.organization_id,
      vendor_id: vendorId,
      status: 'draft',
      total_amount: total,
      currency,
      notes: notes || null,
      payload: { items: normalizedItems }
    })
    .select()
    .single();
  if (error) throw error;
  return { pre_order: data };
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ ok: false, error: 'Supabase admin not configured' }, { status: 500 });
  try {
    const { conversation_id } = await req.json();
    if (!conversation_id) return NextResponse.json({ ok: false, error: 'conversation_id is required' }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY not configured' }, { status: 500 });

    // Load conversation
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();
    if (convErr || !conv) throw convErr || new Error('Conversation not found');

    // Resolve agent:
    // Prefer vendor negotiator if the conversation is linked to a vendor; else use org buyer.
    // Fallbacks: if preferred not found, try the other side when both ids exist.
    let agent: any = null;
    if (conv.vendor_id) {
      const resVendor = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('owner_type', 'vendor')
        .eq('owner_id', conv.vendor_id)
        .eq('kind', 'negotiator')
        .limit(1)
        .maybeSingle();
      agent = resVendor.data;
      if (!agent && conv.organization_id) {
        const resOrg = await supabaseAdmin
          .from('agents')
          .select('*')
          .eq('owner_type', 'organization')
          .eq('owner_id', conv.organization_id)
          .eq('kind', 'buyer')
          .limit(1)
          .maybeSingle();
        agent = resOrg.data;
      }
      if (!agent) throw new Error('No suitable agent found for conversation (vendor negotiator nor org buyer)');
    } else if (conv.organization_id) {
      const resOrg = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('owner_type', 'organization')
        .eq('owner_id', conv.organization_id)
        .eq('kind', 'buyer')
        .limit(1)
        .maybeSingle();
      agent = resOrg.data;
      if (!agent) throw new Error('Buyer agent not found for organization');
    } else {
      throw new Error('Conversation missing organization and vendor context');
    }

    // Fetch latest messages
    const { data: msgs, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(50);
    if (msgErr) throw msgErr;

    const history: DbMessage[] = (msgs || []).map((m: any) => ({ role: m.role, content: m.content }));

    // Compose system/tooling prompt
    const toolGuide = `You are a B2B procurement agent. YOU MUST use tools before answering.
TOOLS:
- search_products(query?: string, limit?: number): search available products. If query is missing or vague, call with an empty query to list the top products for the current vendor (or approved vendors for the org).
- list_vendors(limit?: number): list approved vendors for the organization.
- create_pre_order(vendor_id: string, items: {product_id: string, quantity: number}[], notes?: string): draft a pre-order.
POLICY:
- For requests about disponibilidad/catálogo (e.g., "qué productos tienes disponibles", marcas, SKUs, categorías), call search_products first. If the request is vaga, puedes llamar search_products con query vacía para snapshot.
- If the user asks about price or total and there is an implied/recent product or SKU in the conversation, call search_products with that exact SKU/name, then compute a concise price summary (unit price x quantity, stock check) instead of listing unrelated products.
- If search returns zero, call list_vendors and propose next steps or alternative categories.
- Only after user confirms quantities and vendor, call create_pre_order.
STYLE:
- Reply in the user's language (detect from latest user message). When listing products, show name, brand (if any), SKU (if any), price and stock in a compact bulleted list.`;

    // Vendor-scoped chat specialization
    const vendorScopeNote = conv.vendor_id
      ? `\nIMPORTANT: This conversation is vendor-scoped. You MUST restrict all product searches to THIS vendor only and NEVER list organization-approved vendors.`
      : '';

    let messages: any[] = [
      { role: 'system', content: toolGuide + vendorScopeNote + '\n' + (agent.system_prompt as string) },
      ...history
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'search_products',
          description: 'Search products. In vendor-scoped chats, only search that vendor. In org-only chats, search approved vendors.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              limit: { type: 'number' }
            }
          }
        }
      },
      ...(conv.vendor_id ? [] : [{
        type: 'function',
        function: {
          name: 'list_vendors',
          description: 'List approved vendors for the conversation organization',
          parameters: { type: 'object', properties: { limit: { type: 'number' } } }
        }
      }]),
      {
        type: 'function',
        function: {
          name: 'create_pre_order',
          description: 'Create a draft pre-order for a vendor with product items',
          parameters: {
            type: 'object',
            required: ['items'],
            properties: {
              vendor_id: { type: 'string' },
              vendor_name: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['product_id', 'quantity'],
                  properties: {
                    product_id: { type: 'string' },
                    quantity: { type: 'number' }
                  }
                }
              },
              notes: { type: 'string' }
            }
          }
        }
      }
    ];

    // Tool-calling loop
    let safety = 0;
    let finalContent: string | null = null;
    let lastCatalog: Array<{ id: string; sku?: string; name?: string; brand?: string; price?: number; stock?: number }> | null = null;
    let lastVendors: Array<{ id: string; name: string }> | null = null;
    let createdPreOrderId: string | null = null;
    while (safety++ < 4) {
      const messagesForApi = messages.map((m) => {
        const c: any = { ...m };
        if (Array.isArray(c.tool_calls) && c.tool_calls.length === 0) {
          delete c.tool_calls;
        }
        return c;
      });

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: agent.model || 'gpt-4o-mini',
          messages: messagesForApi,
          tools,
          tool_choice: 'auto',
          temperature: agent.temperature ?? 0.2,
          max_tokens: 700
        })
      });
      if (!openaiRes.ok) {
        const txt = await openaiRes.text();
        throw new Error(`OpenAI error: ${openaiRes.status} ${txt}`);
      }
      const data = await openaiRes.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const toolCalls: ToolCall[] = msg?.tool_calls || [];
      let toolCallsToRun: ToolCall[] = toolCalls;

      if (toolCalls.length === 0) {
        // If user asked about products/price/SKU and model didn't call tools, force a search with the latest user text
        const lastUserRaw = [...messages].reverse().find((m:any) => m.role === 'user')?.content
          || [...history].reverse().find(m => m.role==='user')?.content
          || '';
        const lastUser = lastUserRaw.toLowerCase();
        const shouldForceSearch = /disponible|disponibles|productos|stock|inventario|sku|marca|category|categor[ií]a|precio|brand|available/.test(lastUser);
        if (shouldForceSearch) {
          const forced: ToolCall[] = [{ id: 'forced-1', type: 'function', function: { name: 'search_products', arguments: JSON.stringify({ query: lastUserRaw, limit: 10 }) } }];
          messages.push({ role: 'assistant', content: '', tool_calls: forced });
          toolCallsToRun = forced;
        } else {
          finalContent = msg?.content || 'I could not generate a response.';
          messages.push({ role: 'assistant', content: finalContent });
          break;
        }
      }

      if (toolCalls.length > 0) {
        // Add assistant tool-call message first (only if model actually requested)
        messages.push({ role: 'assistant', content: msg?.content || '', tool_calls: toolCalls });
      }

      // Execute tools serially and append tool results
      for (const call of toolCallsToRun) {
        const name = call.function.name;
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || '{}'); } catch {}
        let result: any = {};
        if (name === 'search_products') {
          result = await searchProducts({ conversation_id, query: args.query, limit: args.limit });
          // capture for fallback summary
          lastCatalog = (result?.products || []).map((p: any) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            brand: p.brand,
            price: typeof p.price === 'number' ? p.price : undefined,
            stock: typeof p.stock === 'number' ? p.stock : undefined
          }));
        } else if (name === 'list_vendors') {
          result = await listVendors({ conversation_id, limit: args.limit });
          lastVendors = result?.vendors || null;
        } else if (name === 'create_pre_order') {
          if (createdPreOrderId) {
            result = { info: 'pre_order_already_created', id: createdPreOrderId };
          } else {
            const vendorIdRegex = /^[0-9a-fA-F-]{36}$/;
            const parsedVendorId = typeof args.vendor_id === 'string' && vendorIdRegex.test(args.vendor_id) ? args.vendor_id : undefined;
            const parsedVendorName = parsedVendorId ? (args.vendor_name || undefined) : (args.vendor_name || args.vendor_id || undefined);
            const created = await createPreOrder({ conversation_id, vendor_id: parsedVendorId, vendor_name: parsedVendorName, items: args.items, notes: args.notes });
            result = created;
            createdPreOrderId = created?.pre_order?.id || null;
          }
        } else {
          result = { error: `Unknown tool ${name}` };
        }
        messages.push({ role: 'tool', tool_call_id: call.id, name, content: JSON.stringify(result) });
      }
    }

    if (!finalContent) {
      // Fallback textual summary from the latest tool results
      if (lastCatalog && lastCatalog.length > 0) {
        // Prefer a focused answer if last user referenced a specific SKU/name
        const lastUserRaw = [...history, { role: 'user', content: (messages || []).slice(-1)[0]?.content || '' } as DbMessage]
          .reverse()
          .find(m => m.role === 'user')?.content || '';
        const tokens = (lastUserRaw.match(/[A-Z0-9-]{4,}/gi) || []).map(t => t.toLowerCase());
        const lower = lastUserRaw.toLowerCase();
        const exact = lastCatalog.find(p => p.sku && tokens.includes(p.sku.toLowerCase()))
          || lastCatalog.find(p => p.name && lower.includes(p.name.toLowerCase()));
        if (exact) {
          const parts: string[] = [];
          if (exact.name) parts.push(exact.name);
          if (exact.brand) parts.push(`(${exact.brand})`);
          if (exact.sku) parts.push(`SKU: ${exact.sku}`);
          if (typeof exact.price === 'number') parts.push(`$${exact.price}`);
          if (typeof exact.stock === 'number') parts.push(`${exact.stock} units disponibles`);
          finalContent = `Encontré el producto solicitado: ${parts.join(' • ')}.\n¿Cuántas unidades necesitas y a qué ciudad/país debo cotizar el envío?`;
        }
      }
      if (!finalContent && lastCatalog && lastCatalog.length > 0) {
        const items = lastCatalog.slice(0, 8).map((p) => {
          const parts: string[] = [];
          if (p.name) parts.push(p.name);
          if (p.brand) parts.push(`(${p.brand})`);
          if (p.sku) parts.push(`SKU: ${p.sku}`);
          if (typeof p.price === 'number') parts.push(`$${p.price}`);
          if (typeof p.stock === 'number') parts.push(`${p.stock} units`);
          return `- ${parts.join(' • ')}`;
        }).join('\n');
        finalContent = items.length > 0 ? `Estos son algunos productos disponibles:\n${items}\n\n¿Quieres que filtre por cantidad, precio o marca específica?` : null;
      } else if (!finalContent && lastVendors && lastVendors.length > 0) {
        const items = lastVendors.slice(0, 8).map((v) => `- ${v.name}`).join('\n');
        finalContent = `No encontré productos, pero estos vendors están disponibles:\n${items}\n\n¿Deseas que busque productos dentro de alguno de ellos?`;
      }
    }

    const content = finalContent || 'I could not generate a response.';

    // Persist assistant message
    const senderType = agent.owner_type === 'vendor' ? 'negotiator_agent' : 'buyer_agent';
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id, sender_type: senderType as any, role: 'assistant', content })
      .select()
      .single();
    if (insErr) throw insErr;

    await supabaseAdmin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversation_id);

    return NextResponse.json({ ok: true, content, message: inserted });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
    console.error('MCP respond error:', e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


