import React, { useRef, useState } from 'react';
import { Header } from '../components/layout/Header';
import { ConfirmSheet } from '../components/ui/Sheet';
import { useToast } from '../components/ui/Toast';
import { useNav } from '../components/layout/Nav';
import { useStore } from '../store/store';
import { StatementImport } from '../features/transactions/ImportStatementSheet';
import type { AppState } from '../types';

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3.5">{children}</div>;
}

export function SettingsPage() {
  const { state, dispatch } = useStore();
  const { go } = useNav();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `masareefy-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير البيانات', '📤');
    } catch {
      showToast('تعذر تصدير البيانات', '⚠️');
    }
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        if (!Array.isArray(parsed.transactions)) throw new Error('صيغة غير صحيحة');
        dispatch({ type: 'IMPORT', state: parsed });
        showToast('تم استيراد البيانات', '📥');
      } catch {
        showToast('ملف غير صالح', '⚠️');
      }
    };
    reader.readAsText(file);
  };

  const sectionCls = 'overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800';

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg space-y-4 px-4 pb-32 pt-2">
        <h1 className="px-1 text-xl font-extrabold">حسابي</h1>

        {/* البروفايل */}
        <section className="card flex items-center gap-3 anim-pop">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl dark:bg-zinc-800">👤</div>
          <div className="flex-1">
            <input
              value={state.settings.userName}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', patch: { userName: e.target.value } })}
              className="w-full bg-transparent text-base font-extrabold outline-none"
              aria-label="اسم المستخدم"
            />
            <p className="text-xs text-gray-400">اضغط على الاسم لتعديله</p>
          </div>
        </section>

        {/* التفضيلات */}
        <section className={sectionCls}>
          <Row>
            <span className="text-sm font-bold">بداية الشهر المالي</span>
            <select
              value={state.settings.monthStartDay}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', patch: { monthStartDay: Number(e.target.value) } })}
              className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-bold dark:bg-zinc-800"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>يوم {d}</option>
              ))}
            </select>
          </Row>
          <Row>
            <span className="text-sm font-bold">العملة</span>
            <span className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
              {state.settings.currency}
            </span>
          </Row>
          <Row>
            <span className="text-sm font-bold">الوضع الليلي</span>
            <button
              type="button"
              role="switch"
              aria-checked={state.settings.theme === 'dark'}
              onClick={() =>
                dispatch({ type: 'UPDATE_SETTINGS', patch: { theme: state.settings.theme === 'dark' ? 'light' : 'dark' } })
              }
              className={`relative h-7 w-12 rounded-full transition-colors ${
                state.settings.theme === 'dark' ? 'bg-brand-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  state.settings.theme === 'dark' ? 'right-[22px]' : 'right-0.5'
                }`}
              />
            </button>
          </Row>
        </section>

        {/* اختصارات */}
        <section className={sectionCls}>
          {([
            ['💼', 'الميزانية', 'budgets'],
            ['🧾', 'العمليات', 'transactions'],
            ['📈', 'التحليلات', 'analytics'],
            ['🎯', 'الأهداف', 'goals'],
          ] as const).map(([icon, label, view]) => (
            <button key={view} type="button" onClick={() => go(view)} className="press block w-full">
              <Row>
                <span className="flex items-center gap-2.5 text-sm font-bold"><span className="text-lg">{icon}</span> {label}</span>
                <span className="text-gray-300">‹</span>
              </Row>
            </button>
          ))}
        </section>

        {/* البيانات */}
        <section className={sectionCls}>
          <StatementImport
            trigger={(open) => (
              <button type="button" onClick={open} className="press block w-full">
                <Row>
                  <span className="flex items-center gap-2.5 text-sm font-bold"><span className="text-lg">🏦</span> استيراد كشف حساب الراجحي (PDF)</span>
                  <span className="text-gray-300">‹</span>
                </Row>
              </button>
            )}
          />
          <button type="button" onClick={exportData} className="press block w-full">
            <Row>
              <span className="flex items-center gap-2.5 text-sm font-bold"><span className="text-lg">📤</span> تصدير البيانات (JSON)</span>
              <span className="text-gray-300">‹</span>
            </Row>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="press block w-full">
            <Row>
              <span className="flex items-center gap-2.5 text-sm font-bold"><span className="text-lg">📥</span> استيراد البيانات (JSON)</span>
              <span className="text-gray-300">‹</span>
            </Row>
          </button>
          <button type="button" onClick={() => setConfirmClear(true)} className="press block w-full">
            <Row>
              <span className="flex items-center gap-2.5 text-sm font-bold text-red-500"><span className="text-lg">🗑️</span> مسح جميع البيانات</span>
              <span className="text-gray-300">‹</span>
            </Row>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = '';
            }}
          />
        </section>

        {/* عن التطبيق */}
        <section className="card text-center">
          <img src="/icons/logo.svg" alt="شعار مصاريفي" className="mx-auto h-16 w-16" />
          <p className="mt-1 font-extrabold">مصاريفي</p>
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">إدارة مصاريفك، بذكاء وسهولة</p>
          <p className="text-xs text-gray-400">النسخة 1.0.0 — تطبيق ويب يعمل بدون إنترنت، وبياناتك محفوظة على جهازك فقط.</p>
        </section>
      </main>

      <ConfirmSheet
        open={confirmClear}
        title="مسح جميع البيانات؟"
        message="سيتم حذف كل العمليات والميزانيات والأهداف نهائيًا من هذا الجهاز."
        confirmLabel="مسح الكل"
        onConfirm={() => {
          dispatch({ type: 'CLEAR_ALL' });
          setConfirmClear(false);
          showToast('تم مسح جميع البيانات', '🗑️');
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  );
}
