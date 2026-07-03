import { Header } from '../components/layout/Header';
import { EmptyState } from '../components/ui/Basics';
import { useStore } from '../store/store';
import { computeAlerts } from '../store/selectors';

const LEVEL_STYLE = {
  danger: { icon: '🔴', bg: 'bg-red-50 dark:bg-red-950/30', ring: 'ring-red-100 dark:ring-red-900/40' },
  warning: { icon: '🟠', bg: 'bg-amber-50 dark:bg-amber-950/30', ring: 'ring-amber-100 dark:ring-amber-900/40' },
  info: { icon: '🔵', bg: 'bg-sky-50 dark:bg-sky-950/30', ring: 'ring-sky-100 dark:ring-sky-900/40' },
} as const;

export function AlertsPage() {
  const { state, dispatch } = useStore();
  const alerts = computeAlerts(state);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg space-y-3 px-4 pb-32 pt-2">
        <h1 className="px-1 text-xl font-extrabold">التنبيهات</h1>
        {alerts.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="🔔"
              title="لا توجد تنبيهات حاليًا"
              subtitle="سنبلغك عند اقترابك من حد الميزانية أو ارتفاع صرفك"
            />
          </div>
        ) : (
          alerts.map((a) => {
            const s = LEVEL_STYLE[a.level];
            return (
              <div key={a.id} className={`card anim-pop flex items-start gap-3 ring-1 ${s.bg} ${s.ring}`}>
                <span className="mt-0.5 text-lg">{s.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{a.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">{a.body}</p>
                </div>
                <button
                  type="button"
                  aria-label="إخفاء التنبيه"
                  onClick={() => dispatch({ type: 'DISMISS_ALERT', id: a.id })}
                  className="press flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
        <p className="px-2 pt-2 text-center text-xs text-gray-400">
          التنبيهات تُحسب داخل التطبيق من ميزانيتك وعملياتك — بدون إشعارات خارجية في هذه النسخة.
        </p>
      </main>
    </>
  );
}
