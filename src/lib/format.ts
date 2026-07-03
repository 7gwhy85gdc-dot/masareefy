const nf = new Intl.NumberFormat('ar-SA-u-nu-latn', { maximumFractionDigits: 2 });

export const fmtNum = (n: number): string => nf.format(n);
export const fmtSAR = (n: number): string => `${nf.format(n)} ريال`;

const dateFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', {
  hour: 'numeric', minute: '2-digit', hour12: true,
});
const dayFmt = new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', {
  weekday: 'long', day: 'numeric', month: 'long',
});

export const fmtDate = (iso: string): string => dateFmt.format(new Date(iso));
export const fmtTime = (iso: string): string => timeFmt.format(new Date(iso));
export const fmtDateTime = (iso: string): string => `${dateFmt.format(new Date(iso))} ${timeFmt.format(new Date(iso))}`;

export const dayKey = (iso: string): string => iso.slice(0, 10);

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const k = dayKey(iso);
  if (k === today.toISOString().slice(0, 10) || k === localDayKey(today)) return 'اليوم';
  if (k === localDayKey(yest)) return 'أمس';
  return dayFmt.format(d);
}

export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
