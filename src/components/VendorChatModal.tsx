'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface VendorData {
  id: string;
  name: string;
  category: string;
  product: string;
  inventory: number;
  basePrice: number;
  discountPolicy: string[];
  shippingTime: number;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

type Conversation = {
  id: string;
  organization_id: string | null;
  vendor_id: string | null;
  topic: string | null;
  status: string;
  updated_at: string;
};

interface VendorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: VendorData | null;
  initialMessage?: string;
  forceNew?: boolean;
}

export function VendorChatModal({ isOpen, onClose, vendor, initialMessage, forceNew = false }: VendorChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  async function ensureConversation(): Promise<string | null> {
    try {
      if (!vendor) return null;
      // Resolve auth user and default organization (first membership)
      let uid: string | null = null;
      let oid: string | null = null;
      if (supabase) {
        const { data: auth } = await supabase.auth.getUser();
        uid = auth?.user?.id || null;
        setCurrentUserId(uid);
        if (uid) {
          const { data: orgRows } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', uid)
            .limit(1);
          oid = orgRows && orgRows.length > 0 ? (orgRows[0] as any).organization_id : null;
          setCurrentOrgId(oid);
        } else {
          setCurrentOrgId(null);
        }
      }
      // Find negotiator agent for this vendor
      const resAgents = await fetch(`/api/agents?owner_type=vendor&owner_id=${vendor.id}`);
      const agentsJson = await resAgents.json();
      const negotiator = (agentsJson?.data || []).find((a: any) => a.kind === 'negotiator');
      const negotiatorId = negotiator?.id;

      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      if (conversationId) {
        if (uuidRegex.test(conversationId)) return conversationId;
        // Reset bad state ids
        setConversationId(null);
      }
      if (!forceNew) {
        // Try to reuse latest existing conversation between this org and vendor (or vendor only)
        try {
          const qOrg = oid && uuidRegex.test(oid) ? `&organization_id=${oid}` : '';
          // Prefer exact match with both org and vendor
          let listRes = await fetch(`/api/conversations?vendor_id=${vendor.id}${qOrg}`, { cache: 'no-store' });
          let listJson = await listRes.json();
          let existing = Array.isArray(listJson?.data) && listJson.data.length > 0 ? listJson.data[0] : null;
          // Fallback: any conversation with this vendor (regardless of org) if none found
          if (!existing) {
            listRes = await fetch(`/api/conversations?vendor_id=${vendor.id}`, { cache: 'no-store' });
            listJson = await listRes.json();
            existing = Array.isArray(listJson?.data) && listJson.data.length > 0 ? listJson.data[0] : null;
          }
          if (existing?.id && uuidRegex.test(existing.id)) {
            setConversationId(existing.id);
            return existing.id as string;
          }
        } catch {}
      }
      const body: any = {
        vendor_id: vendor.id,
        topic: `Quote with ${vendor.name}`
      };
      if (oid && uuidRegex.test(oid)) body.organization_id = oid;
      if (negotiatorId && uuidRegex.test(String(negotiatorId))) body.negotiator_agent_id = negotiatorId;
      if (uid && uuidRegex.test(uid)) body.created_by_user = uid;

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json?.data?.id || !uuidRegex.test(json.data.id)) {
        throw new Error(json?.error || `Failed to create conversation (HTTP ${res.status})`);
      }
      setConversationId(json.data.id);
      return json.data.id as string;
    } catch (e) {
      console.error('ensureConversation error', e);
      return null;
    }
  }

  async function loadConversations() {
    if (!vendor) return;
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    const orgQ = currentOrgId && uuidRegex.test(currentOrgId) ? `&organization_id=${currentOrgId}` : '';
    try {
      const res = await fetch(`/api/conversations?vendor_id=${vendor.id}${orgQ}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json?.ok && Array.isArray(json.data)) {
        setConversations(json.data as Conversation[]);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    }
  }

  async function createNewConversation() {
    if (!vendor) return;
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    try {
      // Resolve user/org if missing
      let uid = currentUserId;
      let oid = currentOrgId;
      if (supabase && (!uid || !oid)) {
        const { data: auth } = await supabase.auth.getUser();
        uid = auth?.user?.id || null;
        if (uid && !oid) {
          const { data: orgRows } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', uid)
            .limit(1);
          oid = orgRows && orgRows.length > 0 ? (orgRows[0] as any).organization_id : null;
        }
      }
      // Find negotiator agent for this vendor
      const resAgents = await fetch(`/api/agents?owner_type=vendor&owner_id=${vendor.id}`);
      const agentsJson = await resAgents.json();
      const negotiator = (agentsJson?.data || []).find((a: any) => a.kind === 'negotiator');
      const negotiatorId = negotiator?.id;

      const body: any = { vendor_id: vendor.id, topic: `Quote with ${vendor.name}` };
      if (oid && uuidRegex.test(oid)) body.organization_id = oid;
      if (negotiatorId && uuidRegex.test(String(negotiatorId))) body.negotiator_agent_id = negotiatorId;
      if (uid && uuidRegex.test(uid)) body.created_by_user = uid;

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (!res.ok || !json?.ok || !json?.data?.id || !uuidRegex.test(json.data.id)) {
        throw new Error(json?.error || `Failed to create conversation (HTTP ${res.status})`);
      }
      setConversationId(json.data.id);
      setMessages([]);
      await loadConversations();
      setIsSidebarOpen(true);
    } catch (e) {
      console.error('createNewConversation error', e);
    }
  }

  useEffect(() => {
    if (isOpen && vendor) {
      (async () => {
        const cid = await ensureConversation();
        await loadConversations();
        if (cid) setConversationId(cid);
      })();
      if (initialMessage) setInputValue(initialMessage);
    } else {
      setConversationId(null);
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vendor?.id]);

  // Load messages whenever selected conversation changes
  useEffect(() => {
    (async () => {
      if (!conversationId) return;
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const json = await res.json();
      if (res.ok && json?.ok) {
        const mapped: ChatMessage[] = (json.data as any[])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ id: m.id, content: m.content, role: m.role, timestamp: new Date(m.created_at) }));
        setMessages(mapped);
      }
    })();
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !vendor) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const convId = conversationId || (await ensureConversation()) as string | null;
      if (!convId) throw new Error('Conversation not ready');
      // Resolve fresh user id to avoid stale state
      let uidNow: string | null = null;
      if (supabase) {
        const { data: authNow } = await supabase.auth.getUser();
        uidNow = authNow?.user?.id || null;
      }
      // Persist user message
      const saveRes = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: userMessage.content,
          sender_type: 'user',
          ...(uidNow ? { sender_id: uidNow } : {})
        })
      });
      const saveJson = await saveRes.json().catch(() => ({ ok: false, error: 'Invalid JSON response' }));
      if (!saveRes.ok || !saveJson?.ok) {
        throw new Error(typeof saveJson === 'object' ? JSON.stringify(saveJson) : `HTTP ${saveRes.status}`);
      }
      // Get agent response
      const res = await fetch('/api/mcp/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: json.content,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      // refresh conversations to update ordering/updated_at
      loadConversations();
    } catch (e) {
      console.error('send message error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] sm:h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Chat with {vendor.name}
            </DialogTitle>
            <div className="flex items-center gap-2" />
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Vendor Details Sidebar */}
          {isSidebarOpen && (
            <div className="w-64 sm:w-80 border-r bg-muted/30 p-3 sm:p-4 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Conversations</h4>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createNewConversation}
                      className="h-8 w-8 p-0 text-muted-foreground"
                      title="New conversation"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSidebarOpen(false)}
                      className="h-8 w-8 p-0 text-muted-foreground"
                      title="Hide sidebar"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {/* Conversations List */}
                <div>
                  <div className="space-y-2 flex-1 overflow-auto pr-1">
                    {conversations.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No conversations</div>
                    ) : (
                      conversations.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setConversationId(c.id)}
                          className={`w-full text-left text-xs p-2 rounded border ${conversationId===c.id ? 'bg-muted' : ''}`}
                        >
                          <div className="font-medium truncate">{c.topic || 'Untitled'}</div>
                          <div className="text-muted-foreground truncate">Updated: {new Date(c.updated_at).toLocaleString()}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-2 top-2 z-20 h-8 w-8 p-0 text-muted-foreground"
              title="Show sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 h-full p-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground mt-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p className="text-sm mt-2">
                      Ask about pricing, availability, or place an order for {vendor.product}
                    </p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[80%]`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <Card className={`${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-card'}`}>
                        <CardContent className="p-3">
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[80%]">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-500 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="sticky bottom-0 z-10 p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 