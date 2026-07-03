import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { AppState, Budget, Category, Goal, Settings, Transaction } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { seedBudgets, seedGoals, seedTransactions } from '../lib/seed';
import { periodKey } from '../lib/period';

const STORAGE_KEY = 'masareefy-state-v1';

const defaultSettings: Settings = {
  userName: 'مستخدم مصاريفي',
  monthStartDay: 1,
  currency: 'ريال سعودي',
  theme: 'light',
  seeded: false,
};

const emptyState: AppState = {
  transactions: [],
  budgets: [],
  goals: [],
  settings: defaultSettings,
  customCategories: [],
  dismissedAlerts: [],
};

export type Action =
  | { type: 'ADD_TX'; tx: Transaction }
  | { type: 'ADD_TXS'; txs: Transaction[] }
  | { type: 'UPDATE_TX'; tx: Transaction }
  | { type: 'DELETE_TX'; id: string }
  | { type: 'UPSERT_BUDGET'; budget: Budget }
  | { type: 'DELETE_BUDGET'; id: string }
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
      return { ...action.state, settings: { ...defaultSettings, ...action.state.settings, seeded: true } };
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
  // أول تشغيل: بيانات تجريبية
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('فشل حفظ البيانات', err);
    }
  }, [state]);

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
