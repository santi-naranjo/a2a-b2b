"use client";

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type AccountType = 'organization' | 'vendor';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('organization');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company_name: companyName, account_type: accountType })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setMessage('Registration successful. Check your email to set your password and complete your account.');
      setName('');
      setEmail('');
      setCompanyName('');
      setAccountType('organization');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Register</h1>
          <p className="text-muted-foreground">Create your account to get started. You will receive an email to set your password.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company name</label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account type</label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" checked={accountType === 'organization'} onChange={() => setAccountType('organization')} />
                    Organization
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" checked={accountType === 'vendor'} onChange={() => setAccountType('vendor')} />
                    Vendor
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Registering...' : 'Register'}</Button>

              {message && (
                <div className={message.startsWith('Error') ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="underline hover:no-underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}


