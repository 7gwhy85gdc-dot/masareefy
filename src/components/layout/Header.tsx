import React from 'react';
import { useNav } from './Nav';
import { useStore } from '../../store/store';
import { computeAlerts } from '../../store/selectors';

function IconBtn({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="press relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 dark:text-zinc-300"
    >
      {children}
    </button>
  );
}

export function Header() {
  const { go } = useNav();
  const { state } = useStore();
  const alertCount = computeAlerts(state).length;

  return (
    <header className="sticky top-0 z-40 bg-gray-100/90 backdrop-blur-md dark:bg-zinc-950/90 pt-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <img src="/icons/logo.svg" alt="شعار مصاريفي" className="h-10 w-10 drop-shadow-sm" />
          <span className="text-lg font-extrabold tracking-tight">
            مصاريفي
          </span>
        </div>
        <div className="flex items-center">
          <IconBtn label="بحث" onClick={() => go('transactions')}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </IconBtn>
          <IconBtn label="التنبيهات" onClick={() => go('alerts')}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {alertCount > 0 && (
              <span className="absolute top-1 left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            )}
          </IconBtn>
          <IconBtn label="مساعدة" onClick={() => go('settings')}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4" /><circle cx="12" cy="17.5" r="0.5" fill="currentColor" />
            </svg>
          </IconBtn>
        </div>
      </div>
    </header>
  );
}

export function SubHeader({ title }: { title: string }) {
  const { back } = useNav();
  return (
    <header className="sticky top-0 z-40 bg-gray-100/90 backdrop-blur-md dark:bg-zinc-950/90 pt-safe">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-2">
        <button
          type="button"
          aria-label="رجوع"
          onClick={back}
          className="press flex h-10 w-10 items-center justify-center rounded-full text-brand-600"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
        <h1 className="text-lg font-extrabold">{title}</h1>
      </div>
    </header>
  );
}
