import { useNav, type View } from './Nav';
import { Icon, type IconName } from '../ui/Icons';

interface Item {
  view: View;
  label: string;
  icon: IconName;
}

const items: Item[] = [
  { view: 'home', label: 'الرئيسية', icon: 'home' },
  { view: 'alerts', label: 'التنبيهات', icon: 'bell' },
  { view: 'offers', label: 'العروض', icon: 'tag' },
  { view: 'settings', label: 'حسابي', icon: 'user' },
];

export function BottomNav() {
  const { view, go, openAdd } = useNav();
  const right = items.slice(0, 2);
  const left = items.slice(2);

  const Tab = ({ item }: { item: Item }) => {
    const active =
      view === item.view ||
      (item.view === 'home' && ['transactions', 'budgets', 'analytics', 'goals'].includes(view));
    return (
      <button
        type="button"
        onClick={() => go(item.view)}
        className={`press flex flex-1 flex-col items-center gap-0.5 py-1.5 ${
          active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-zinc-500'
        }`}
      >
        <Icon name={item.icon} size={23} strokeWidth={active ? 2.3 : 1.8} />
        <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-lg px-3 pb-2 pb-safe">
        <div className="relative flex items-center rounded-[1.75rem] bg-white/95 shadow-[0_-2px_20px_rgba(0,0,0,0.08)] backdrop-blur dark:bg-zinc-900/95">
          {right.map((i) => <Tab key={i.view} item={i} />)}
          {/* زر الإضافة العائم */}
          <div className="relative -top-5 flex w-16 shrink-0 justify-center">
            <button
              type="button"
              aria-label="إضافة عملية"
              onClick={openAdd}
              className="press flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/40"
            >
              <Icon name="plus" size={26} strokeWidth={2.4} />
            </button>
          </div>
          {left.map((i) => <Tab key={i.view} item={i} />)}
        </div>
      </div>
    </nav>
  );
}
