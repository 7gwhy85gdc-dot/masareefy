import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AppState, Budget, Category, Goal, Recurring, Settings, Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { seedBudgets, seedGoals, seedTransactions } from '../lib/seed';
import { periodKey } from '../lib/period';
import { idbLoadState, idbSaveState } from '../lib/backup';
import { uid } from '../lib/format';

const STORAGE_KEY = 'masareefy-state-v1';

const defaultSettings: Settings = {
  userName: 'مستخدم مصاريفي',
  monthStartDay: 1,
  currency: 'ريال سعودي',
  theme: 'light',
  calendar: 'gregorian',
  seeded: false,
};

const emptyState: AppState = {
  transactions: [],
  budgets: [],
  goals: [],
  recurrings: [],
  settings: defaultSettings,
  customCategories: [],
  dismissedAlerts: [],
};

/** هل بدأنا بدون بيانات محفوظة؟ (لمحاولة الاسترجاع من IndexedDB) */
let startedFresh = false;

export type Action =
  | { type: 'ADD_TX'; tx: Transaction }
  | { type: 'ADD_TXS'; txs: Transaction[] }
  | { type: 'UPDATE_TX'; tx: Transaction }
  | { type: 'DELETE_TX'; id: string }
  | { type: 'UPSERT_BUDGET'; budget: Budget }
  | { type: 'DELETE_BUDGET'; id: string }
  | { type: 'ADD_RECURRING'; recurring: Recurring }
  | { type: 'UPDATE_RECURRING'; recurring: Recurring }
  | { type: 'DELETE_RECURRING'; id: string }
  | { type: 'POST_RECURRINGS'; txs: Transaction[]; ids: string[]; month: string }
  | { type: 'ADD_GOAL'; goal: Goal }
  | { type: 'UPDATE_GOAL'; goal: Goal }
  | { type: 'DELETE_GOAL'; id: string }
  | { type: 'ADD_CATEGORY'; category: Category }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'DISMISS_ALERT'; id: string }
  | { type: 'IMPORT'; state: AppState }
  | { type: 'CLEAR_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TX':
      return { ...state, transactions: [action.tx, ...state.transactions] };
    case 'ADD_TXS':
      return {
        ...state,
        transactions: [...action.txs, ...state.transactions].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      };
    case 'UPDATE_TX':
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t)),
      };
    case 'DELETE_TX':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'UPSERT_BUDGET': {
      const exists = state.budgets.some((b) => b.id === action.budget.id);
      return {
        ...state,
        budgets: exists
          ? state.budgets.map((b) => (b.id === action.budget.id ? action.budget : b))
          : [...state.budgets, action.budget],
      };
    }
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter((b) => b.id !== action.id) };
    case 'ADD_RECURRING':
      return { ...state, recurrings: [...state.recurrings, action.recurring] };
    case 'UPDATE_RECURRING':
      return {
        ...state,
        recurrings: state.recurrings.map((r) => (r.id === action.recurring.id ? action.recurring : r)),
      };
    case 'DELETE_RECURRING':
      return { ...state, recurrings: state.recurrings.filter((r) => r.id !== action.id) };
    case 'POST_RECURRINGS':
      return {
        ...state,
        transactions: [...action.txs, ...state.transactions].sort((a, b) => b.date.localeCompare(a.date)),
        recurrings: state.recurrings.map((r) =>
          action.ids.includes(r.id) ? { ...r, lastPosted: action.month } : r
        ),
      };
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.goal] };
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map((g) => (g.id === action.goal.id ? action.goal : g)) };
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.id) };
    case 'ADD_CATEGORY':
      return { ...state, customCategories: [...state.customCategories, action.category] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'DISMISS_ALERT':
      return state.dismissedAlerts.includes(action.id)
        ? state
        : { ...state, dismissedAlerts: [...state.dismissedAlerts, action.id] };
    case 'IMPORT':
      return {
        ...emptyState,
        ...action.state,
        settings: { ...defaultSettings, ...action.state.settings, seeded: true },
      };
    case 'CLEAR_ALL':
      return { ...emptyState, settings: { ...defaultSettings, seeded: true, theme: state.settings.theme } };
    default:
      return state;
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      return { ...emptyState, ...parsed, settings: { ...defaultSettings, ...parsed.settings } };
    }
  } catch (err) {
    console.error('فشل تحميل البيانات المحفوظة', err);
  }
  // أول تشغيل: بيانات تجريبية (وقد نسترجع من IndexedDB لاحقًا)
  startedFresh = true;
  return {
    ...emptyState,
    transactions: seedTransactions(),
    budgets: seedBudgets(periodKey(1)),
    goals: seedGoals(),
    settings: { ...defaultSettings, seeded: true },
  };
}

interface StoreCtx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  categories: Category[];
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // حفظ مؤجل (Debounce) حتى لا تُسلسل آلاف العمليات مع كل تغيير
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.error('فشل حفظ البيانات', err);
      }
      idbSaveState(state); // مرآة في IndexedDB (حماية إضافية)
    }, 400);
    return () => clearTimeout(t);
  }, [state]);

  // حفظ فوري عند إغلاق/إخفاء التطبيق حتى لا يضيع آخر تغيير
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      } catch { /* تجاهل */ }
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  // استرجاع من IndexedDB إذا كان localStorage قد مُسح
  const restoredRef = useRef(false);
  useEffect(() => {
    if (!startedFresh || restoredRef.current) return;
    restoredRef.current = true;
    idbLoadState().then((saved) => {
      if (saved && Array.isArray(saved.transactions) && saved.transactions.length > 0) {
        dispatch({ type: 'IMPORT', state: saved });
      }
    });
  }, []);

  // تسجيل الالتزامات الشهرية المستحقة تلقائيًا
  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const due = state.recurrings.filter(
      (r) => r.active && r.lastPosted !== month && now.getDate() >= r.dayOfMonth
    );
    if (due.length === 0) return;
    const txs: Transaction[] = due.map((r) => ({
      id: uid(),
      amount: r.amount,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      storeName: r.name,
      note: 'التزام شهري متكرر',
      date: new Date(now.getFullYear(), now.getMonth(), Math.min(r.dayOfMonth, 28), 9, 0, 0).toISOString(),
      type: 'expense',
    }));
    dispatch({ type: 'POST_RECURRINGS', txs, ids: due.map((r) => r.id), month });
  }, [state.recurrings]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
  }, [state.settings.theme]);

  const categories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...state.customCategories],
    [state.customCategories]
  );

  const value = useMemo(() => ({ state, dispatch, categories }), [state, categories]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
