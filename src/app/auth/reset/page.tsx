"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 8) { setMessage('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setMessage('Passwords do not match'); return; }
    setLoading(true);
    try {
      // When the user clicks the link from the email, Supabase sets a session via URL params
      // We only need to update the password here
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated. Redirecting to login...');
      setTimeout(()=> router.push('/auth/login'), 1000);
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Reset password</h1>
          <p className="text-muted-foreground">Choose a new password to continue.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set new password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New password</label>
                <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="********" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm password</label>
                <Input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="********" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Updating...' : 'Update password'}</Button>
              {message && (
                <div className={message.startsWith('Error') ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


