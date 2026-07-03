import { useState } from 'react';
import { SubHeader } from '../../components/layout/Header';
import { ProgressBar, EmptyState, Chip, CategoryIcon } from '../../components/ui/Basics';
import { Sheet, ConfirmSheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store/store';
import { currentPeriodExpenses, spentByCategory, totalBudget } from '../../store/selectors';
import { sumAmounts, periodKey } from '../../lib/period';
import { fmtSAR, uid } from '../../lib/format';
import type { Budget } from '../../types';

export function BudgetsPage() {
  const { state, dispatch, categories } = useStore();
  const { showToast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [amount, setAmount] = useState('');
  const [catId, setCatId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Budget | null>(null);

  const monthTxs = currentPeriodExpenses(state);
  const spent = sumAmounts(monthTxs);
  const byCat = spentByCategory(monthTxs);
  const total = totalBudget(state);
  const catBudgets = state.budgets.filter((b) => b.categoryId !== null);

  const openSheet = (b?: Budget, forTotal = false) => {
    setEditing(b ?? null);
    setAmount(b ? String(b.amount) : '');
    setCatId(forTotal ? null : b ? b.categoryId : categories[0]?.id ?? null);
    setSheetOpen(true);
  };

  const save = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    const isTotal = editing ? editing.categoryId === null : catId === null;
    const cat = categories.find((c) => c.id === catId);
    const existing =
      editing ??
      state.budgets.find((b) => (isTotal ? b.categoryId === null : b.categoryId === catId));
    const budget: Budget = {
      id: existing?.id ?? uid(),
      name: isTotal ? 'الميزانية الشهرية' : cat?.name ?? '',
      amount: value,
      categoryId: isTotal ? null : catId,
      month: existing?.month ?? periodKey(state.settings.monthStartDay),
    };
    dispatch({ type: 'UPSERT_BUDGET', budget });
    showToast('تم حفظ الميزانية');
    setSheetOpen(false);
  };

  return (
    <>
      <SubHeader title="الميزانية" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-2">
        {/* الميزانية الإجمالية */}
        <section className="card anim-pop">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">الميزانية الشهرية</h2>
            <button
              type="button"
              onClick={() => openSheet(state.budgets.find((b) => b.categoryId === null), true)}
              className="press rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              تعديل ✎
            </button>
          </div>
          {total > 0 ? (
            <>
              <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{fmtSAR(total)}</p>
              <div className="mt-3">
                <ProgressBar value={total > 0 ? (spent / total) * 100 : 0} />
              </div>
              <div className="mt-2 flex justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400">
                <span>المصروف: {fmtSAR(spent)}</span>
                <span className={total - spent < 0 ? 'text-red-500' : ''}>
                  المتبقي: {fmtSAR(total - spent)}
                </span>
              </div>
            </>
          ) : (
            <EmptyState icon="💼" title="لم تحدد ميزانية شهرية" subtitle="حدد ميزانيتك لمتابعة استهلاكك" />
          )}
        </section>

        {/* ميزانيات التصنيفات */}
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">ميزانيات التصنيفات</h2>
            <button
              type="button"
              onClick={() => openSheet()}
              className="press rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              ＋ إضافة
            </button>
          </div>
          {catBudgets.length === 0 ? (
            <EmptyState icon="🗂️" title="لا توجد ميزانيات فرعية" subtitle="أضف ميزانية لكل تصنيف لضبط صرفك" />
          ) : (
            <div className="space-y-4">
              {catBudgets.map((b) => {
                const cat = categories.find((c) => c.id === b.categoryId);
                const catSpent = byCat.get(b.categoryId!) ?? 0;
                const pct = b.amount > 0 ? (catSpent / b.amount) * 100 : 0;
                return (
                  <div key={b.id} className="flex items-center gap-3">
                    <CategoryIcon icon={cat?.icon ?? '📦'} color={cat?.color ?? '#64748b'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">{b.name}</span>
                        <span className="text-gray-500 dark:text-zinc-400">
                          {fmtSAR(catSpent)} / {fmtSAR(b.amount)}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={pct} />
                      </div>
                      <p className={`mt-1 text-[11px] font-semibold ${b.amount - catSpent < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {b.amount - catSpent >= 0
                          ? `باقي ${fmtSAR(b.amount - catSpent)}`
                          : `تجاوزت بـ ${fmtSAR(catSpent - b.amount)}`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" aria-label="تعديل" onClick={() => openSheet(b)}
                        className="press flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-zinc-800">✎</button>
                      <button type="button" aria-label="حذف" onClick={() => setToDelete(b)}
                        className="press flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs text-red-400 dark:bg-zinc-800">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Sheet إضافة/تعديل */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'تعديل الميزانية' : 'ميزانية جديدة'}
      >
        <div className="space-y-4 pt-2">
          <div className="relative">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="المبلغ بالريال"
              autoFocus
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-lg font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">ريال</span>
          </div>
          {(!editing || editing.categoryId !== null) && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-500 dark:text-zinc-400">التصنيف</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Chip key={c.id} active={catId === c.id} onClick={() => setCatId(c.id)}>
                    {c.icon} {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={save}
            className="press w-full rounded-2xl bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30"
          >
            ✓ حفظ
          </button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={toDelete !== null}
        title={`حذف ميزانية «${toDelete?.name ?? ''}»؟`}
        confirmLabel="حذف"
        onConfirm={() => {
          if (toDelete) {
            dispatch({ type: 'DELETE_BUDGET', id: toDelete.id });
            showToast('تم حذف الميزانية', '🗑️');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
