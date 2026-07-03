import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from 'recharts';
import { EmptyState, SectionTitle } from '../../components/ui/Basics';
import { useStore } from '../../store/store';
import { financialPeriod, lastDays, expensesIn, sumAmounts, type Range } from '../../lib/period';
import { fmtSAR } from '../../lib/format';
import { DEFAULT_CATEGORIES } from '../../lib/categories';
import { spentByCategory } from '../../store/selectors';

type Tab = 'month' | 'd30' | 'm3' | 'custom';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'month', label: 'هذا الشهر' },
  { id: 'd30', label: 'آخر 30 يوم' },
  { id: 'm3', label: 'آخر 3 أشهر' },
  { id: 'custom', label: 'فترة أخرى' },
];

export function OverviewCard() {
  const { state, categories } = useStore();
  const [tab, setTab] = useState<Tab>('month');
  const [chart, setChart] = useState<'pie' | 'bar'>('pie');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const range: Range = useMemo(() => {
    if (tab === 'month') return financialPeriod(state.settings.monthStartDay);
    if (tab === 'd30') return lastDays(30);
    if (tab === 'm3') return lastDays(90);
    const start = from ? new Date(from) : new Date(0);
    const end = to ? new Date(new Date(to).getTime() + 86_400_000) : new Date();
    return { start, end };
  }, [tab, from, to, state.settings.monthStartDay]);

  const txs = useMemo(() => expensesIn(state.transactions, range), [state.transactions, range]);

  const data = useMemo(() => {
    const byCat = spentByCategory(txs);
    return [...byCat.entries()]
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id) ?? DEFAULT_CATEGORIES[8];
        return { name: cat.name, value: Math.round(value * 100) / 100, color: cat.color, icon: cat.icon };
      })
      .sort((a, b) => b.value - a.value);
  }, [txs, categories]);

  const total = sumAmounts(txs);

  return (
    <section className="card">
      <SectionTitle
        action={
          <div className="flex overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800 p-0.5">
            <button
              type="button" aria-label="دائري"
              onClick={() => setChart('pie')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${chart === 'pie' ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
            >◔</button>
            <button
              type="button" aria-label="أعمدة"
              onClick={() => setChart('bar')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${chart === 'bar' ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
            >▥</button>
          </div>
        }
      >
        نظرة عامة على استهلاكك
      </SectionTitle>

      <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`press whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${
              tab === t.id
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'custom' && (
        <div className="mb-3 flex gap-2 anim-pop">
          <label className="flex-1 text-xs text-gray-500">
            من
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
          <label className="flex-1 text-xs text-gray-500">
            إلى
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState icon="📊" title="لا توجد عمليات لهذه الفترة" subtitle="أضف عملية جديدة لتظهر التحليلات هنا" />
      ) : (
        <>
          <div className="h-52 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              {chart === 'pie' ? (
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                    {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtSAR(v)} />
                </PieChart>
              ) : (
                <BarChart data={data} margin={{ top: 8, left: 0, right: 0 }}>
                  <XAxis dataKey="icon" tickLine={false} axisLine={false} fontSize={14} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => fmtSAR(v)} labelFormatter={() => ''} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-sm font-bold text-gray-500 dark:text-zinc-400">
            الإجمالي: <span className="text-brand-600 dark:text-brand-400">{fmtSAR(total)}</span>
          </p>
          <div className="mt-3 space-y-1.5">
            {data.slice(0, 5).map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 text-gray-600 dark:text-zinc-300">{d.icon} {d.name}</span>
                <span className="font-bold">{fmtSAR(d.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
