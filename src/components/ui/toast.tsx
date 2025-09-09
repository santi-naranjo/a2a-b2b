'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Toast = { id: number; title?: string; description: string; variant?: 'default' | 'success' | 'destructive' };

const ToastCtx = createContext<{ toasts: Toast[]; push: (t: Omit<Toast,'id'>) => void; remove: (id: number) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const push = useCallback((t: Omit<Toast,'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [{ id, ...t }, ...prev].slice(0, 5));
    setTimeout(() => remove(id), 4000);
  }, [remove]);
  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-[100] top-3 right-3 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-md shadow px-3 py-2 text-sm ${t.variant === 'destructive' ? 'bg-red-600 text-white' : t.variant === 'success' ? 'bg-green-600 text-white' : 'bg-muted text-foreground'}`}>
            {t.title && <div className="font-semibold">{t.title}</div>}
            <div>{t.description}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}


