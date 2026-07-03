import React from 'react';
import { useNav, type View } from './Nav';

interface Item {
  view: View;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const stroke = (active: boolean) => ({
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: active ? 2.4 : 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

const items: Item[] = [
  {
    view: 'home', label: 'الرئيسية',
    icon: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" {...stroke(a)}>
        <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    view: 'alerts', label: 'التنبيهات',
    icon: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" {...stroke(a)}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    view: 'offers', label: 'العروض',
    icon: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" {...stroke(a)}>
        <path d="M20.6 13.4 12 22l-8.6-8.6a2 2 0 0 1-.6-1.4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 1.4.6l8.4 8.4a2 2 0 0 1 0 2.8Z" transform="scale(0.9) translate(1.2 1.2)" />
        <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    view: 'settings', label: 'حسابي',
    icon: (a) => (
      <svg width="23" height="23" viewBox="0 0 24 24" {...stroke(a)}>
        <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const { view, go, openAdd } = useNav();
  const right = items.slice(0, 2);
  const left = items.slice(2);

  const Tab = ({ item }: { item: Item }) => {
    const active =
      view === item.view ||
      (item.view === 'home' && ['transactions', 'budgets', 'analytics', 'goals'].includes(view));
    return (
      <button
        type="button"
        onClick={() => go(item.view)}
        className={`press flex flex-1 flex-col items-center gap-0.5 py-1.5 ${
          active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-zinc-500'
        }`}
      >
        {item.icon(active)}
        <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-lg px-3 pb-2 pb-safe">
        <div className="relative flex items-center rounded-[1.75rem] bg-white/95 shadow-[0_-2px_20px_rgba(0,0,0,0.08)] backdrop-blur dark:bg-zinc-900/95">
          {right.map((i) => <Tab key={i.view} item={i} />)}
          {/* زر الإضافة العائم */}
          <div className="relative -top-5 flex w-16 shrink-0 justify-center">
            <button
              type="button"
              aria-label="إضافة عملية"
              onClick={openAdd}
              className="press flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/40"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          {left.map((i) => <Tab key={i.view} item={i} />)}
        </div>
      </div>
    </nav>
  );
}
