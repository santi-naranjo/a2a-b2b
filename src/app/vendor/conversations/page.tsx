"use client";

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';

type Conversation = {
  id: string;
  organization_id: string | null;
  vendor_id: string | null;
  topic: string | null;
  status: string;
  updated_at: string;
  organization_name?: string | null;
};

type Message = { id: string; role: 'system'|'user'|'assistant'|'tool'; content: string; created_at: string };

export default function VendorConversationsPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      // Resolve vendor membership
      // For simplicity, take the first vendor membership
      const { data: auth } = await supabase?.auth.getUser()!;
      if (!auth?.user?.id) return;
      const { data: memberships } = await supabase!
        .from('vendor_members')
        .select('vendor_id')
        .limit(1);
      const vid = memberships && memberships.length > 0 ? memberships[0].vendor_id : null;
      setVendorId(vid);
      if (!vid) return;
      const res = await fetch(`/api/conversations?vendor_id=${vid}`);
      const json = await res.json();
      if (res.ok && json?.ok) setConversations(json.data as Conversation[]);
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const res = await fetch(`/api/conversations/${selected.id}/messages`);
      const json = await res.json();
      if (res.ok && json?.ok) setMessages(json.data as Message[]);
    })();
  }, [selected?.id]);

  const filtered = conversations.filter(c =>
    (c.topic || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.organization_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search by topic or organization" value={search} onChange={(e)=>setSearch(e.target.value)} className="mb-3" />
            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  className={`w-full text-left p-3 rounded border ${selected?.id===c.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelected(c)}
                >
                  <div className="text-sm font-medium truncate">{c.topic || 'Untitled conversation'}</div>
                  <div className="text-xs text-muted-foreground truncate">Org: {c.organization_name || c.organization_id || '—'}</div>
                  <div className="text-xs text-muted-foreground">Updated: {new Date(c.updated_at).toLocaleString()}</div>
                </button>
              ))}
              {filtered.length===0 && <div className="text-sm text-muted-foreground">No conversations</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{selected?.topic || 'Select a conversation'}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-sm text-muted-foreground">Choose a conversation on the left.</div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-auto">
                {messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs mr-2 ${m.role==='user'?'bg-blue-600 text-white':'bg-secondary'}`}>{m.role}</span>
                    <span className="align-middle">{m.content}</span>
                    <div className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {messages.length===0 && <div className="text-sm text-muted-foreground">No messages yet.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}


