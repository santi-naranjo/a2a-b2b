'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, SidebarToggle } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import { Bot, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        if (!supabase) {
          if (mounted) setIsAuthenticated(false);
          return;
        }
        const { data } = await supabase.auth.getUser();
        if (mounted) {
          setIsAuthenticated(Boolean(data.user));
          setUserEmail(data.user?.email ?? null);
        }
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    }
    checkAuth();
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      // @ts-ignore - optional chain if exists
      subscription?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      if (pathname !== '/auth/login' && pathname !== '/auth/register') {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    async function loadMemberships() {
      if (!supabase || !isAuthenticated) {
        setOrganizations([]);
        setVendors([]);
        return;
      }
      try {
        const [orgRes, venRes] = await Promise.all([
          supabase.from('organizations').select('id,name').order('name'),
          supabase.from('vendors').select('id,name').order('name')
        ]);
        setOrganizations(orgRes.data ?? []);
        setVendors(venRes.data ?? []);
      } catch {
        setOrganizations([]);
        setVendors([]);
      }
    }
    loadMemberships();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar: only when authenticated */}
      {isAuthenticated ? (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          hasOrg={organizations.length > 0}
          hasVendor={vendors.length > 0}
        />
      ) : null}
      
      {/* Mobile Toggle: only when authenticated */}
      {isAuthenticated ? (
        <SidebarToggle isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      ) : null}

      {/* Main Content */}
      <div className={isAuthenticated && isSidebarOpen ? "lg:ml-64" : ""}>
        {/* Header: only when authenticated */}
        {showHeader && isAuthenticated && (
          <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden text-white hover:bg-white/20"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Bot className="h-8 w-8" />
                <div>
                  <h1 className="text-xl font-bold">A2B | B2B</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-white px-2">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback className="bg-white/20 text-white text-xs">
                            U
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline text-white/90 text-sm max-w-[220px] truncate">{userEmail ?? 'Account'}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Signed in as</span>
                        <span className="text-sm font-normal max-w-[240px] truncate">{userEmail ?? 'Unknown'}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {organizations.length > 0 && (
                      <>
                        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                        {organizations.map((o) => (
                          <DropdownMenuItem key={o.id}>{o.name}</DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {vendors.length > 0 && (
                      <>
                        <DropdownMenuLabel>Vendors</DropdownMenuLabel>
                        {vendors.map((v) => (
                          <DropdownMenuItem key={v.id}>{v.name}</DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={async () => { await supabase?.auth.signOut(); }}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
} 