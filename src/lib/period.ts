import type { CalendarType, Transaction } from '../types';

export interface Range { start: Date; end: Date; }

const hijriDayFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric' });
const hijriDay = (d: Date): number => Number(hijriDayFmt.format(d));

/** بداية الشهر الهجري الذي يقع فيه التاريخ */
function hijriMonthStart(from: Date): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  let guard = 0;
  while (hijriDay(d) !== 1 && guard++ < 35) d.setDate(d.getDate() - 1);
  return d;
}

function hijriPeriod(offset: number, now: Date): Range {
  let start = hijriMonthStart(now);
  for (let n = offset; n < 0; n++) {
    const prev = new Date(start);
    prev.setDate(prev.getDate() - 1);
    start = hijriMonthStart(prev);
  }
  for (let n = 0; n < offset; n++) {
    // +32 يوم يقع دائمًا داخل الشهر الهجري التالي (الأشهر 29-30 يومًا)
    const next = new Date(start);
    next.setDate(next.getDate() + 32);
    start = hijriMonthStart(next);
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  let guard = 0;
  while (hijriDay(end) !== 1 && guard++ < 35) end.setDate(end.getDate() + 1);
  return { start, end };
}

/** الفترة المالية الحالية حسب يوم بداية الشهر المالي. offset=0 الحالية، -1 السابقة */
export function financialPeriod(
  startDay: number,
  offset = 0,
  now = new Date(),
  calendar: CalendarType = 'gregorian'
): Range {
  if (calendar === 'hijri') return hijriPeriod(offset, now);
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
