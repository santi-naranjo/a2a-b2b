"use client";

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type PreOrder = {
  id: string;
  status: string;
  total_amount: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
  vendor: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
};

export default function OrdersPage() {
  const [rows, setRows] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // RLS ensures we only see orgs/vendors where the user is member
        const { data, error } = await supabase
          .from('pre_orders')
          .select('id,status,total_amount,currency,notes,created_at,vendor:vendors(id,name),organization:organizations(id,name)')
          .order('created_at', { ascending: false });
        if (!error) setRows((data as any) || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pre-Orders</h1>
          <p className="text-muted-foreground">Drafts and orders visible to your organization or vendor</p>
        </div>

        {rows.length === 0 && !loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No pre-orders yet</h3>
              <p className="text-muted-foreground mb-2">When you create a draft from the chat, it will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((o) => (
              <Card key={o.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{o.vendor?.name || '—'}</CardTitle>
                        <p className="text-sm text-muted-foreground">Order ID: {o.id}</p>
                        <p className="text-xs text-muted-foreground">Organization: {o.organization?.name || '—'}</p>
                      </div>
                    </div>
                    <Badge className={statusColor(o.status)}>{o.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" /> Total</div>
                      <div className="text-lg font-semibold">{o.total_amount != null ? `$${o.total_amount.toLocaleString()} ${o.currency || ''}` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="text-lg font-semibold">{new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <div className="text-sm">{o.notes || '—'}</div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="text-xs text-muted-foreground flex items-center gap-2"><AlertCircle className="h-3 w-3" /> Draft details are stored in payload; line items UI coming next.</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}