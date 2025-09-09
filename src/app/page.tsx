"use client";

import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Database, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  MessageSquare,
  ArrowUpRight,
  Activity,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Dashboard() {
  const [real, setReal] = useState<{ vendors: number; products: number; missions: number; conversations: number; orders: number; inventoryTotal: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        const res = await fetch('/api/stats', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const json = await res.json();
        if (json?.ok) setReal(json.stats);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    { title: 'Total Vendors', value: real?.vendors ?? '—', icon: Database, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Products', value: real?.products ?? '—', icon: Package, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Missions', value: real?.missions ?? '—', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Conversations', value: real?.conversations ?? '—', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { title: 'Orders', value: real?.orders ?? '—', icon: ShoppingCart, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  ];

  const recentActivity = [
    {
      type: "New Vendor",
      description: "Solar Energy joined the platform",
      time: "2 minutes ago",
      icon: Database
    },
    {
      type: "Order Completed",
      description: "Order #1234 delivered successfully",
      time: "15 minutes ago",
      icon: Package
    },
    {
      type: "Chat Session",
      description: "New chat started with TechPro Solutions",
      time: "1 hour ago",
      icon: MessageSquare
    },
    {
      type: "Revenue Milestone",
      description: "Monthly revenue target achieved",
      time: "2 hours ago",
      icon: TrendingUp
    }
  ];

  const quickActions = [
    {
      title: "Search Products",
      description: "Find items across all vendors",
      href: "/products",
      icon: Package,
      color: "bg-blue-500"
    },
    {
      title: "Browse Vendors",
      description: "View vendor directory",
      href: "/vendors",
      icon: Database,
      color: "bg-green-500"
    },
    {
      title: "My Missions",
      description: "Manage sourcing missions",
      href: "/missions",
      icon: TrendingUp,
      color: "bg-purple-500"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat: any, index: number) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {loading && <div className="text-xs text-muted-foreground">Loading...</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                  >
                    <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <activity.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.type}</p>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">20</div>
                <div className="text-sm text-muted-foreground">Product Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{real?.inventoryTotal != null ? real.inventoryTotal.toLocaleString() : '—'}</div>
                <div className="text-sm text-muted-foreground">Total Inventory (units)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
