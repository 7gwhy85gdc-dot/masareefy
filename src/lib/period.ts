import type { Transaction } from '../types';

export interface Range { start: Date; end: Date; }

/** الفترة المالية الحالية حسب يوم بداية الشهر المالي. offset=0 الحالية، -1 السابقة */
export function financialPeriod(startDay: number, offset = 0, now = new Date()): Range {
  const d = new Date(now);
  let year = d.getFullYear();
  let month = d.getMonth();
  if (d.getDate() < startDay) month -= 1;
  month += offset;
  const start = new Date(year, month, startDay, 0, 0, 0, 0);
  const end = new Date(year, month + 1, startDay, 0, 0, 0, 0);
  return { start, end };
}

export function lastDays(days: number, now = new Date()): Range {
  const end = new Date(now.getTime() + 60_000);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function inRange(iso: string, r: Range): boolean {
  const t = new Date(iso).getTime();
  return t >= r.start.getTime() && t < r.end.getTime();
}

export function expensesIn(txs: Transaction[], r: Range): Transaction[] {
  return txs.filter((t) => t.type === 'expense' && inRange(t.date, r));
}

export function sumAmounts(txs: Transaction[]): number {
  return txs.reduce((s, t) => s + t.amount, 0);
}

export function periodKey(startDay: number, now = new Date()): string {
  const { start } = financialPeriod(startDay, 0, now);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
}
