import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ConversationLite = { id: string; vendor_id: string | null; vendor_name?: string | null; topic: string | null };

type Notif = {
  id: string;
  conversation_id: string;
  content: string;
  created_at: string;
  vendor_name?: string | null;
};

export function NotificationBell() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationLite[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channels: any[] = [];
    (async () => {
      if (!supabase) return;
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id || null;
        if (!uid) return;
        // Resolve memberships
        const [{ data: orgs }, { data: vens }] = await Promise.all([
          supabase.from('organization_members').select('organization_id').eq('user_id', uid),
          supabase.from('vendor_members').select('vendor_id').eq('user_id', uid)
        ]);
        const orgId = orgs?.[0]?.organization_id || null;
        const vendorIds: string[] = (vens || []).map((r: any) => r.vendor_id).filter(Boolean);

        const lists: ConversationLite[] = [];
        // Org conversations
        if (orgId) {
          try {
            const res = await fetch(`/api/conversations?organization_id=${orgId}`);
            const json = await res.json();
            const list: ConversationLite[] = (json?.data || []).map((c: any) => ({ id: c.id, vendor_id: c.vendor_id, vendor_name: c.vendor_name, topic: c.topic }));
            lists.push(...list);
          } catch {}
        }
        // Vendor conversations
        for (const vid of vendorIds) {
          try {
            const res = await fetch(`/api/conversations?vendor_id=${vid}`);
            const json = await res.json();
            const list: ConversationLite[] = (json?.data || []).map((c: any) => ({ id: c.id, vendor_id: c.vendor_id, vendor_name: c.vendor_name, topic: c.topic }));
            lists.push(...list);
          } catch {}
        }
        // De-duplicate
        const byId = new Map<string, ConversationLite>();
        lists.forEach((c) => byId.set(c.id, c));
        const finalList = Array.from(byId.values());
        setConversations(finalList);

        // Subscribe to new messages per conversation (role user/assistant only)
        finalList.forEach((c) => {
          const channel = supabase
            .channel(`msgs:${c.id}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${c.id}`
            }, (payload: any) => {
              const m = payload.new as { id: string; conversation_id: string; content: string; created_at: string; role?: string };
              if (m?.role && m.role !== 'user' && m.role !== 'assistant') return;
              setNotifs((prev) => {
                const exists = prev.some((x) => x.id === m.id);
                if (exists) return prev;
                return [{
                  id: m.id,
                  conversation_id: m.conversation_id,
                  content: m.content,
                  created_at: m.created_at,
                  vendor_name: c.vendor_name || null,
                }, ...prev].slice(0, 25);
              });
            })
            .subscribe();
          channels.push(channel);
        });

        // Global fallback subscription for new conversations created after mount
        const globalCh = supabase
          .channel('msgs:all')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
            const m = payload.new as { id: string; conversation_id: string; content: string; created_at: string; role?: string };
            if (m?.role && m.role !== 'user' && m.role !== 'assistant') return;
            const known = finalList.find((c) => c.id === m.conversation_id);
            if (known) {
              setNotifs((prev) => (prev.some((x) => x.id === m.id) ? prev : [{ id: m.id, conversation_id: m.conversation_id, content: m.content, created_at: m.created_at, vendor_name: known.vendor_name || null }, ...prev].slice(0,25)));
              return;
            }
            // Refresh conversations and try again
            try {
              const refreshed: ConversationLite[] = [];
              if (orgId) {
                const res = await fetch(`/api/conversations?organization_id=${orgId}`);
                const json = await res.json();
                const list: ConversationLite[] = (json?.data || []).map((c: any) => ({ id: c.id, vendor_id: c.vendor_id, vendor_name: c.vendor_name, topic: c.topic }));
                refreshed.push(...list);
              }
              for (const vid of vendorIds) {
                const res = await fetch(`/api/conversations?vendor_id=${vid}`);
                const json = await res.json();
                const list: ConversationLite[] = (json?.data || []).map((c: any) => ({ id: c.id, vendor_id: c.vendor_id, vendor_name: c.vendor_name, topic: c.topic }));
                refreshed.push(...list);
              }
              const byId2 = new Map<string, ConversationLite>();
              refreshed.forEach((c) => byId2.set(c.id, c));
              const final2 = Array.from(byId2.values());
              setConversations(final2);
              const match = final2.find((c) => c.id === m.conversation_id);
              setNotifs((prev) => (prev.some((x) => x.id === m.id) ? prev : [{ id: m.id, conversation_id: m.conversation_id, content: m.content, created_at: m.created_at, vendor_name: match?.vendor_name || null }, ...prev].slice(0,25)));
            } catch {}
          })
          .subscribe();
        channels.push(globalCh);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      channels.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch {}
      });
    };
  }, []);

  const count = notifs.length;
  const label = useMemo(() => (count > 99 ? '99+' : String(count)), [count]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] leading-none rounded-full px-1.5 py-0.5">
              {label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 && (
          <DropdownMenuItem className="text-xs text-muted-foreground">No new messages</DropdownMenuItem>
        )}
        {notifs.map((n) => (
          <DropdownMenuItem
            key={n.id}
            className="flex flex-col items-start gap-1 text-sm cursor-pointer"
            onClick={() => {
              // prefer conversation_id navigation
              window.location.href = `/chat?tab=conversations&conversation_id=${n.conversation_id}`;
            }}
          >
            <div className="w-full truncate">{n.vendor_name ? `${n.vendor_name}: ` : ''}{n.content}</div>
            <div className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
          </DropdownMenuItem>
        ))}
        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setNotifs([])}>Clear</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
