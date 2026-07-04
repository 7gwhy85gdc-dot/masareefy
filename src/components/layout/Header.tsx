import React from 'react';
import { useNav } from './Nav';
import { useStore } from '../../store/store';
import { computeAlerts } from '../../store/selectors';
import { Icon } from '../ui/Icons';

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
  const alertCount = React.useMemo(() => computeAlerts(state).length, [state]);

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
            <Icon name="search" size={21} />
          </IconBtn>
          <IconBtn label="التنبيهات" onClick={() => go('alerts')}>
            <Icon name="bell" size={21} />
            {alertCount > 0 && (
              <span className="absolute top-1 left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            )}
          </IconBtn>
          <IconBtn label="مساعدة" onClick={() => go('settings')}>
            <Icon name="help" size={21} />
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
