'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DualRangeSlider } from '@/components/ui/dual-range-slider';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type VendorSummary = {
  id: string;
  name: string;
  category: string;
  total_inventory?: number | null;
  min_price?: number | null;
  fastest_lead_time?: number | null;
};

type ProductRow = {
  id: string;
  name: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
  lead_time_days: number | null;
  min_order_qty: number | null;
};

interface VendorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorSummary | null;
  initiallyApproved: boolean;
}

export function VendorDetailModal({ isOpen, onClose, vendor, initiallyApproved }: VendorDetailModalProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(10000);
  const [stockMin, setStockMin] = useState(0);
  const [stockMax, setStockMax] = useState(100000);
  const [leadMin, setLeadMin] = useState(0);
  const [leadMax, setLeadMax] = useState(60);
  const [bounds, setBounds] = useState({ pmin: 0, pmax: 10000, smin: 0, smax: 100000, lmin: 0, lmax: 60 });
  const [isApproved, setIsApproved] = useState<boolean>(initiallyApproved);

  useEffect(() => {
    setIsApproved(initiallyApproved);
  }, [initiallyApproved]);

  useEffect(() => {
    (async () => {
      if (!isOpen || !vendor?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/vendor/products?vendor_id=${vendor.id}`);
        const json = await res.json();
        const list = (res.ok && json?.ok ? json.products : []) as ProductRow[];
        setProducts(list);
        if (list.length > 0) {
          const prices = list.map(r => r.price ?? 0).filter(n => typeof n === 'number');
          const stocks = list.map(r => r.stock ?? 0).filter(n => typeof n === 'number');
          const leads = list.map(r => r.lead_time_days ?? 0).filter(n => typeof n === 'number');
          const pmin = Math.max(0, Math.min(...prices, 0));
          const pmax = Math.max(...prices, 100);
          const smin = Math.max(0, Math.min(...stocks, 0));
          const smax = Math.max(...stocks, 100);
          const lmin = Math.max(0, Math.min(...leads, 0));
          const lmax = Math.max(...leads, 60);
          setBounds({ pmin, pmax, smin, smax, lmin, lmax });
          setPriceMin(pmin);
          setPriceMax(pmax);
          setStockMin(smin);
          setStockMax(smax);
          setLeadMin(lmin);
          setLeadMax(lmax);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, vendor?.id]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map(p => p.category ?? 'Uncategorized')))], [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchText = (p.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.category ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = category === 'all' || (p.category ?? 'Uncategorized') === category;
      const price = p.price ?? 0;
      const stock = p.stock ?? 0;
      const lead = p.lead_time_days ?? 0;
      return matchText && matchCat && price >= priceMin && price <= priceMax && stock >= stockMin && stock <= stockMax && lead >= leadMin && lead <= leadMax;
    });
  }, [products, searchTerm, category, priceMin, priceMax, stockMin, stockMax, leadMin, leadMax]);

  async function toggleMembership() {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || null;
      if (!uid) return alert('Please login');
      const { data: om } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', uid)
        .limit(1);
      const orgId = om?.[0]?.organization_id || null;
      if (!orgId) return alert('No organization found for your account');
      if (isApproved) {
        const res = await fetch('/api/org/vendors/remove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organization_id: orgId, vendor_id: vendor?.id }) });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        setIsApproved(false);
      } else {
        const res = await fetch('/api/org/vendors/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organization_id: orgId, vendor_id: vendor?.id }) });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        setIsApproved(true);
      }
    } catch (e) {
      alert('Operation failed');
    }
  }

  function startQuote() {
    if (!vendor?.id) return;
    const url = `/chat?tab=conversations&vendor_id=${vendor.id}`;
    window.location.href = url;
  }

  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <span>{vendor.name}</span>
              <Badge variant="secondary">{vendor.category}</Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant={isApproved ? 'destructive' : 'secondary'} size="sm" onClick={toggleMembership}>
                {isApproved ? 'Remove from my vendors' : 'Add to my vendors'}
              </Button>
              <Button variant="default" size="sm" onClick={startQuote} disabled={!isApproved} className={!isApproved ? 'opacity-60 cursor-not-allowed' : ''}>
                <MessageCircle className="h-3 w-3 mr-1" /> Start Quote
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar vendor summary */}
          <div className="w-72 border-r p-4 space-y-4 bg-muted/30 overflow-y-auto">
            <div>
              <div className="text-xs text-muted-foreground">Vendor ID</div>
              <div className="text-sm font-medium">{vendor.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Inventory</div>
              <div className="text-sm font-medium">{(vendor.total_inventory ?? 0).toLocaleString()} units</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Min Price</div>
              <div className="text-sm font-medium">${(vendor.min_price ?? 0)} USD</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Fastest Lead Time</div>
              <div className="text-sm font-medium">{(vendor.fastest_lead_time ?? 0)} days</div>
            </div>
          </div>

          {/* Products & filters */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Button key={c} size="sm" variant={category === c ? 'default' : 'outline'} className="text-xs" onClick={() => setCategory(c)}>
                        {c === 'all' ? 'All Categories' : c}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span>Price (USD)</span><span>${priceMin} - ${priceMax}</span></div>
                  <DualRangeSlider min={bounds.pmin} max={bounds.pmax} step={10} value={[priceMin, priceMax]} onValueChange={(v: number[]) => { setPriceMin(v[0]); setPriceMax(v[1]); }} label={(v) => v} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span>Stock (units)</span><span>{stockMin} - {stockMax}</span></div>
                  <DualRangeSlider min={bounds.smin} max={bounds.smax} step={50} value={[stockMin, stockMax]} onValueChange={(v: number[]) => { setStockMin(v[0]); setStockMax(v[1]); }} label={(v) => v} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span>Lead time (days)</span><span>{leadMin} - {leadMax}</span></div>
                  <DualRangeSlider min={bounds.lmin} max={bounds.lmax} step={1} value={[leadMin, leadMax]} onValueChange={(v: number[]) => { setLeadMin(v[0]); setLeadMax(v[1]); }} label={(v) => v} />
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 h-full">
              <div className="space-y-3">
                {loading && <div className="text-sm text-muted-foreground">Loading products…</div>}
                {!loading && filtered.length === 0 && <div className="text-sm text-muted-foreground">No products found</div>}
                {!loading && filtered.map((p) => (
                  <Card key={p.id} className="p-0">
                    <CardHeader className="p-3 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{p.name ?? 'Product'}</div>
                        <Badge variant="secondary" className="text-xs">{p.category ?? 'Uncategorized'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Price</span><div className="font-medium">${p.price ?? 0} USD</div></div>
                        <div><span className="text-muted-foreground">Stock</span><div className="font-medium">{p.stock ?? 0}</div></div>
                        <div><span className="text-muted-foreground">Lead time</span><div className="font-medium">{p.lead_time_days ?? 0} days</div></div>
                        <div><span className="text-muted-foreground">Min order</span><div className="font-medium">{p.min_order_qty ?? 1}</div></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


