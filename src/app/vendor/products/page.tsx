"use client";

import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';

type Product = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  price: number | null;
  currency: string | null;
  stock: number | null;
  unit: string | null;
  lead_time_days: number | null;
};

export default function VendorProductsPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [rows, setRows] = useState<Product[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [csv, setCsv] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // resolve current vendor membership (first)
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) return;
      const { data: mem } = await supabase.from('vendor_members').select('vendor_id').limit(1);
      const vid = mem && mem.length > 0 ? mem[0].vendor_id as string : null;
      setVendorId(vid);
    })();
  }, []);

  const load = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('id, sku, name, description, brand, category, price, currency, stock, unit, lead_time_days')
        .eq('vendor_id', vendorId)
        .order('updated_at', { ascending: false })
        .limit(500);
      if (q.trim()) {
        const like = `%${q.trim()}%`;
        query = query.or(`sku.ilike.${like},name.ilike.${like},brand.ilike.${like},category.ilike.${like}`);
      }
      const { data } = await query;
      setRows((data as any) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [vendorId]);

  const totalStock = useMemo(() => rows.reduce((s, r) => s + (r.stock || 0), 0), [rows]);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Products</h1>
            <p className="text-sm text-muted-foreground">Manage your catalog, stock and pricing</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search by SKU, name, brand, category" value={q} onChange={(e)=>setQ(e.target.value)} className="w-72" />
            <Button variant="outline" onClick={load} disabled={loading}>Search</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-muted-foreground">Products</div><div className="font-semibold">{rows.length}</div></div>
            <div><div className="text-muted-foreground">Total stock</div><div className="font-semibold">{totalStock.toLocaleString()}</div></div>
            <div><div className="text-muted-foreground">Min price</div><div className="font-semibold">${rows.length? Math.min(...rows.map(r=>r.price||0)) : 0}</div></div>
            <div><div className="text-muted-foreground">Max price</div><div className="font-semibold">${rows.length? Math.max(...rows.map(r=>r.price||0)) : 0}</div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-stretch min-h-[200px]">
              <div className="space-y-3 text-sm">
                <div className="text-muted-foreground">Required columns (header row):</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>sku</code>: unique product code (text)</li>
                  <li><code>name</code>: product name (text)</li>
                  <li><code>description</code>: optional (text)</li>
                  <li><code>brand</code>: optional (text)</li>
                  <li><code>category</code>: optional (text)</li>
                  <li><code>price</code>: number (e.g., 135)</li>
                  <li><code>currency</code>: ISO code, e.g., USD</li>
                  <li><code>stock</code>: integer units in inventory</li>
                  <li><code>unit</code>: unit label, e.g., unit, pair, box</li>
                  <li><code>lead_time_days</code>: integer business days</li>
                </ul>
                <div className="pt-2 space-y-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { setUploadMsg('File too large (max 5MB)'); return; }
                      try { const text = await file.text(); setCsv(text); setUploadMsg(`Loaded ${file.name}`); } catch { setUploadMsg('Failed to read file'); }
                    }}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => {
                      const header = 'sku,name,description,brand,category,price,currency,stock,unit,lead_time_days\n';
                      const example = 'PUMA-BAC-122,Puma Backpacks 22,,Puma,Backpacks,135,USD,423,unit,3';
                      const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'vendor_products_template.csv'; a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >Download template</Button>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="mt-auto flex gap-2 justify-end">
                  <Button
                    onClick={async () => {
                      if (!vendorId || !csv.trim()) return;
                      setUploading(true); setUploadMsg(null);
                      try {
                        const res = await fetch('/api/vendor/catalog/upload', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ vendor_id: vendorId, csv_text: csv })
                        });
                        const json = await res.json();
                        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Upload failed');
                        setUploadMsg(`Imported ${json.inserted} products`);
                        await load();
                      } catch (e: unknown) {
                        setUploadMsg(e instanceof Error ? e.message : 'Unknown error');
                      } finally { setUploading(false); }
                    }}
                    disabled={uploading || !vendorId || !csv.trim()}
                  >{uploading ? 'Importing…' : 'Import CSV'}</Button>
                  {uploadMsg && <span className="text-sm text-muted-foreground self-center">{uploadMsg}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Brand</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Stock</th>
                    <th className="py-2 pr-3">Lead time</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-3 font-mono text-xs">{r.sku || '—'}</td>
                      <td className="py-2 pr-3">{r.name}</td>
                      <td className="py-2 pr-3">{r.brand || '—'}</td>
                      <td className="py-2 pr-3">{r.category || '—'}</td>
                      <td className="py-2 pr-3">{r.price != null ? `$${r.price}` : '—'}</td>
                      <td className="py-2 pr-3">{r.stock != null ? r.stock : '—'}</td>
                      <td className="py-2 pr-3">{r.lead_time_days != null ? `${r.lead_time_days} days` : '—'}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td className="py-6 text-center text-muted-foreground" colSpan={7}>No products</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


