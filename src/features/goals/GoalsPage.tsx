import { useState } from 'react';
import { SubHeader } from '../../components/layout/Header';
import { ProgressBar, EmptyState } from '../../components/ui/Basics';
import { Sheet, ConfirmSheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store/store';
import { fmtSAR, fmtDate, uid } from '../../lib/format';
import { GOAL_ICONS } from '../../lib/categories';
import type { Goal } from '../../types';

export function GoalsPage() {
  const { state, dispatch } = useStore();
  const { showToast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [toDelete, setToDelete] = useState<Goal | null>(null);

  const openSheet = (g?: Goal) => {
    setEditing(g ?? null);
    setTitle(g?.title ?? '');
    setTarget(g ? String(g.targetAmount) : '');
    setCurrent(g ? String(g.currentAmount) : '');
    setDate(g?.expectedDate ?? '');
    setIcon(g?.icon ?? GOAL_ICONS[0]);
    setSheetOpen(true);
  };

  const save = () => {
    const t = parseFloat(target);
    const c = parseFloat(current) || 0;
    if (!title.trim() || isNaN(t) || t <= 0) return;
    const goal: Goal = {
      id: editing?.id ?? uid(),
      title: title.trim(),
      targetAmount: t,
      currentAmount: Math.max(0, c),
      expectedDate: date || undefined,
      icon,
    };
    dispatch(editing ? { type: 'UPDATE_GOAL', goal } : { type: 'ADD_GOAL', goal });
    showToast('تم حفظ الهدف', '🎯');
    setSheetOpen(false);
  };

  return (
    <>
      <SubHeader title="الأهداف" />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-2">
        <section className="card bg-gradient-to-l from-brand-500 to-brand-600 !text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold">🏁 الأهداف</h2>
              <p className="mt-1 text-sm text-white/80">متابعة اهدافك الادخارية</p>
            </div>
            <button
              type="button"
              onClick={() => openSheet()}
              className="press rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur"
            >
              ＋ هدف جديد
            </button>
          </div>
        </section>

        {state.goals.length === 0 ? (
          <div className="card">
            <EmptyState icon="🎯" title="لا توجد أهداف بعد" subtitle="أضف هدفًا ماليًا مثل سيارة أو سفر وابدأ الادخار" />
          </div>
        ) : (
          state.goals.map((g) => {
            const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const done = pct >= 100;
            return (
              <section key={g.id} className="card anim-pop">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-2xl dark:bg-zinc-800">
                    {g.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold">{g.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {done ? (
                        <span className="font-bold text-brand-600 dark:text-brand-400">لقد اكملت 100% من هدفك 🎉</span>
                      ) : (
                        <>اكملت <b>{Math.round(pct)}%</b> من هدفك</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" aria-label="تعديل" onClick={() => openSheet(g)}
                      className="press flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-zinc-800">✎</button>
                    <button type="button" aria-label="حذف" onClick={() => setToDelete(g)}
                      className="press flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-red-400 dark:bg-zinc-800">✕</button>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={pct} danger={false} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  <span>{fmtSAR(g.currentAmount)} من {fmtSAR(g.targetAmount)}</span>
                  {g.expectedDate && <span>المتوقع: {fmtDate(g.expectedDate)}</span>}
                </div>
              </section>
            );
          })
        )}
      </main>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'تعديل الهدف' : 'هدف جديد'}>
        <div className="space-y-4 pt-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اسم الهدف: سيارة، سفر، جهاز…"
            autoFocus
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="المبلغ المطلوب"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800" />
            </div>
            <div className="relative flex-1">
              <input inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="المبلغ الحالي"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800" />
            </div>
          </div>
          <label className="block text-xs font-semibold text-gray-500">
            تاريخ الوصول المتوقع
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
          </label>
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-500 dark:text-zinc-400">الأيقونة</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`press flex h-11 w-11 items-center justify-center rounded-2xl text-xl ${
                    icon === ic ? 'bg-brand-500 shadow-md' : 'bg-gray-100 dark:bg-zinc-800'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            className="press w-full rounded-2xl bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30"
          >
            ✓ حفظ الهدف
          </button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={toDelete !== null}
        title={`حذف هدف «${toDelete?.title ?? ''}»؟`}
        confirmLabel="حذف"
        onConfirm={() => {
          if (toDelete) {
            dispatch({ type: 'DELETE_GOAL', id: toDelete.id });
            showToast('تم حذف الهدف', '🗑️');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
