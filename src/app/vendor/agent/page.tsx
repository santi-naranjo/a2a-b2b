"use client";

import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';

type VendorLite = { id: string; name: string };

type Agent = {
  id: string;
  owner_type: 'organization' | 'vendor';
  owner_id: string;
  kind: 'buyer' | 'negotiator';
  name: string;
  system_prompt: string;
  model: string;
  temperature: number | null;
  status: 'active' | 'disabled';
};

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

export default function VendorAgentPage() {
  const [vendors, setVendors] = useState<VendorLite[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const selectedVendor = useMemo(() => vendors.find(v => v.id === (selectedVendorId || '')) || null, [vendors, selectedVendorId]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load vendor memberships and resolve vendor list
  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) return;

      const { data: vmembers, error: vmErr } = await supabase
        .from('vendor_members')
        .select('vendor_id');
      if (vmErr) {
        setVendors([]);
        return;
      }
      const vendorIds = (vmembers || []).map((m: any) => m.vendor_id).filter(Boolean);
      if (vendorIds.length === 0) {
        setVendors([]);
        return;
      }
      const { data: vrows } = await supabase
        .from('vendors')
        .select('id,name')
        .in('id', vendorIds)
        .order('name');
      const list: VendorLite[] = (vrows || []).map((v: any) => ({ id: v.id, name: v.name }));
      setVendors(list);
      if (!selectedVendorId) setSelectedVendorId(list[0]?.id ?? null);
    })();
  }, []);

  // Load agent for selected vendor
  useEffect(() => {
    (async () => {
      if (!selectedVendorId) {
        setAgent(null);
        return;
      }
      const res = await fetch(`/api/agents?owner_type=vendor&owner_id=${selectedVendorId}`);
      const json = await res.json();
      if (res.ok && json?.ok) {
        const agents: Agent[] = json.data as Agent[];
        const negotiator = agents.find(a => a.kind === 'negotiator') || agents[0] || null;
        setAgent(negotiator);
        setEditPrompt(negotiator?.system_prompt ?? '');
        setIsEditing(false);
      } else {
        setAgent(null);
        setEditPrompt('');
        setIsEditing(false);
      }
    })();
  }, [selectedVendorId]);

  // Load conversations for selected vendor
  useEffect(() => {
    (async () => {
      if (!selectedVendorId) {
        setConversations([]);
        return;
      }
      const res = await fetch(`/api/conversations?vendor_id=${selectedVendorId}`);
      const json = await res.json();
      if (res.ok && json?.ok) setConversations(json.data as Conversation[]);
      setSelectedConversation(null);
      setMessages([]);
    })();
  }, [selectedVendorId]);

  // Load messages when selecting a conversation
  useEffect(() => {
    (async () => {
      if (!selectedConversation) return;
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`);
      const json = await res.json();
      if (res.ok && json?.ok) setMessages(json.data as Message[]);
    })();
  }, [selectedConversation?.id]);

  const filtered = useMemo(() => {
    return conversations.filter(c =>
      (c.topic || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.organization_name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Agent & Vendor selector */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Vendor Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Vendor</div>
                <div className="text-sm font-medium mt-1">{selectedVendor?.name || '—'}</div>
                {vendors.length === 0 && (
                  <div className="text-sm text-muted-foreground mt-2">No vendor memberships.</div>
                )}
              </div>
              <Separator />
              {agent ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-sm font-medium">Name</div>
                    <div className="text-sm text-muted-foreground">{agent.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Model</div>
                      <div className="text-sm">{agent.model}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Temperature</div>
                      <div className="text-sm">{agent.temperature ?? 0}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">System instructions</div>
                      {!isEditing ? (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                      ) : null}
                    </div>
                    {!isEditing ? (
                      <div className="text-sm whitespace-pre-wrap p-3 rounded border bg-muted/30 max-h-[40vh] overflow-auto">
                        {agent.system_prompt}
                      </div>
                    ) : (
                      <>
                        <textarea
                          className="w-full min-h-[180px] text-sm p-3 rounded border bg-background"
                          value={editPrompt}
                          onChange={(e)=>setEditPrompt(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditPrompt(agent.system_prompt); setIsEditing(false); }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={saving}
                            onClick={async ()=>{
                              if (!agent) return;
                              try {
                                setSaving(true);
                                const { data: session } = await supabase.auth.getSession();
                                const token = session?.session?.access_token;
                                const res = await fetch('/api/agents', {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                                  },
                                  body: JSON.stringify({ id: agent.id, system_prompt: editPrompt })
                                });
                                const json = await res.json();
                                if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to save');
                                setAgent({ ...agent, system_prompt: editPrompt });
                                setIsEditing(false);
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setSaving(false);
                              }
                            }}
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No agent found for this vendor.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedVendorId ? (
              <div className="text-sm text-muted-foreground">Select a vendor to view conversations.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Search by topic or organization"
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                    className="mb-3"
                  />
                  <div className="space-y-2 max-h-[65vh] overflow-auto">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        className={`w-full text-left p-3 rounded border ${selectedConversation?.id===c.id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedConversation(c)}
                      >
                        <div className="text-sm font-medium truncate">{c.topic || 'Untitled conversation'}</div>
                        <div className="text-xs text-muted-foreground truncate">Org: {c.organization_name || c.organization_id || '—'}</div>
                        <div className="text-xs text-muted-foreground">Updated: {new Date(c.updated_at).toLocaleString()}</div>
                      </button>
                    ))}
                    {filtered.length===0 && <div className="text-sm text-muted-foreground">No conversations</div>}
                  </div>
                </div>
                <div className="md:col-span-3">
                  {!selectedConversation ? (
                    <div className="text-sm text-muted-foreground">Choose a conversation on the left.</div>
                  ) : (
                    <div className="space-y-3 max-h-[65vh] overflow-auto">
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

 