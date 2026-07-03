export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex
  custom?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  storeName?: string;
  note?: string;
  date: string; // ISO
  type: TransactionType;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  categoryId: string | null; // null = الميزانية الإجمالية
  month: string; // YYYY-MM (شهر الإنشاء — تعامل كميزانية متكررة)
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  expectedDate?: string; // ISO date
  icon: string;
}

export interface Settings {
  userName: string;
  monthStartDay: number; // بداية الشهر المالي (1-28)
  currency: string;
  theme: 'light' | 'dark';
  seeded: boolean;
}

export interface AppAlert {
  id: string;
  level: 'info' | 'warning' | 'danger';
  title: string;
  body: string;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: Settings;
  customCategories: Category[];
  dismissedAlerts: string[];
}
