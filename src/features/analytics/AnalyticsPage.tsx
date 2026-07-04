import { useMemo, useState } from 'react';
import { askExpenses } from '../../lib/ask';
import { SubHeader } from '../../components/layout/Header';
import { EmptyState, CategoryIcon } from '../../components/ui/Basics';
import { useStore } from '../../store/store';
import {
  currentPeriodExpenses, spentByCategory, spentByStore, topEntry, totalBudget,
} from '../../store/selectors';
import { sumAmounts } from '../../lib/period';
import { fmtSAR } from '../../lib/format';
import { DEFAULT_CATEGORIES } from '../../lib/categories';
import { OverviewCard } from './OverviewCard';

export function AnalyticsPage() {
  const { state, categories } = useStore();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const ask = () => setAnswer(askExpenses(question, state, categories));

  const cur = currentPeriodExpenses(state);
  const prev = currentPeriodExpenses(state, -1);
  const curTotal = sumAmounts(cur);
  const prevTotal = sumAmounts(prev);
  const budget = totalBudget(state);

  const byCat = useMemo(() => spentByCategory(cur), [cur]);
  const prevByCat = useMemo(() => spentByCategory(prev), [prev]);
  const byStore = useMemo(() => spentByStore(cur), [cur]);

  const topCat = topEntry(byCat);
  const topStore = topEntry(byStore);
  const topCatInfo = topCat ? categories.find((c) => c.id === topCat[0]) : null;

  // رسائل ذكية
  const messages: Array<{ icon: string; text: string }> = [];
  if (topCat && topCatInfo) {
    messages.push({ icon: topCatInfo.icon, text: `أكثر مصروفاتك هذا الشهر كانت على ${topCatInfo.name} بمبلغ ${fmtSAR(topCat[1])}.` });
  }
  for (const [catId, amount] of byCat.entries()) {
    const before = prevByCat.get(catId) ?? 0;
    if (before >= 50 && amount > before * 1.2) {
      const c = categories.find((x) => x.id === catId);
      if (c) messages.push({ icon: '📈', text: `مصروفاتك على ${c.name} ارتفعت عن الشهر الماضي (${fmtSAR(before)} ← ${fmtSAR(amount)}).` });
    }
  }
  if (budget > 0 && budget - curTotal > 0) {
    messages.push({ icon: '💚', text: `باقي لك ${fmtSAR(budget - curTotal)} من الميزانية الشهرية.` });
  } else if (budget > 0) {
    messages.push({ icon: '⚠️', text: `تجاوزت ميزانيتك الشهرية بـ ${fmtSAR(curTotal - budget)}.` });
  }
  if (prevTotal > 0 && curTotal < prevTotal) {
    messages.push({ icon: '👏', text: `أحسنت! صرفك هذا الشهر أقل من الشهر الماضي بـ ${fmtSAR(prevTotal - curTotal)}.` });
  }

  const catRows = [...byCat.entries()]
    .map(([id, amount]) => ({
      cat: categories.find((c) => c.id === id) ?? DEFAULT_CATEGORIES[8],
      amount,
      pct: curTotal > 0 ? (amount / curTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <>
      <SubHeader title="التحليلات" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-2">
        {/* اسأل مصاريفك */}
        <section className="card anim-pop">
          <h2 className="mb-2 text-base font-bold">💬 اسأل مصاريفك</h2>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="كم صرفت على المقاهي هذا الشهر؟"
              className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              type="button"
              onClick={ask}
              className="press shrink-0 rounded-2xl bg-brand-500 px-4 text-sm font-bold text-white"
            >
              اسأل
            </button>
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {['كم صرفت على المطاعم هذا الشهر؟', 'كم باقي من الميزانية؟', 'أكثر متجر صرفت فيه؟', 'كم صرفت هذا الأسبوع؟'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuestion(s); setAnswer(askExpenses(s, state, categories)); }}
                className="press shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {s}
              </button>
            ))}
          </div>
          {answer && (
            <p className="anim-pop mt-3 rounded-2xl bg-brand-50 p-3 text-sm font-semibold leading-relaxed text-brand-800 dark:bg-zinc-800 dark:text-brand-300">
              {answer}
            </p>
          )}
        </section>

        {cur.length === 0 && prev.length === 0 ? (
          <div className="card">
            <EmptyState icon="📊" title="لا توجد بيانات للتحليل" subtitle="أضف بعض العمليات وستظهر التحليلات هنا" />
          </div>
        ) : (
          <>
            {/* مقارنة الشهرين */}
            <section className="grid grid-cols-2 gap-3 anim-pop">
              <div className="card !p-4 text-center">
                <p className="text-xs font-semibold text-gray-400">هذا الشهر</p>
                <p className="mt-1 text-xl font-extrabold text-brand-600 dark:text-brand-400">{fmtSAR(curTotal)}</p>
              </div>
              <div className="card !p-4 text-center">
                <p className="text-xs font-semibold text-gray-400">الشهر السابق</p>
                <p className="mt-1 text-xl font-extrabold text-gray-600 dark:text-zinc-300">{fmtSAR(prevTotal)}</p>
                {prevTotal > 0 && (
                  <p className={`mt-0.5 text-[11px] font-bold ${curTotal > prevTotal ? 'text-red-500' : 'text-brand-600'}`}>
                    {curTotal > prevTotal ? '▲' : '▼'}{' '}
                    {Math.abs(Math.round(((curTotal - prevTotal) / prevTotal) * 100))}%
                  </p>
                )}
              </div>
            </section>

            {/* أبرز الأرقام */}
            <section className="grid grid-cols-2 gap-3">
              <div className="card !p-4">
                <p className="text-xs font-semibold text-gray-400">أكثر تصنيف صرفًا</p>
                {topCatInfo ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl">{topCatInfo.icon}</span>
                    <div>
                      <p className="text-sm font-extrabold">{topCatInfo.name}</p>
                      <p className="text-xs text-gray-500">{fmtSAR(topCat![1])}</p>
                    </div>
                  </div>
                ) : <p className="mt-2 text-sm text-gray-400">—</p>}
              </div>
              <div className="card !p-4">
                <p className="text-xs font-semibold text-gray-400">أكثر متجر صرفًا</p>
                {topStore ? (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <p className="truncate text-sm font-extrabold">{topStore[0]}</p>
                      <p className="text-xs text-gray-500">{fmtSAR(topStore[1])}</p>
                    </div>
                  </div>
                ) : <p className="mt-2 text-sm text-gray-400">—</p>}
              </div>
            </section>

            {/* رسائل ذكية */}
            {messages.length > 0 && (
              <section className="card space-y-3">
                <h2 className="text-base font-bold">✨ ملاحظات ذكية</h2>
                {messages.map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800">
                    <span className="text-lg">{m.icon}</span>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{m.text}</p>
                  </div>
                ))}
              </section>
            )}

            {/* حسب التصنيف */}
            <section className="card">
              <h2 className="mb-3 text-base font-bold">المصروفات حسب التصنيف</h2>
              {catRows.length === 0 ? (
                <EmptyState icon="🗂️" title="لا توجد مصروفات هذا الشهر" />
              ) : (
                <div className="space-y-3">
                  {catRows.map(({ cat, amount, pct }) => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold">{cat.name}</span>
                          <span className="text-gray-500 dark:text-zinc-400">{fmtSAR(amount)}</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                      <span className="w-10 text-left text-xs font-bold text-gray-400">{Math.round(pct)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <OverviewCard />
          </>
        )}
      </main>
    </>
  );
}
