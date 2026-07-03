import React, { createContext, useContext, useState } from 'react';

export type View =
  | 'home' | 'alerts' | 'offers' | 'settings'
  | 'transactions' | 'budgets' | 'analytics' | 'goals';

interface NavCtx {
  view: View;
  go: (v: View) => void;
  back: () => void;
  openAdd: () => void;
  addOpen: boolean;
  closeAdd: () => void;
}

const Ctx = createContext<NavCtx | null>(null);

export const TAB_VIEWS: View[] = ['home', 'alerts', 'offers', 'settings'];

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<View[]>(['home']);
  const [addOpen, setAddOpen] = useState(false);
  const view = stack[stack.length - 1];

  const go = (v: View) => {
    if (v === view) return;
    window.scrollTo({ top: 0 });
    setStack((s) => (TAB_VIEWS.includes(v) ? [v] : [...s, v]));
  };
  const back = () => {
    window.scrollTo({ top: 0 });
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : ['home']));
  };

  return (
    <Ctx.Provider
      value={{
        view, go, back,
        addOpen,
        openAdd: () => setAddOpen(true),
        closeAdd: () => setAddOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNav(): NavCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
