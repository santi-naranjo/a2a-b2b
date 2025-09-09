"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MissionItem = { product_id?: string; sku?: string | null; name?: string | null; vendor_id?: string | null; quantity: number };

type Offer = {
  vendor_id: string;
  vendor_name: string;
  total_amount: number;
  items: Array<{ product_id: string; name: string; sku: string | null; price: number; quantity: number; stock: number | null; lead_time_days: number | null }>;
  agent_response?: string;
};

interface MissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: MissionItem | null;
  onOpenChat?: (vendor: { id: string; name: string }) => void;
}

export function MissionModal({ isOpen, onClose, initialItem, onOpenChat }: MissionModalProps) {
  const [items, setItems] = useState<MissionItem[]>([]);
  const [address, setAddress] = useState('');
  const [urgency, setUrgency] = useState<'not_urgent'|'urgent'>('not_urgent');
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [missionName, setMissionName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMissionId, setSavedMissionId] = useState<string | null>(null);
  const [savingMission, setSavingMission] = useState(false);
  const [showRequired, setShowRequired] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const [missionLoaded, setMissionLoaded] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [snapshot, setSnapshot] = useState<{ name: string; address: string; urgency: string; items: MissionItem[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'build' | 'results'>('build');

  // If there is a saved mission id, load its items on open
  useEffect(() => {
    (async () => {
      if (!isOpen) return;
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('a2a_current_mission_id') : null;
        if (saved) {
          const res = await fetch(`/api/missions/${saved}`);
          const json = await res.json();
          if (json?.ok && json.mission) {
            setItems((json.mission.items || []).map((it: any) => ({
              product_id: it.product_id,
              vendor_id: it.vendor_id,
              sku: it.sku,
              name: it.name,
              quantity: it.quantity || 1
            })));
            setMissionName(json.mission.name || '');
            setAddress(json.mission.shipping_address || '');
            setUrgency(json.mission.urgency || 'not_urgent');
            setSavedMissionId(saved);
            setMissionLoaded(true);
            setSnapshot({
              name: json.mission.name || '',
              address: json.mission.shipping_address || '',
              urgency: json.mission.urgency || 'not_urgent',
              items: (json.mission.items || []).map((it: any) => ({ product_id: it.product_id, vendor_id: it.vendor_id, sku: it.sku, name: it.name, quantity: it.quantity || 1 }))
            });
          }
        }
      } catch {}
    })();
  }, [isOpen]);

  function parseAgentResponse(text?: string) {
    if (!text) return null;
    const lower = text.toLowerCase();
    const money = /\$\s?(\d{1,3}(?:[,\.]\d{3})*(?:[\.,]\d+)?)/g;
    let prices: number[] = [];
    for (const m of text.matchAll(money)) {
      const raw = (m[1] || '').replace(/[,.]/g, '');
      const val = Number(raw);
      if (!Number.isNaN(val)) prices.push(val);
    }
    const moqMatch = lower.match(/(?:moq|minimum\s+order|min\s+order)\D*(\d{1,6})/);
    const moq = moqMatch ? Number(moqMatch[1]) : undefined;
    const leadMatch = lower.match(/(?:lead\s*time|delivery|entrega)[^\d]*(\d{1,3})\s*(?:business\s*)?day/);
    const lead = leadMatch ? Number(leadMatch[1]) : undefined;
    const pricePerUnit = prices.length > 0 ? Math.min(...prices) : undefined;
    return { pricePerUnit, moq, leadDays: lead };
  }

  useEffect(() => {
    if (isOpen && initialItem && !savedMissionId) {
      setItems((prev) => {
        if (prev.length >= 10) return prev;
        return [...prev, { ...initialItem, quantity: initialItem.quantity || 1 }];
      });
    }
  }, [isOpen, initialItem, savedMissionId]);

  // When a mission is loaded and modal opened with a new initial item, attach it to the saved mission
  useEffect(() => {
    (async () => {
      if (!isOpen || !savedMissionId || !initialItem || !missionLoaded) return;
      const exists = items.some((it) => (initialItem.product_id && it.product_id === initialItem.product_id) || (initialItem.sku && it.sku === initialItem.sku));
      if (exists) return;
      try {
        setAddingItem(true);
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const updatedItems = [...items, { ...initialItem, quantity: 1 }];
        const res = await fetch(`/api/missions/${savedMissionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ name: missionName, shipping_address: address, urgency, items: updatedItems })
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed');
        setItems(updatedItems);
        push({ variant: 'success', description: 'Product added to mission' });
        setSnapshot({ name: missionName, address, urgency, items: updatedItems });
      } catch (e) {
        console.error(e);
        push({ variant: 'destructive', description: 'Could not add product to mission' });
      } finally {
        setAddingItem(false);
      }
    })();
  }, [isOpen, savedMissionId, initialItem, missionLoaded]);

  useEffect(() => {
    if (!isOpen || !savedMissionId) return;
    try {
      const raw = localStorage.getItem(`a2a_mission_offers_${savedMissionId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.offers?.length) {
          setOffers(parsed.offers as Offer[]);
          setRecommended(parsed.recommended || null);
          setActiveTab('results');
        }
      }
    } catch {}
  }, [isOpen, savedMissionId]);

  const totalRequested = useMemo(() => items.reduce((s, i) => s + (Number(i.quantity) || 0), 0), [items]);

  const updateItemQty = (idx: number, value: number) => {
    if (!savedMissionId) { setShowRequired(true); setFormError('You must save the mission first'); push({ variant: 'destructive', description: 'You must save the mission first' }); return; }
    if (Number.isNaN(value) || value <= 0) value = 1;
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, quantity: value } : it));
  };

  // Removed explicit "Add to mission" button; initial item gets auto-added via effect

  // Dirty detection and saveChanges
  const normalizeItems = (arr: MissionItem[]) => {
    const key = (it: MissionItem) => (it.product_id || it.sku || it.name || '') + ':' + (it.vendor_id || '');
    return [...arr].map(it => ({ ...it, quantity: Number(it.quantity) || 1 })).sort((a,b)=> key(a).localeCompare(key(b)));
  };
  const isDirty = useMemo(() => {
    if (!snapshot) return false;
    if (snapshot.name !== missionName || snapshot.address !== address || snapshot.urgency !== urgency) return true;
    const cur = JSON.stringify(normalizeItems(items));
    const base = JSON.stringify(normalizeItems(snapshot.items));
    return cur !== base;
  }, [snapshot, missionName, address, urgency, items]);

  const saveChanges = async () => {
    if (!savedMissionId) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch(`/api/missions/${savedMissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: missionName.trim(), shipping_address: address.trim(), urgency, items })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed');
      setSnapshot({ name: missionName.trim(), address: address.trim(), urgency, items: [...items] });
      push({ variant: 'success', description: 'Changes saved' });
    } catch (e) {
      console.error(e);
      push({ variant: 'destructive', description: 'Failed to save changes' });
    }
  };

  const startMission = async () => {
    if (!savedMissionId) { setShowRequired(true); setFormError('Save the mission first'); return; }
    if (items.length === 0) return;
    setLoading(true);
    setOffers(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch('/api/mcp/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ shipping: { address }, urgency, items: items.map(i => ({ product_id: i.product_id, sku: i.sku, quantity: Number(i.quantity)||1 })) })
      });
      const json = await res.json();
      if (res.ok && json?.ok) {
        const ofs = (json.offers as Offer[]) || [];
        setOffers(ofs);
        const normalize = (o: Offer) => o.items.map(it => `${it.sku || it.product_id}:${it.quantity}`).sort().join('|');
        const signatures = Array.from(new Set(ofs.map(normalize)));
        let rec: string | null = null;
        if (signatures.length === 1 && ofs.length > 0) {
          let best = ofs[0];
          let bestVal = (()=>{ const q=ofs[0].items.reduce((s,it)=>s+it.quantity,0); const p=parseAgentResponse(ofs[0].agent_response); return p?.pricePerUnit!=null ? Math.round((p!.pricePerUnit||0)*q) : ofs[0].total_amount; })();
          for (const o of ofs.slice(1)) {
            const q=o.items.reduce((s,it)=>s+it.quantity,0); const p=parseAgentResponse(o.agent_response); const val=p?.pricePerUnit!=null? Math.round((p!.pricePerUnit||0) * q) : o.total_amount;
            if (val < bestVal) { best = o; bestVal = val; }
          }
          rec = best.vendor_id;
        }
        setRecommended(rec);
        try { if (savedMissionId) localStorage.setItem(`a2a_mission_offers_${savedMissionId}`, JSON.stringify({ offers: ofs, recommended: rec })); } catch {}
        setActiveTab('results');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveMission = async () => {
    setShowRequired(true);
    if (!missionName.trim()) { setFormError('Mission name is required'); return; }
    if (!address.trim()) { setFormError('Shipping address is required'); return; }
    if (items.length === 0) { setFormError('Add at least one product'); return; }
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: missionName.trim(),
          shipping_address: address.trim(),
          urgency: urgency || 'not_urgent',
          items: items.map(i => ({ product_id: i.product_id, vendor_id: i.vendor_id, sku: i.sku, name: i.name, quantity: Number(i.quantity)||1 }))
        })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed');
      setSavedMissionId(json.mission_id as string);
      try { localStorage.setItem('a2a_current_mission_id', json.mission_id as string); } catch {}
      setFormError(null);
      push({ variant: 'success', description: 'Mission saved' });
      setSnapshot({ name: missionName.trim(), address: address.trim(), urgency, items: [...items] });
    } catch (e) {
      console.error(e);
      setFormError('Could not save mission');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v)=>{ if (!v) { try { localStorage.setItem('a2a_force_badges_refresh', String(Date.now())); } catch {}; onClose(); } }}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Build mission</DialogTitle>
        </DialogHeader>

        {savedMissionId && missionName.trim() && (
          <div className="mb-2 text-xs text-muted-foreground">You are editing the <span className="font-medium">{missionName.trim()}</span> mission.</div>
        )}

        <Tabs value={activeTab} onValueChange={(v)=>setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            {offers && (<TabsTrigger value="results">Results</TabsTrigger>)}
          </TabsList>

          <TabsContent value="build" current={activeTab}>
          <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: form */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Request details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Input placeholder="Mission name" value={missionName} onChange={(e)=>setMissionName(e.target.value)} className={`h-9 w-full sm:w-56 ${showRequired && !missionName.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
              </div>
              {formError && (
                <div className="rounded border border-red-300 bg-red-50 text-red-700 text-xs px-3 py-2">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Shipping address</label>
                  <Input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="City, Country" className={`${showRequired && !address.trim() ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
                </div>
                <div>
                  <label className="block mb-1">Urgency</label>
                  <select className={`w-full border rounded px-2 py-2 ${showRequired && !urgency ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={urgency} onChange={(e)=>setUrgency(e.target.value as any)}>
                    <option value="not_urgent">Not urgent</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <p className="-mt-1 text-xs text-muted-foreground">Shipping and urgency apply to the entire mission.</p>
              <div className="pt-1 flex flex-wrap gap-2 items-center">
                <Button variant="secondary" onClick={saveMission} disabled={items.length===0 || !missionName.trim() || !address.trim()}>Save mission</Button>
                {savedMissionId && isDirty && (
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={saveChanges}>Save changes</Button>
                )}
                <Button onClick={startMission} disabled={loading || items.length===0 || !savedMissionId}>{loading ? 'Starting…' : 'Start mission'}</Button>
              </div>
              <div className="text-xs text-muted-foreground">Max 10 products per mission.</div>
            </CardContent>
          </Card>

          {/* Middle: items */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Mission items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[340px] overflow-auto text-sm">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between border rounded-md p-3 gap-3">
                    <div className="truncate">
                      <div className="font-medium truncate">{it.name || it.sku}</div>
                      <div className="text-xs text-muted-foreground">SKU: {it.sku || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Qty</span>
                      <Input
                        type="number"
                        min={1}
                        value={Number(it.quantity) || 1}
                        onChange={(e)=>updateItemQty(idx, Number(e.target.value))}
                        className="w-20 h-8"
                      />
                      <Button size="sm" variant="ghost" onClick={()=>{ if (!savedMissionId) { setShowRequired(true); setFormError('You must save the mission first'); push({ variant: 'destructive', description: 'You must save the mission first' }); return; } setItems(items.filter((_,i)=>i!==idx)); }}>Remove</Button>
                    </div>
                  </div>
                ))}
                {items.length===0 && <div className="text-muted-foreground text-sm">No products yet.</div>}
              </div>
              <div className="pt-3 text-xs text-muted-foreground">Total requested units: {totalRequested}</div>
              <div className="pt-3">
                <Button variant="outline" onClick={()=>{ try { localStorage.setItem('a2a_force_badges_refresh', String(Date.now())); } catch {}; onClose(); router.push(`/products?ts=${Date.now()}`); }}>Add more products</Button>
              </div>
            </CardContent>
          </Card>

          </div>
          </div>
          </TabsContent>

          <TabsContent value="results" current={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[480px] overflow-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(offers||[]).map((o) => {
                    const qTotal = o.items.reduce((s,it)=>s+(it.quantity||0),0);
                    const p = parseAgentResponse(o.agent_response);
                    const negotiated = p?.pricePerUnit!=null ? Math.round((p!.pricePerUnit||0) * qTotal) : undefined;
                    const base = o.total_amount;
                    const discount = negotiated!=null ? Math.max(0, base - negotiated) : 0;
                    const discountPct = negotiated!=null && base>0 ? Math.round((discount/base)*100) : null;
                    return (
                      <div key={o.vendor_id} className={`rounded-md p-3 border ${recommended===o.vendor_id? 'ring-2 ring-blue-500':''} bg-muted/30`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{o.vendor_name}</div>
                          <div className="text-right">
                            <div className="text-sm font-bold">${(negotiated ?? base).toLocaleString()}</div>
                            {negotiated!=null && (
                              <div className="text-[11px] text-muted-foreground">base: ${base.toLocaleString()} {discountPct!=null && (<span className="ml-1 text-emerald-500">(-{discountPct}%)</span>)}</div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-2 text-xs bg-background/40 rounded border p-2">
                              <div className="col-span-2"><div className="text-muted-foreground">Item</div><div className="font-medium truncate">{it.name || it.sku}</div></div>
                              <div><div className="text-muted-foreground">Qty</div><div className="font-medium">{it.quantity}</div></div>
                              <div><div className="text-muted-foreground">Price</div><div className="font-medium">${it.price.toLocaleString()}</div></div>
                              <div><div className="text-muted-foreground">Lead</div><div className="font-medium">{it.lead_time_days ?? '—'} d</div></div>
                            </div>
                          ))}
                        </div>
                        {p && (
                          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                            <div className="border rounded-md p-3 bg-background/40"><div className="text-muted-foreground">Agent price/unit</div><div className="font-medium">{p.pricePerUnit != null ? `$${p.pricePerUnit}` : '—'}</div></div>
                            <div className="border rounded-md p-3 bg-background/40"><div className="text-muted-foreground">MOQ</div><div className="font-medium">{p.moq != null ? p.moq : '—'}</div></div>
                            <div className="border rounded-md p-3 bg-background/40"><div className="text-muted-foreground">Lead time</div><div className="font-medium">{p.leadDays != null ? `${p.leadDays} days` : '—'}</div></div>
                          </div>
                        )}
                        {(() => {
                          const parts: string[] = [];
                          if (negotiated != null) parts.push(`Negotiated $${p?.pricePerUnit} per unit${discountPct!=null?` (-${discountPct}%)`:''}`);
                          if (p?.moq != null) parts.push(`MOQ ${p.moq}`);
                          if (p?.leadDays != null) parts.push(`Lead ${p.leadDays} days`);
                          let text = parts.join(' • ');
                          if (!text && o.agent_response) {
                            const t = String(o.agent_response).replace(/\s+/g, ' ').trim();
                            text = t.slice(0, 160) + (t.length > 160 ? '…' : '');
                          }
                          return (
                            <div className="mt-2 text-xs text-muted-foreground italic">
                              Agent: {text || '—'}
                            </div>
                          );
                        })()}
                        <div className="pt-3 flex gap-2">
                          <Button size="sm" variant="outline" onClick={async ()=>{
                            try {
                              const { data: session } = await supabase.auth.getSession();
                              const token = session?.session?.access_token;
                              const res = await fetch('/api/pre-orders', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                body: JSON.stringify({ vendor_id: o.vendor_id, items: o.items.map(it=>({ product_id: it.product_id, quantity: it.quantity, negotiated_unit_price: p?.pricePerUnit ?? undefined })), notes: 'Mission pre-order (includes negotiated_unit_price when provided by agent)' })
                              });
                              const json = await res.json();
                              if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed');
                              push({ variant: 'success', description: 'Pre-order created' });
                            } catch (e) { console.error(e); }
                          }}>Pre-Order</Button>
                          <Button size="sm" variant="outline" onClick={()=>{ if (onOpenChat) onOpenChat({ id: o.vendor_id, name: o.vendor_name }); }}>Chat</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}


