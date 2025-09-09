"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMessage('Login successful. Redirecting...');
      setTimeout(() => router.push('/'), 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (!supabase) throw new Error('Supabase is not configured');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset`
      });
      if (error) throw error;
      setMessage('We sent you a reset link. Please check your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Login</h1>
          <p className="text-muted-foreground">Sign in with your email and password.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{forgot ? 'Reset password' : 'Sign in'}</CardTitle>
          </CardHeader>
          <CardContent>
            {!forgot ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Password</label>
                    <button type="button" className="text-xs underline text-muted-foreground hover:no-underline" onClick={()=>{ setMessage(null); setForgot(true); }}>
                      Forgot your password?
                    </button>
                  </div>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign in'}</Button>
                {message && (
                  <div className={message.startsWith('Error') ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                    {message}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Don’t have an account?{' '}
                  <Link href="/auth/register" className="underline hover:no-underline">Sign up</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending...' : 'Send reset link'}</Button>
                {message && (
                  <div className={message.startsWith('Error') ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                    {message}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Remembered your password?{' '}
                  <button type="button" className="underline hover:no-underline" onClick={()=>{ setForgot(false); setMessage(null); }}>Back to sign in</button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


