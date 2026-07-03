import React from 'react';

export function ProgressBar({ value, danger }: { value: number; danger?: boolean }) {
  const pct = Math.min(100, Math.max(0, value));
  const over = danger ?? value > 100;
  return (
    <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          over ? 'bg-red-500' : value >= 80 ? 'bg-amber-500' : 'bg-brand-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Chip({
  active, onClick, children,
}: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon, title, subtitle,
}: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center anim-pop">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-zinc-800 text-3xl">
        {icon}
      </div>
      <p className="font-semibold text-gray-700 dark:text-zinc-200">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-400 dark:text-zinc-500">{subtitle}</p>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold">{children}</h2>
      {action}
    </div>
  );
}

export function CategoryIcon({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'h-14 w-14 text-2xl' : size === 'sm' ? 'h-9 w-9 text-base' : 'h-11 w-11 text-xl';
  return (
    <div
      className={`flex items-center justify-center rounded-full ${cls}`}
      style={{ backgroundColor: `${color}1a` }}
    >
      <span>{icon}</span>
    </div>
  );
}
