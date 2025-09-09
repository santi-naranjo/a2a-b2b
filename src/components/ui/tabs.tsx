'use client';

import * as React from 'react';

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div>
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return child;
        if ((child as any)?.type?.displayName === 'TabsList') return React.cloneElement(child as any, { value, onValueChange });
        return child;
      })}
    </div>
  );
}

export function TabsList({ value, onValueChange, children }: any) {
  return (
    <div className="flex gap-2 border-b mb-3">
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as any, { current: value, onValueChange });
      })}
    </div>
  );
}
TabsList.displayName = 'TabsList';

export function TabsTrigger({ value, current, onValueChange, children }: any) {
  const active = current === value;
  return (
    <button className={`px-3 py-2 text-sm rounded-t ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => onValueChange(value)}>
      {children}
    </button>
  );
}

export function TabsContent({ value, current, children }: any) {
  if (current !== value) return null;
  return <div>{children}</div>;
}


