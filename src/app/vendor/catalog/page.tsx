"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function VendorCatalogInner() {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendor_id') || '';
  const [csv, setCsv] = useState('sku,name,description,brand,category,price,currency,stock,unit,lead_time_days\nNIKE-AIR-100,Nike Runner,,Nike,Shoes,99,USD,100,pair,5');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const upload = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/vendor/catalog/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId, csv_text: csv })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Upload failed');
      setResult(`Inserted ${json.inserted} products`);
    } catch (e: unknown) {
      setResult(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Vendor Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Vendor ID</label>
                <input className="w-full border rounded px-2 py-1 text-sm" value={vendorId} readOnly />
              </div>
              <div>
                <label className="text-sm">Select CSV file</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setResult('File too large (max 5MB)');
                      return;
                    }
                    try {
                      const text = await file.text();
                      setCsv(text);
                      setResult(`Loaded ${file.name} (${Math.round(file.size / 1024)} KB)`);
                    } catch (err) {
                      setResult('Failed to read file');
                    }
                  }}
                  className="block w-full text-sm"
                />
              </div>
              <div>
                <label className="text-sm">CSV</label>
                <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} />
              </div>
              <Button onClick={upload} disabled={loading || !vendorId}>Upload</Button>
              {result && <div className="text-sm text-muted-foreground">{result}</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function VendorCatalogPage() {
  return (
    <Suspense fallback={<div />}>
      <VendorCatalogInner />
    </Suspense>
  );
}


