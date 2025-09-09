"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { VendorChatModal } from '@/components/VendorChatModal';
import { MissionModal } from '@/components/MissionModal';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useSearchParams } from 'next/navigation';

type Row = {
  id: string;
  vendor_id: string;
  vendor_name: string;
  sku: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
};

function AllProductsPageInner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  const [vendorModal, setVendorModal] = useState<{ id: string; name: string } | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionItem, setMissionItem] = useState<any | null>(null);
  const [resumeMissionId, setResumeMissionId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [currentMissionName, setCurrentMissionName] = useState<string | null>(null);

  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('');
  const [vendor, setVendor] = useState('');
  // remove duplicate declarations of priceMin / priceMax
  const [stockMin, setStockMin] = useState<number | undefined>(undefined);
  const [stockMax, setStockMax] = useState<number | undefined>(undefined);
  const [leadMin, setLeadMin] = useState<number | undefined>(undefined);
  const [leadMax, setLeadMax] = useState<number | undefined>(undefined);
  const [productIdToMission, setProductIdToMission] = useState<Record<string, { id: string; name: string }>>({});
  const [hoverPid, setHoverPid] = useState<string | null>(null);
  const { push } = useToast();

  const load = async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (category !== 'all') params.set('category', category);
    if (brand.trim()) params.set('brand', brand.trim());
    if (vendor.trim()) params.set('vendor', vendor.trim());
    if (priceMin != null) params.set('price_min', String(priceMin));
    if (priceMax != null) params.set('price_max', String(priceMax));
    if (stockMin != null) params.set('stock_min', String(stockMin));
    if (stockMax != null) params.set('stock_max', String(stockMax));
    if (leadMin != null) params.set('lead_min', String(leadMin));
    if (leadMax != null) params.set('lead_max', String(leadMax));
    const res = await fetch(`/api/products?${params.toString()}`);
    const json = await res.json();
    const data = res.ok && json?.ok ? json.data : [];
    const mapped: Row[] = (data as any)?.map((r: any) => ({
      id: r.id,
      vendor_id: r.vendor_id,
      vendor_name: r.vendors?.name || r.vendor_name || 'Vendor',
      sku: r.sku,
      name: r.name,
      brand: r.brand,
      category: r.category,
      price: r.price,
      stock: r.stock
    })) || [];
    setRows(mapped);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    // Load current mission id if any
    try {
      const saved = localStorage.getItem('a2a_current_mission_id');
      if (saved) setResumeMissionId(saved);
    } catch {}
  }, []);

  const loadMissionBadges = async () => {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    const res = await fetch('/api/missions', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const json = await res.json();
    if (json?.ok) {
      const map: Record<string, { id: string; name: string }> = {};
      for (const m of json.missions || []) {
        for (const it of m.items || []) {
          if (it.product_id) map[it.product_id] = { id: m.id, name: m.name };
        }
      }
      setProductIdToMission(map);
    }
  };

  useEffect(() => { loadMissionBadges(); }, []);
  useEffect(() => { loadMissionBadges(); }, [searchParams?.toString()]);
  useEffect(() => {
    const i = setInterval(() => {
      try {
        const ts = localStorage.getItem('a2a_force_badges_refresh');
        if (ts) {
          loadMissionBadges();
          localStorage.removeItem('a2a_force_badges_refresh');
        }
      } catch {}
    }, 800);
    return () => clearInterval(i);
  }, []);

  // Load current mission name to show banner
  useEffect(() => {
    (async () => {
      try {
        const id = localStorage.getItem('a2a_current_mission_id');
        if (!id) { setResumeMissionId(null); setCurrentMissionName(null); return; }
        setResumeMissionId(id);
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const res = await fetch(`/api/missions/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        if (res.ok && json?.ok) setCurrentMissionName(json.mission?.name || '');
      } catch {}
    })();
  }, [searchParams?.toString()]);

  const removeFromMission = async (productId: string) => {
    const info = productIdToMission[productId];
    if (!info) return;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const resGet = await fetch(`/api/missions/${info.id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const j = await resGet.json();
      if (!resGet.ok || !j?.ok) throw new Error(j?.error || 'Failed to load mission');
      const mission = j.mission;
      const updatedItems = (mission.items || []).filter((it: any) => it.product_id !== productId);
      const resPatch = await fetch(`/api/missions/${info.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: mission.name, shipping_address: mission.shipping_address, urgency: mission.urgency, items: updatedItems })
      });
      const jp = await resPatch.json();
      if (!resPatch.ok || !jp?.ok) throw new Error(jp?.error || 'Failed to update mission');
      setProductIdToMission((prev) => { const { [productId]: _omit, ...rest } = prev; return rest; });
      push({ variant: 'success', description: 'Removed from mission' });
    } catch (e) {
      console.error(e);
      push({ variant: 'destructive', description: 'Could not remove from mission' });
    }
  };

  const [meta, setMeta] = useState<{ brands: string[]; categories: string[]; bounds: { price: {min:number;max:number}, stock:{min:number;max:number}, lead:{min:number;max:number} } } | null>(null);
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/products/meta');
      const json = await res.json();
      if (res.ok && json?.ok) {
        setMeta(json);
        if (json.bounds) {
          setPriceMin(json.bounds.price.min);
          setPriceMax(json.bounds.price.max);
          setStockMin(json.bounds.stock.min);
          setStockMax(json.bounds.stock.max);
          setLeadMin(json.bounds.lead.min);
          setLeadMax(json.bounds.lead.max);
        }
      }
    })();
  }, []);

  // Server applies filters; render rows as-is so initial load always shows data
  const filtered = rows;

  return (
    <Layout>
      <div className="space-y-4">
        {resumeMissionId && currentMissionName && (
          <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-400/10 backdrop-blur-md p-3 shadow-sm">
            <div className="text-sm text-muted-foreground">You are editing the <span className="font-medium text-foreground">{currentMissionName}</span> mission.</div>
            <Button size="sm" onClick={() => { setMissionItem(null); setMissionOpen(true); }}>Edit mission</Button>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">All Products</h1>
          <p className="text-sm text-muted-foreground">Browse products from all vendors</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e)=>{ e.preventDefault(); load(); }}>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
              <Input
                placeholder="Search by product, SKU, brand, category or vendor"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                className="md:col-span-6"
              />
              <Input placeholder="Vendor" value={vendor} onChange={(e)=>setVendor(e.target.value)} className="md:col-span-2" />
              <select value={brand} onChange={(e)=>setBrand(e.target.value)} className="border rounded px-2 py-1 md:col-span-2">
                <option value="">All brands</option>
                {(meta?.brands || []).map(b => (<option key={b} value={b}>{b}</option>))}
              </select>
              <select value={category} onChange={(e)=>setCategory(e.target.value)} className="border rounded px-2 py-1 md:col-span-2">
                <option value="all">All categories</option>
                {(meta?.categories || []).map(c => (<option key={c} value={c}>{c}</option>))}
              </select>
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1"><span>Price</span><span>${priceMin ?? 0} - ${priceMax ?? 0}</span></div>
                <DualRangeSlider
                  min={meta?.bounds?.price.min ?? 0}
                  max={meta?.bounds?.price.max ?? 1000}
                  step={10}
                  value={[priceMin ?? 0, priceMax ?? 0]}
                  onValueChange={(v:number[]) => { setPriceMin(v[0]); setPriceMax(v[1]); }}
                  onValueCommit={() => { load(); }}
                  label={(v)=>v}
                />
              </div>
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1"><span>Stock</span><span>{stockMin ?? 0} - {stockMax ?? 0}</span></div>
                <DualRangeSlider
                  min={meta?.bounds?.stock.min ?? 0}
                  max={meta?.bounds?.stock.max ?? 10000}
                  step={50}
                  value={[stockMin ?? 0, stockMax ?? 0]}
                  onValueChange={(v:number[]) => { setStockMin(v[0]); setStockMax(v[1]); }}
                  onValueCommit={() => { load(); }}
                  label={(v)=>v}
                />
              </div>
              <div className="md:col-span-3">
                <div className="flex items-center justify-between mb-1"><span>Lead time (days)</span><span>{leadMin ?? 0} - {leadMax ?? 0}</span></div>
                <DualRangeSlider
                  min={meta?.bounds?.lead.min ?? 0}
                  max={meta?.bounds?.lead.max ?? 60}
                  step={1}
                  value={[leadMin ?? 0, leadMax ?? 0]}
                  onValueChange={(v:number[]) => { setLeadMin(v[0]); setLeadMax(v[1]); }}
                  onValueCommit={() => { load(); }}
                  label={(v)=>v}
                />
              </div>
              <div className="md:col-span-3 flex gap-2 items-end justify-end">
                <Button type="button" variant="outline" onClick={() => { 
                  setVendor('');
                  setBrand('');
                  setCategory('all');
                  setQ('');
                  if (meta?.bounds) {
                    setPriceMin(meta.bounds.price.min);
                    setPriceMax(meta.bounds.price.max);
                    setStockMin(meta.bounds.stock.min);
                    setStockMax(meta.bounds.stock.max);
                    setLeadMin(meta.bounds.lead.min);
                    setLeadMax(meta.bounds.lead.max);
                  } else {
                    setPriceMin(undefined);
                    setPriceMax(undefined);
                    setStockMin(undefined);
                    setStockMax(undefined);
                    setLeadMin(undefined);
                    setLeadMax(undefined);
                  }
                  load();
                }}>Reset</Button>
                <Button type="submit">Apply filters</Button>
              </div>
              </div>
            </form>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Vendor</th>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Brand</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-3">{r.vendor_name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.sku || '—'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <span>{r.name}</span>
                          {productIdToMission[r.id] && (
                            <Badge
                              variant="secondary"
                              onMouseEnter={()=>setHoverPid(r.id)}
                              onMouseLeave={()=>setHoverPid(null)}
                              onClick={(e)=>{ e.preventDefault(); removeFromMission(r.id); }}
                              className={`${hoverPid===r.id ? 'cursor-pointer bg-orange-500 text-white hover:bg-orange-600' : ''}`}
                            >
                              {hoverPid===r.id ? 'Remove from mission' : `Added to mission: ${productIdToMission[r.id].name}`}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{r.brand || '—'}</td>
                      <td className="py-2 pr-3">{r.category || '—'}</td>
                      <td className="py-2 pr-3">{r.price != null ? `$${r.price}` : '—'}</td>
                      <td className="py-2 pr-3">{r.stock != null ? r.stock : '—'}</td>
                      <td className="py-2 pr-3 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setVendorModal({ id: r.vendor_id, name: r.vendor_name } as any); setInitialMessage(r.sku || r.name); }}
                        >Chat with vendor</Button>
                        <Button
                          size="sm"
                          onClick={() => { setMissionItem({ product_id: r.id, sku: r.sku, name: r.name, vendor_id: r.vendor_id, quantity: 1 }); setMissionOpen(true); }}
                        >Add to Mission</Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-6 text-center text-muted-foreground">No products</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat modal for selected vendor/product */}
      <VendorChatModal
        isOpen={!!vendorModal}
        onClose={() => setVendorModal(null)}
        vendor={vendorModal ? { id: vendorModal.id, name: vendorModal.name, category: '', product: '', inventory: 0, basePrice: 0, discountPolicy: [], shippingTime: 0 } as any : null}
        initialMessage={initialMessage}
        forceNew
      />
      <MissionModal
        isOpen={missionOpen}
        onClose={()=>setMissionOpen(false)}
        initialItem={missionItem}
        onOpenChat={(v)=>{ setVendorModal({ id: v.id, name: v.name } as any); setInitialMessage(undefined); setMissionOpen(false); }}
      />
    </Layout>
  );
}

export default function AllProductsPage() {
  return (
    <Suspense fallback={<div />}>
      <AllProductsPageInner />
    </Suspense>
  );
}


