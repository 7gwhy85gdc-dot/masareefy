import { useEffect, useMemo, useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { Chip } from '../../components/ui/Basics';
import { useToast } from '../../components/ui/Toast';
import { useStore } from '../../store/store';
import { uid, fmtSAR } from '../../lib/format';
import type { Transaction } from '../../types';

export interface TxPreset {
  amount?: number;
  categoryId?: string;
  storeName?: string;
  note?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** عند تمرير عملية موجودة يعمل كنموذج تعديل */
  editTx?: Transaction | null;
  /** تعبئة مسبقة لعملية جديدة (زر «كرر») */
  preset?: TxPreset | null;
}

export function AddTransactionSheet({ open, onClose, editTx, preset }: Props) {
  const { state, dispatch, categories } = useStore();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (open) {
      const src = editTx ?? preset;
      setAmount(src?.amount ? String(src.amount) : '');
      setCategoryId(src?.categoryId ?? '');
      setStoreName(src?.storeName ?? '');
      setNote(editTx?.note ?? '');
      setError('');
      setShowNewCat(false);
      setNewCatName('');
    }
  }, [open, editTx, preset]);

  // فهرس المتاجر السابقة: الاسم ← أحدث تصنيف + عدد مرات الاستخدام
  const storeIndex = useMemo(() => {
    const m = new Map<string, { categoryId: string; count: number }>();
    for (const t of state.transactions) {
      const name = t.storeName?.trim();
      if (!name) continue;
      const cur = m.get(name);
      if (cur) cur.count++;
      else m.set(name, { categoryId: t.categoryId, count: 1 });
    }
    return m;
  }, [state.transactions]);

  const storeSuggestions = useMemo(() => {
    const q = storeName.trim();
    const all = [...storeIndex.entries()].sort((a, b) => b[1].count - a[1].count);
    const filtered = q ? all.filter(([name]) => name.toLowerCase().includes(q.toLowerCase()) && name !== q) : all;
    return filtered.slice(0, 6);
  }, [storeIndex, storeName]);

  const pickStore = (name: string, catId: string) => {
    setStoreName(name);
    setCategoryId((cur) => cur || catId);
  };

  const save = () => {
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) {
      setError('أدخل مبلغًا صحيحًا أكبر من صفر');
      return;
    }
    if (!categoryId) {
      setError('اختر تصنيفًا للعملية');
      return;
    }
    const cat = categories.find((c) => c.id === categoryId)!;
    const tx: Transaction = {
      id: editTx?.id ?? uid(),
      amount: value,
      categoryId: cat.id,
      categoryName: cat.name,
      storeName: storeName.trim() || undefined,
      note: note.trim() || undefined,
      date: editTx?.date ?? new Date().toISOString(),
      type: 'expense',
    };
    dispatch(editTx ? { type: 'UPDATE_TX', tx } : { type: 'ADD_TX', tx });
    showToast(editTx ? 'تم تعديل العملية' : `تمت إضافة ${fmtSAR(value)}`);
    onClose();
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const id = `custom-${uid().slice(0, 8)}`;
    dispatch({ type: 'ADD_CATEGORY', category: { id, name, icon: '🏷️', color: '#0d9488', custom: true } });
    setCategoryId(id);
    setShowNewCat(false);
    setNewCatName('');
  };

  return (
    <Sheet open={open} onClose={onClose} title={editTx ? 'تعديل العملية' : 'عملية جديدة'}>
      <div className="space-y-4 pt-2">
        {/* المبلغ */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              inputMode="decimal"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="المبلغ بالريال"
              autoFocus
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-lg font-bold outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">ريال</span>
          </div>
        </div>

        {/* التصنيفات */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-zinc-400">
            <span className="text-brand-500">▦</span> اختر تصنيف
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                <span className="ml-1">{c.icon}</span> {c.name}
              </Chip>
            ))}
            <Chip onClick={() => setShowNewCat((v) => !v)}>＋ تصنيف جديد</Chip>
          </div>
          {showNewCat && (
            <div className="mt-2 flex gap-2 anim-pop">
              <input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="اسم التصنيف"
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button type="button" onClick={addCategory} className="press rounded-2xl bg-brand-100 px-4 text-sm font-bold text-brand-700 dark:bg-zinc-800 dark:text-brand-400">
                إضافة
              </button>
            </div>
          )}
        </div>

        {/* اسم المتجر مع اقتراحات من متاجرك السابقة */}
        <div>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="اسم المتجر: اختياري"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800"
          />
          {storeSuggestions.length > 0 && (
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
              {storeSuggestions.map(([name, info]) => {
                const cat = categories.find((c) => c.id === info.categoryId);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pickStore(name, info.categoryId)}
                    className="press flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    <span>{cat?.icon ?? '🏪'}</span> {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ملاحظات */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظات: اختياري"
          rows={2}
          className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-zinc-700 dark:bg-zinc-800"
        />

        {error && <p className="text-sm font-medium text-red-500 anim-pop">{error}</p>}

        <button
          type="button"
          onClick={save}
          className="press w-full rounded-2xl bg-brand-500 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/30"
        >
          ✓ {editTx ? 'حفظ التعديل' : 'تأكيد'}
        </button>
      </div>
    </Sheet>
  );
}
