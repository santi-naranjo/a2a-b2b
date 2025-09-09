'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Database, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Home,
  MessageSquare,
  Users,
  TrendingUp,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  hasOrg?: boolean;
  hasVendor?: boolean;
}

export function Sidebar({ isOpen, onToggle, hasOrg = false, hasVendor = false }: SidebarProps) {
  const pathname = usePathname();

  const allItems = [
    { title: 'Dashboard', href: '/', icon: Home, description: 'Overview' },
    { title: 'A2A Console', href: '/chat', icon: MessageSquare, description: 'AI Chat Interface', show: false },
    { title: 'All Products', href: '/products', icon: Database, description: 'Browse catalog', show: hasOrg },
    { title: 'A2A Missions', href: '/missions', icon: TrendingUp, description: 'Saved sourcing missions', show: hasOrg },
    { title: 'Vendors', href: '/vendors', icon: Database, description: 'Vendor Directory', show: hasOrg },
    { title: 'Vendor Agent', href: '/vendor/agent', icon: Bot, description: 'Agent settings & history', show: hasVendor },
    { title: 'My Products', href: '/vendor/products', icon: Database, description: 'Manage catalog', show: hasVendor },
    { title: 'Orders', href: '/orders', icon: Package, description: 'Your Purchase Orders' }
  ];
  const menuItems = allItems.filter(i => i.show !== false);

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="h-full w-64 bg-background border-r shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">A2B | B2B</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle button for mobile
export function SidebarToggle({ isOpen, onToggle }: SidebarProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="fixed top-4 left-4 z-50 h-10 w-10 p-0 lg:hidden"
    >
      {isOpen ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );
} 