import { CategoryIcon } from '../../components/ui/Basics';
import { fmtSAR, fmtDate, fmtTime } from '../../lib/format';
import { DEFAULT_CATEGORIES } from '../../lib/categories';
import { useStore } from '../../store/store';
import type { Transaction } from '../../types';

interface Props {
  tx: Transaction;
  onDelete?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  showDate?: boolean;
}

export function TransactionItem({ tx, onDelete, onEdit, showDate = true }: Props) {
  const { categories } = useStore();
  const cat =
    categories.find((c) => c.id === tx.categoryId) ??
    DEFAULT_CATEGORIES.find((c) => c.id === 'other')!;

  return (
    <div className="flex items-center gap-3 py-3">
      <CategoryIcon icon={cat.icon} color={cat.color} />
      <button
        type="button"
        onClick={() => onEdit?.(tx)}
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
          className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:text-red-500 dark:text-zinc-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
