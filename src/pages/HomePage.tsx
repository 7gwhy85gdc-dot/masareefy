import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { useNav } from '../components/layout/Nav';
import { ProgressBar, SectionTitle, EmptyState } from '../components/ui/Basics';
import { ConfirmSheet } from '../components/ui/Sheet';
import { useToast } from '../components/ui/Toast';
import { useStore } from '../store/store';
import { currentPeriodExpenses, totalBudget } from '../store/selectors';
import { sumAmounts } from '../lib/period';
import { fmtSAR, fmtNum } from '../lib/format';
import { TransactionItem } from '../features/transactions/TransactionItem';
import { OverviewCard } from '../features/analytics/OverviewCard';
import type { Transaction } from '../types';

export function HomePage() {
  const { state, dispatch } = useStore();
  const { go } = useNav();
  const { showToast } = useToast();
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const monthTxs = currentPeriodExpenses(state);
  const spent = sumAmounts(monthTxs);
  const budget = totalBudget(state);
  const remaining = budget - spent;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const last5 = state.transactions.slice(0, 5);

  const quickLinks = [
    { icon: '🧾', label: 'العمليات', view: 'transactions' as const },
    { icon: '🎯', label: 'الأهداف', view: 'goals' as const },
    { icon: '📈', label: 'التحليلات', view: 'analytics' as const },
    { icon: '💼', label: 'الميزانية', view: 'budgets' as const },
  ];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-2">
        {/* كرت الميزانية الشهرية */}
        <section className="card anim-pop">
          <div className="flex items-center justify-between">
            <SectionTitle>الميزانية الشهرية</SectionTitle>
            <button
              type="button"
              onClick={() => go('budgets')}
              className="press rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              تعديل ✎
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl dark:bg-zinc-800">
              💰
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-zinc-400">الإجمالي</p>
              {budget > 0 ? (
                <p className="text-sm">
                  انفقت <span className="font-extrabold text-brand-600 dark:text-brand-400">{fmtSAR(spent)}</span>{' '}
                  من الميزانية <span className="font-bold">{fmtNum(budget)}</span> ريال
                </p>
              ) : (
                <p className="text-sm text-gray-400">لم تحدد ميزانية بعد</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={pct} />
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400">
              <span>{fmtNum(monthTxs.length)} عملية</span>
              <span className={remaining < 0 ? 'text-red-500 font-bold' : ''}>
                {remaining >= 0 ? `باقي ${fmtSAR(remaining)}` : `تجاوزت بـ ${fmtSAR(-remaining)}`}
              </span>
            </div>
          </div>
          {budget === 0 && (
            <button
              type="button"
              onClick={() => go('budgets')}
              className="press mt-4 w-full rounded-2xl bg-brand-500 py-3.5 font-bold text-white shadow-lg shadow-brand-500/30"
            >
              ＋ اضافة ميزانية جديدة
            </button>
          )}
        </section>

        {/* روابط سريعة */}
        <section className="grid grid-cols-4 gap-3">
          {quickLinks.map((q) => (
            <button
              key={q.view}
              type="button"
              onClick={() => go(q.view)}
              className="press card flex flex-col items-center gap-1.5 !p-3"
            >
              <span className="text-2xl">{q.icon}</span>
              <span className="text-[11px] font-bold text-gray-600 dark:text-zinc-300">{q.label}</span>
            </button>
          ))}
        </section>

        {/* آخر 5 عمليات */}
        <section className="card">
          <SectionTitle
            action={
              <button
                type="button"
                onClick={() => go('transactions')}
                className="press rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                ⟳ تحديث
              </button>
            }
          >
            آخر 5 عمليات
          </SectionTitle>
          {last5.length === 0 ? (
            <EmptyState icon="🧾" title="لا توجد عمليات بعد" subtitle="اضغط زر ＋ لإضافة أول عملية" />
          ) : (
            <>
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                {last5.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} onDelete={setToDelete} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go('transactions')}
                className="press mt-2 w-full rounded-2xl bg-brand-500 py-3.5 font-bold text-white shadow-lg shadow-brand-500/30"
              >
                المزيد
              </button>
            </>
          )}
        </section>

        {/* نظرة عامة */}
        <OverviewCard />
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
    </>
  );
}
