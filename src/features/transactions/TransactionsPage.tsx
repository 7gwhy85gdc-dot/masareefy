import { useMemo, useState } from 'react';
import { SubHeader } from '../../components/layout/Header';
import { EmptyState, Chip } from '../../components/ui/Basics';
import { ConfirmSheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store/store';
import { dayKey, dayLabel, fmtSAR } from '../../lib/format';
import { sumAmounts } from '../../lib/period';
import { TransactionItem } from './TransactionItem';
import { AddTransactionSheet } from './AddTransactionSheet';
import { StatementImport } from './ImportStatementSheet';
import type { Transaction } from '../../types';

export function TransactionsPage() {
  const { state, dispatch, categories } = useStore();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const [toEdit, setToEdit] = useState<Transaction | null>(null);
  const [repeatPreset, setRepeatPreset] = useState<import('./AddTransactionSheet').TxPreset | null>(null);

  const repeatTx = (tx: Transaction) =>
    setRepeatPreset({ amount: tx.amount, categoryId: tx.categoryId, storeName: tx.storeName });

  const filtered = useMemo(() => {
    const q = query.trim();
    const min = parseFloat(minAmount);
    return state.transactions.filter((t) => {
      if (catFilter && t.categoryId !== catFilter) return false;
      if (q && !`${t.storeName ?? ''} ${t.note ?? ''} ${t.categoryName}`.includes(q)) return false;
      if (from && t.date < new Date(from).toISOString()) return false;
      if (to && t.date > new Date(new Date(to).getTime() + 86_400_000).toISOString()) return false;
      if (!isNaN(min) && t.amount < min) return false;
      return true;
    });
  }, [state.transactions, query, catFilter, from, to, minAmount]);

  // تجميع حسب اليوم
  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const k = dayKey(t.date);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <>
      <SubHeader title="العمليات" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-2">
        {/* البحث */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن متجر أو تصنيف…"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`press rounded-2xl px-4 text-sm font-bold ${
              showFilters ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 dark:bg-zinc-900 dark:text-zinc-300'
            }`}
          >
            فلترة
          </button>
          <StatementImport
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                aria-label="استيراد كشف حساب"
                title="استيراد كشف حساب الراجحي (PDF)"
                className="press rounded-2xl bg-white px-3.5 text-lg dark:bg-zinc-900"
              >
                🏦
              </button>
            )}
          />
        </div>

        {showFilters && (
          <div className="card space-y-3 anim-pop">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              <Chip active={catFilter === null} onClick={() => setCatFilter(null)}>الكل</Chip>
              {categories.map((c) => (
                <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>
                  {c.icon} {c.name}
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <label className="flex-1 text-xs text-gray-500">
                من تاريخ
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
              <label className="flex-1 text-xs text-gray-500">
                إلى تاريخ
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
              <label className="w-28 text-xs text-gray-500">
                أقل مبلغ
                <input inputMode="decimal" value={minAmount} onChange={(e) => setMinAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
            </div>
          </div>
        )}

        {/* القائمة */}
        {groups.length === 0 ? (
          <div className="card">
            <EmptyState icon="🔍" title="لا توجد عمليات مطابقة" subtitle="جرّب تعديل البحث أو الفلاتر" />
          </div>
        ) : (
          groups.map(([k, txs]) => (
            <section key={k} className="card">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-500 dark:text-zinc-400">{dayLabel(txs[0].date)}</h3>
                <span className="text-xs font-bold text-gray-400">{fmtSAR(sumAmounts(txs))}</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                {txs.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} onDelete={setToDelete} onEdit={setToEdit} onRepeat={repeatTx} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <ConfirmSheet
        open={toDelete !== null}
        title="حذف العملية؟"
        message={toDelete ? `${toDelete.categoryName} — ${fmtSAR(toDelete.amount)}` : ''}
        confirmLabel="حذف"
        onConfirm={() => {
          if (toDelete) {
            dispatch({ type: 'DELETE_TX', id: toDelete.id });
            showToast('تم حذف العملية', '🗑️');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />

      <AddTransactionSheet open={toEdit !== null} onClose={() => setToEdit(null)} editTx={toEdit} />
      <AddTransactionSheet open={repeatPreset !== null} onClose={() => setRepeatPreset(null)} preset={repeatPreset} />
    </>
  );
}
