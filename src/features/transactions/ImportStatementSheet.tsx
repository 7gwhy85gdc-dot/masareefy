import React, { useMemo, useRef, useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { CategoryIcon, EmptyState } from '../../components/ui/Basics';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store/store';
import { fmtSAR, fmtDate, uid, dayKey } from '../../lib/format';
import { DEFAULT_CATEGORIES } from '../../lib/categories';
import type { ParsedTx } from '../../lib/rajhi';
import type { Transaction } from '../../types';

interface Props {
  /** يعرض زر/عنصر الفتح — المكوّن يدير اختيار الملف والمعاينة والاستيراد */
  trigger: (open: () => void) => React.ReactNode;
}

export function StatementImport({ trigger }: Props) {
  const { state, dispatch } = useStore();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedTx[] | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [includeIncome, setIncludeIncome] = useState(true);
  const [previewLimit, setPreviewLimit] = useState(100);

  const openPicker = () => {
    setError('');
    fileRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setError('');
    try {
      const { parseRajhiPdf } = await import('../../lib/rajhi');
      const txs = await parseRajhiPdf(file);
      // كشف التكرارات: نفس اليوم + نفس المبلغ + نفس النوع موجودة مسبقًا
      const existing = new Set(
        state.transactions.map((t) => `${dayKey(t.date)}|${t.amount}|${t.type}`)
      );
      const excludedIdx = new Set<number>();
      txs.forEach((t, i) => {
        const type = t.direction === 'credit' ? 'income' : 'expense';
        t.duplicate = existing.has(`${dayKey(t.date)}|${t.amount}|${type}`);
        if (t.duplicate) excludedIdx.add(i);
      });
      setParsed(txs);
      setExcluded(excludedIdx);
      setIncludeIncome(true);
      setPreviewLimit(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر قراءة الملف');
      setParsed(null);
    } finally {
      setParsing(false);
    }
  };

  const active = useMemo(() => {
    if (!parsed) return [];
    return parsed
      .map((t, i) => ({ t, i }))
      .filter(({ t, i }) => !excluded.has(i) && (includeIncome || t.direction === 'debit'));
  }, [parsed, excluded, includeIncome]);

  const totals = useMemo(() => {
    let debit = 0, credit = 0;
    for (const { t } of active) t.direction === 'debit' ? (debit += t.amount) : (credit += t.amount);
    return { debit, credit };
  }, [active]);

  const doImport = () => {
    const txs: Transaction[] = active.map(({ t }) => ({
      id: uid(),
      amount: t.amount,
      categoryId: t.categoryId,
      categoryName: t.categoryName,
      storeName: t.storeName || t.title,
      note: `${t.title} — مستورد من كشف الراجحي`,
      date: t.date,
      type: t.direction === 'credit' ? 'income' : 'expense',
    }));
    dispatch({ type: 'ADD_TXS', txs });
    showToast(`تم استيراد ${txs.length} عملية`, '🏦');
    setParsed(null);
  };

  const toggle = (i: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const catOf = (id: string) =>
    DEFAULT_CATEGORIES.find((c) => c.id === id) ?? DEFAULT_CATEGORIES[8];

  const dupCount = parsed?.filter((t) => t.duplicate).length ?? 0;

  return (
    <>
      {trigger(openPicker)}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

      {/* حالة التحميل */}
      {parsing && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 anim-fade">
          <div className="card flex flex-col items-center gap-3 !rounded-3xl px-8 py-6 anim-pop">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
            <p className="text-sm font-bold">جاري قراءة كشف الحساب…</p>
          </div>
        </div>
      )}

      {/* خطأ */}
      {error && (
        <Sheet open onClose={() => setError('')} title="تعذر الاستيراد">
          <EmptyState icon="⚠️" title="لم نتمكن من قراءة الملف" subtitle={error} />
        </Sheet>
      )}

      {/* المعاينة */}
      <Sheet open={parsed !== null} onClose={() => setParsed(null)} title="معاينة كشف الحساب 🏦">
        {parsed && (
          <div className="space-y-4 pt-1">
            {/* ملخص */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800">
                <p className="text-lg font-extrabold">{active.length}</p>
                <p className="text-[11px] font-semibold text-gray-400">عملية للاستيراد</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800">
                <p className="text-lg font-extrabold text-brand-600">{fmtSAR(totals.debit)}</p>
                <p className="text-[11px] font-semibold text-gray-400">مصروفات</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-3 dark:bg-zinc-800">
                <p className="text-lg font-extrabold text-sky-600">{fmtSAR(totals.credit)}</p>
                <p className="text-[11px] font-semibold text-gray-400">إيداعات</p>
              </div>
            </div>

            {/* خيارات */}
            <label className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-zinc-800">
              <span className="text-sm font-bold">استيراد الإيداعات والحوالات الواردة</span>
              <input
                type="checkbox"
                checked={includeIncome}
                onChange={(e) => setIncludeIncome(e.target.checked)}
                className="h-5 w-5 accent-brand-500"
              />
            </label>
            {dupCount > 0 && (
              <p className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                ⚠️ تم استبعاد {dupCount} عملية مكررة (موجودة مسبقًا) — يمكنك إعادة تفعيلها من القائمة.
              </p>
            )}

            {/* القائمة */}
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-gray-100 p-2 dark:border-zinc-800">
              {parsed.slice(0, previewLimit).map((t, i) => {
                const cat = catOf(t.categoryId);
                const hiddenByIncome = !includeIncome && t.direction === 'credit';
                const checked = !excluded.has(i) && !hiddenByIncome;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={hiddenByIncome}
                    onClick={() => toggle(i)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-start transition-opacity ${
                      checked ? '' : 'opacity-40'
                    }`}
                  >
                    <input type="checkbox" readOnly checked={checked} className="h-4 w-4 shrink-0 accent-brand-500" />
                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold">
                        {t.storeName || t.title}
                        {t.duplicate && <span className="mr-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">مكرر</span>}
                      </span>
                      <span className="block text-[11px] text-gray-400">{fmtDate(t.date)} · {t.categoryName}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] font-extrabold ${t.direction === 'credit' ? 'text-sky-600' : 'text-gray-700 dark:text-zinc-200'}`}>
                      {t.direction === 'credit' ? '＋' : '−'}{fmtSAR(t.amount)}
                    </span>
                  </button>
                );
              })}
              {parsed.length > previewLimit && (
                <button
                  type="button"
                  onClick={() => setPreviewLimit((l) => l + 200)}
                  className="press w-full rounded-xl bg-gray-50 py-2.5 text-xs font-bold text-brand-600 dark:bg-zinc-800 dark:text-brand-400"
                >
                  عرض المزيد ({(parsed.length - previewLimit).toLocaleString('en')} عملية متبقية)
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={doImport}
              disabled={active.length === 0}
              className="press w-full rounded-2xl bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30 disabled:opacity-40"
            >
              ✓ استيراد {active.length} عملية
            </button>
          </div>
        )}
      </Sheet>
    </>
  );
}
