import { useMemo, useState } from 'react';
import { Chip, CategoryIcon, EmptyState } from '../../components/ui/Basics';
import { Sheet, ConfirmSheet } from '../../components/ui/Sheet';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store/store';
import { fmtSAR, uid } from '../../lib/format';
import { Icon } from '../../components/ui/Icons';
import type { Recurring } from '../../types';

/** الالتزامات الشهرية المتكررة: اشتراكات، أقساط، إيجار… تُسجَّل تلقائيًا في يومها */
export function RecurringSection() {
  const { state, dispatch, categories } = useStore();
  const { showToast } = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(1);
  const [catId, setCatId] = useState('bills');
  const [toDelete, setToDelete] = useState<Recurring | null>(null);

  const total = state.recurrings.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  // اقتراحات: نفس المتجر والمبلغ تكرر في شهرين مختلفين أو أكثر
  const suggestions = useMemo(() => {
    const groups = new Map<string, { name: string; amount: number; categoryId: string; months: Set<string>; lastDay: number }>();
    for (const t of state.transactions) {
      if (t.type !== 'expense' || !t.storeName || t.amount < 10) continue;
      const key = `${t.storeName}|${t.amount}`;
      const month = t.date.slice(0, 7);
      const d = new Date(t.date).getDate();
      const g = groups.get(key);
      if (g) { g.months.add(month); g.lastDay = d; }
      else groups.set(key, { name: t.storeName, amount: t.amount, categoryId: t.categoryId, months: new Set([month]), lastDay: d });
    }
    return [...groups.values()]
      .filter((g) => g.months.size >= 2)
      .filter((g) => !state.recurrings.some((r) => r.name === g.name && r.amount === g.amount))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [state.transactions, state.recurrings]);

  const openSheet = (r?: Recurring) => {
    setEditing(r ?? null);
    setName(r?.name ?? '');
    setAmount(r ? String(r.amount) : '');
    setDay(r?.dayOfMonth ?? 1);
    setCatId(r?.categoryId ?? 'bills');
    setSheetOpen(true);
  };

  const save = () => {
    const value = parseFloat(amount);
    if (!name.trim() || isNaN(value) || value <= 0) return;
    const cat = categories.find((c) => c.id === catId);
    const recurring: Recurring = {
      id: editing?.id ?? uid(),
      name: name.trim(),
      amount: value,
      categoryId: catId,
      categoryName: cat?.name ?? 'أخرى',
      dayOfMonth: Math.min(28, Math.max(1, day)),
      active: editing?.active ?? true,
      lastPosted: editing?.lastPosted,
    };
    dispatch(editing ? { type: 'UPDATE_RECURRING', recurring } : { type: 'ADD_RECURRING', recurring });
    showToast('تم حفظ الالتزام الشهري', '🔁');
    setSheetOpen(false);
  };

  const addSuggestion = (s: (typeof suggestions)[number]) => {
    const cat = categories.find((c) => c.id === s.categoryId);
    dispatch({
      type: 'ADD_RECURRING',
      recurring: {
        id: uid(), name: s.name, amount: s.amount, categoryId: s.categoryId,
        categoryName: cat?.name ?? 'أخرى', dayOfMonth: Math.min(28, s.lastDay), active: true,
        lastPosted: new Date().toISOString().slice(0, 7), // لا نكرر الشهر الحالي (موجودة أصلًا)
      },
    });
    showToast(`أُضيف «${s.name}» كالتزام شهري`, '🔁');
  };

  return (
    <>
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold">
              <span className="text-brand-600 dark:text-brand-400"><Icon name="repeat" size={18} /></span>
              الالتزامات الشهرية
            </h2>
            {total > 0 && <p className="text-xs text-gray-400">إجمالي {fmtSAR(total)} شهريًا — تُسجَّل تلقائيًا في يومها</p>}
          </div>
          <button
            type="button"
            onClick={() => openSheet()}
            className="press rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm"
          >
            ＋ إضافة
          </button>
        </div>

        {state.recurrings.length === 0 && suggestions.length === 0 ? (
          <EmptyState icon="🔁" title="لا توجد التزامات متكررة" subtitle="أضف اشتراكاتك وأقساطك لتُسجَّل تلقائيًا كل شهر" />
        ) : (
          <div className="space-y-3">
            {state.recurrings.map((r) => {
              const cat = categories.find((c) => c.id === r.categoryId);
              return (
                <div key={r.id} className={`flex items-center gap-3 ${r.active ? '' : 'opacity-45'}`}>
                  <CategoryIcon icon={cat?.icon ?? '🔁'} color={cat?.color ?? '#64748b'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{r.name}</p>
                    <p className="text-[11px] text-gray-400">يوم {r.dayOfMonth} من كل شهر · {r.categoryName}</p>
                  </div>
                  <span className="text-sm font-extrabold">{fmtSAR(r.amount)}</span>
                  <div className="flex flex-col gap-1">
                    <button type="button" aria-label="تعديل" onClick={() => openSheet(r)}
                      className="press flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs dark:bg-zinc-800">✎</button>
                    <button type="button" aria-label="حذف" onClick={() => setToDelete(r)}
                      className="press flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs text-red-400 dark:bg-zinc-800">✕</button>
                  </div>
                </div>
              );
            })}

            {suggestions.length > 0 && (
              <div className="rounded-2xl bg-brand-50 p-3 dark:bg-zinc-800">
                <p className="mb-2 text-xs font-bold text-brand-700 dark:text-brand-400">✨ اكتشفنا مصروفات تتكرر شهريًا — أضفها كالتزام:</p>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div key={`${s.name}|${s.amount}`} className="flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{s.name} — {fmtSAR(s.amount)}</p>
                      <button
                        type="button"
                        onClick={() => addSuggestion(s)}
                        className="press shrink-0 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white"
                      >
                        ＋ أضف
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'تعديل التزام' : 'التزام شهري جديد'}>
        <div className="space-y-4 pt-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم: نتفلكس، إيجار، قسط…"
            autoFocus
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold outline-none focus:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="المبلغ"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">ريال</span>
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-500 dark:border-zinc-700 dark:bg-zinc-800">
              يوم
              <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="bg-transparent text-sm font-bold outline-none">
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c.id} active={catId === c.id} onClick={() => setCatId(c.id)}>{c.icon} {c.name}</Chip>
            ))}
          </div>
          {editing && (
            <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-zinc-800">
              <span className="text-sm font-bold">مفعّل</span>
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-5 w-5 accent-brand-500"
              />
            </label>
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
        title={`حذف التزام «${toDelete?.name ?? ''}»؟`}
        message="لن تُحذف العمليات المسجلة سابقًا."
        confirmLabel="حذف"
        onConfirm={() => {
          if (toDelete) {
            dispatch({ type: 'DELETE_RECURRING', id: toDelete.id });
            showToast('تم حذف الالتزام', '🗑️');
          }
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
