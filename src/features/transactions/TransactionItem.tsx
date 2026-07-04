import { useRef, useState } from 'react';
import { CategoryIcon } from '../../components/ui/Basics';
import { fmtSAR, fmtDate, fmtTime } from '../../lib/format';
import { DEFAULT_CATEGORIES } from '../../lib/categories';
import { haptic } from '../../lib/haptics';
import { useStore } from '../../store/store';
import type { Transaction } from '../../types';

interface Props {
  tx: Transaction;
  onDelete?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  onRepeat?: (tx: Transaction) => void;
  showDate?: boolean;
}

/** عنصر عملية مع سحب (Swipe) لكشف إجراءات: تعديل، كرر، حذف */
export function TransactionItem({ tx, onDelete, onEdit, onRepeat, showDate = true }: Props) {
  const { categories } = useStore();
  const cat =
    categories.find((c) => c.id === tx.categoryId) ??
    DEFAULT_CATEGORIES.find((c) => c.id === 'other')!;

  const actions = [
    onEdit && { key: 'edit', label: 'تعديل', icon: '✎', cls: 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-zinc-200', fn: () => onEdit(tx) },
    onRepeat && tx.type === 'expense' && { key: 'repeat', label: 'كرر', icon: '⟳', cls: 'bg-sky-500 text-white', fn: () => onRepeat(tx) },
    onDelete && { key: 'del', label: 'حذف', icon: '✕', cls: 'bg-red-500 text-white', fn: () => onDelete(tx) },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: string; cls: string; fn: () => void }>;

  const ACTION_W = 62;
  const maxOpen = actions.length * ACTION_W;
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, base: offset };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!start.current || maxOpen === 0) return;
    const t = e.touches[0];
    const dx = t.clientX - start.current.x;
    const dy = t.clientY - start.current.y;
    if (!dragging && Math.abs(dx) < 8) return;
    if (!dragging && Math.abs(dy) > Math.abs(dx)) { start.current = null; return; }
    setDragging(true);
    const next = Math.min(0, Math.max(-maxOpen - 20, start.current.base + dx));
    setOffset(next);
  };
  const onTouchEnd = () => {
    if (!start.current && !dragging) return;
    const open = offset < -maxOpen / 2;
    if (open) haptic(8);
    setOffset(open ? -maxOpen : 0);
    setDragging(false);
    start.current = null;
  };

  const runAction = (fn: () => void) => {
    setOffset(0);
    fn();
  };

  return (
    <div className="relative overflow-hidden" style={{ touchAction: 'pan-y' }}>
      {/* أزرار خلف السحب */}
      {actions.length > 0 && (
        <div className="absolute inset-y-1 left-0 flex items-stretch gap-1">
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => runAction(a.fn)}
              className={`flex w-[58px] flex-col items-center justify-center rounded-2xl text-xs font-bold ${a.cls}`}
              style={{ opacity: Math.min(1, -offset / maxOpen + 0.15) }}
            >
              <span className="text-base">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`relative flex items-center gap-3 bg-white py-3 dark:bg-zinc-900 ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (offset !== 0) setOffset(0); }}
      >
        <CategoryIcon icon={cat.icon} color={cat.color} />
        <button
          type="button"
          onClick={(e) => {
            if (offset !== 0) { e.stopPropagation(); setOffset(0); return; }
            onEdit?.(tx);
          }}
          className="min-w-0 flex-1 text-start"
        >
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{tx.storeName || 'ادخال يدوي'}</span>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
              {cat.name}
            </span>
          </div>
          {showDate && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
              {fmtDate(tx.date)} · {fmtTime(tx.date)}
            </p>
          )}
          {tx.note && <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-zinc-500">{tx.note}</p>}
        </button>
        <span
          className={`shrink-0 text-sm font-extrabold ${
            tx.type === 'income' ? 'text-sky-600 dark:text-sky-400' : 'text-brand-600 dark:text-brand-400'
          }`}
        >
          {tx.type === 'income' ? '＋' : ''}{fmtSAR(tx.amount)}
        </span>
        {onDelete && (
          <button
            type="button"
            aria-label="حذف"
            onClick={() => onDelete(tx)}
            className="press hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:text-red-500 dark:text-zinc-600 sm:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
