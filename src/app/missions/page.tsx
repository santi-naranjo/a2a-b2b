'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { MissionModal } from '@/components/MissionModal';

type Mission = {
  id: string;
  name: string;
  shipping_address: string | null;
  urgency: 'not_urgent' | 'urgent';
  created_at: string;
  items: Array<{ id: string; sku: string | null; name: string | null; quantity: number }>;
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { push } = useToast();
  const [openMission, setOpenMission] = useState(false);
  const [seedItem, setSeedItem] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const res = await fetch('/api/missions', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        if (json?.ok) setMissions(json.missions);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = missions.filter((m) =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    (m.shipping_address || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Layout>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">A2A Missions</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="Search missions" value={filter} onChange={(e)=>setFilter(e.target.value)} className="w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{m.name}</span>
                <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Shipping</div>
                <div>{m.shipping_address || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Urgency</div>
                <div>{m.urgency === 'urgent' ? 'Urgent' : 'Not urgent'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Items</div>
                <ul className="list-disc list-inside">
                  {m.items.map((it) => (
                    <li key={it.id}>{it.name || it.sku} — Qty {it.quantity}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 flex gap-2">
                <Button size="sm" onClick={()=>{ try { localStorage.setItem('a2a_current_mission_id', m.id); } catch{}; setSeedItem(null); setOpenMission(true); }}>Open</Button>
                <Button variant="destructive" size="sm" onClick={()=> setConfirmId(m.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-sm text-muted-foreground">No missions found.</div>
      )}

      <Dialog open={!!confirmId} onOpenChange={()=>!deleting && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete mission</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">This action cannot be undone. Do you want to delete this mission?</div>
          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={()=>setConfirmId(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={async ()=>{
              if (!confirmId) return;
              try {
                setDeleting(true);
                const { data: session } = await supabase.auth.getSession();
                const token = session?.session?.access_token;
                const res = await fetch('/api/missions/'+confirmId, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
                const json = await res.json();
                if (res.ok && json?.ok) {
                  setMissions((prev)=>prev.filter(x=>x.id!==confirmId));
                  push({ variant: 'success', description: 'Mission deleted' });
                } else {
                  push({ variant: 'destructive', description: json?.error || 'Failed to delete mission' });
                }
              } catch (e) {
                push({ variant: 'destructive', description: 'Failed to delete mission' });
              } finally {
                setDeleting(false);
                setConfirmId(null);
              }
            }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <MissionModal isOpen={openMission} onClose={()=>setOpenMission(false)} initialItem={seedItem} />
    </div>
    </Layout>
  );
}


