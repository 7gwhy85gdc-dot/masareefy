import type { AppAlert, AppState, Transaction } from '../types';
import { expensesIn, financialPeriod, sumAmounts } from '../lib/period';
import { fmtSAR } from '../lib/format';
import { backupOverdue } from '../lib/backup';

export function totalBudget(state: AppState): number {
  const b = state.budgets.find((x) => x.categoryId === null);
  return b?.amount ?? 0;
}

export function currentPeriodExpenses(state: AppState, offset = 0): Transaction[] {
  const r = financialPeriod(state.settings.monthStartDay, offset, new Date(), state.settings.calendar);
  return expensesIn(state.transactions, r);
}

export function spentByCategory(txs: Transaction[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of txs) m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + t.amount);
  return m;
}

export function spentByStore(txs: Transaction[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of txs) {
    const key = t.storeName?.trim() || 'غير محدد';
    m.set(key, (m.get(key) ?? 0) + t.amount);
  }
  return m;
}

export function topEntry(m: Map<string, number>): [string, number] | null {
  let best: [string, number] | null = null;
  for (const e of m.entries()) if (!best || e[1] > best[1]) best = e;
  return best;
}

/** التنبيهات المحسوبة من الميزانية والاستهلاك */
export function computeAlerts(state: AppState): AppAlert[] {
  const alerts: AppAlert[] = [];
  const cur = currentPeriodExpenses(state);
  const prev = currentPeriodExpenses(state, -1);
  const spent = sumAmounts(cur);
  const budget = totalBudget(state);
  const monthTag = new Date().toISOString().slice(0, 7);

  if (budget > 0) {
    const pct = (spent / budget) * 100;
    if (pct > 100) {
      alerts.push({
        id: `total-over-${monthTag}`,
        level: 'danger',
        title: 'تجاوزت الميزانية',
        body: `صرفت ${fmtSAR(spent)} وهو أعلى من ميزانيتك ${fmtSAR(budget)}.`,
      });
    } else if (pct >= 80) {
      alerts.push({
        id: `total-80-${monthTag}`,
        level: 'warning',
        title: 'اقتربت من حد الميزانية',
        body: `استهلكت ${Math.round(pct)}% من ميزانيتك الشهرية. المتبقي ${fmtSAR(budget - spent)}.`,
      });
    }
  }

  // ميزانيات التصنيفات
  const byCat = spentByCategory(cur);
  for (const b of state.budgets) {
    if (!b.categoryId || b.amount <= 0) continue;
    const catSpent = byCat.get(b.categoryId) ?? 0;
    if (catSpent > b.amount) {
      alerts.push({
        id: `cat-over-${b.categoryId}-${monthTag}`,
        level: 'danger',
        title: `تجاوزت ميزانية «${b.name}»`,
        body: `صرفت ${fmtSAR(catSpent)} من أصل ${fmtSAR(b.amount)}.`,
      });
    } else if (catSpent >= b.amount * 0.8) {
      alerts.push({
        id: `cat-80-${b.categoryId}-${monthTag}`,
        level: 'warning',
        title: `اقتربت من حد «${b.name}»`,
        body: `صرفت ${fmtSAR(catSpent)} من أصل ${fmtSAR(b.amount)}.`,
      });
    }
  }

  // ارتفاع الصرف في تصنيف مقارنة بالشهر السابق
  const prevByCat = spentByCategory(prev);
  for (const [catId, amount] of byCat.entries()) {
    const before = prevByCat.get(catId) ?? 0;
    if (before >= 50 && amount > before * 1.5) {
      const name = cur.find((t) => t.categoryId === catId)?.categoryName ?? catId;
      alerts.push({
        id: `cat-spike-${catId}-${monthTag}`,
        level: 'info',
        title: `ارتفاع الصرف على «${name}»`,
        body: `صرفك هذا الشهر ${fmtSAR(amount)} مقابل ${fmtSAR(before)} الشهر الماضي.`,
      });
    }
  }

  // تذكير بالنسخة الاحتياطية
  if (state.transactions.length > 10 && backupOverdue(state.settings.lastBackup)) {
    alerts.push({
      id: `backup-${monthTag}`,
      level: 'info',
      title: 'خذ نسخة احتياطية من بياناتك',
      body: 'مضى أكثر من شهر على آخر نسخة. من «حسابي» صدّر بياناتك أو شاركها لجهاز آخر.',
    });
  }

  return alerts.filter((a) => !state.dismissedAlerts.includes(a.id));
}
