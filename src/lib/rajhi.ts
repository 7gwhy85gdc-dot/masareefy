/**
 * محلل كشف حساب مصرف الراجحي (PDF)
 * يعتمد على إحداثيات النص في الصفحة (x/y) لتحديد الأعمدة:
 * التاريخ (يمين) | تفاصيل العملية | مدين | دائن | الرصيد (يسار)
 */

export interface RawItem { str: string; x: number; y: number; }
export interface PageData { width: number; items: RawItem[]; }

export interface StatementRow {
  date: string;   // YYYY/MM/DD
  title: string;  // نوع العملية (سطر العنوان)
  note: string;   // بقية التفاصيل
  debit: number;  // مدين
  credit: number; // دائن
  balance: number;
}

export interface ParsedTx {
  date: string; // ISO
  title: string;
  storeName?: string;
  amount: number;
  direction: 'debit' | 'credit';
  categoryId: string;
  categoryName: string;
  duplicate?: boolean;
}

const AMOUNT_RE = /^\d{1,3}(?:,\d{3})*\.\d{2}(?:\s*SAR)?$/;
const DATE_RE = /^\d{4}\/\d{2}\/\d{2}$/;
const parseAmount = (s: string): number => parseFloat(s.replace(/\s*SAR$/, '').replace(/,/g, ''));

/** نصوص PDF العربية قد تصل معكوسة الاتجاه — نفحص الكلمة بالاتجاهين */
const rev = (s: string): string => [...s].reverse().join('');
const hasKw = (s: string, kw: string): boolean => s.includes(kw) || s.includes(rev(kw));

/** استخراج صفوف الجدول من عناصر النص بإحداثياتها */
export function extractStatementRows(pages: PageData[]): StatementRow[] {
  const rows: StatementRow[] = [];
  for (const rawPage of pages) {
    const w = rawPage.width;
    // تطبيع NFKC: يحول أشكال العرض العربية (Presentation Forms) إلى حروف قياسية
    const page: PageData = {
      width: w,
      items: rawPage.items.map((i) => ({ ...i, str: i.str.normalize('NFKC') })),
    };
    const anchors = page.items
      .filter((i) => DATE_RE.test(i.str) && i.x > w * 0.72)
      .sort((a, b) => b.y - a.y);
    if (anchors.length === 0) continue;

    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const top = i === 0 ? a.y + 50 : (anchors[i - 1].y + a.y) / 2;
      const bottom = i === anchors.length - 1 ? a.y - 50 : (a.y + anchors[i + 1].y) / 2;
      const band = page.items.filter((it) => it !== a && it.y <= top && it.y > bottom);

      // الأعمدة الرقمية: الرصيد ثم دائن ثم مدين (من اليسار لليمين)
      const nums = band.filter((it) => AMOUNT_RE.test(it.str) && it.x < w * 0.5);
      if (nums.length < 3) continue;
      let balance = 0, credit = 0, debit = 0;
      for (const n of nums) {
        const v = parseAmount(n.str);
        if (n.x < w * 0.2) balance = v;
        else if (n.x < w * 0.36) credit = v;
        else debit = v;
      }

      // عمود التفاصيل
      const desc = band
        .filter((it) => it.x >= w * 0.46 && it.x < w * 0.85 && !AMOUNT_RE.test(it.str) && it.str !== 'SAR')
        .sort((p, q) => q.y - p.y || p.x - q.x);
      const lines: RawItem[][] = [];
      for (const it of desc) {
        const line = lines.find((l) => Math.abs(l[0].y - it.y) < 3.5);
        if (line) line.push(it);
        else lines.push([it]);
      }
      const title = (lines[0] ?? []).map((t) => t.str).join(' ').trim();
      const note = lines.slice(1).flat().map((t) => t.str).join(' ').trim();
      rows.push({ date: a.str, title, note, debit, credit, balance });
    }
  }
  return rows;
}

/** عنوان موحّد وواضح بدل نص الـ PDF (الذي قد يكون معكوس الاتجاه) */
function canonicalTitle(title: string, direction: 'debit' | 'credit'): string {
  if (hasKw(title, 'بين حسابات') || hasKw(title, 'حسابات العميل')) return 'تحويل بين حساباتك';
  if (hasKw(title, 'تحويل')) return direction === 'credit' ? 'تحويل داخلي وارد' : 'تحويل داخلي صادر';
  if (hasKw(title, 'رسوم')) return 'رسوم بنكية';
  if (hasKw(title, 'حوالات') || hasKw(title, 'حوالة')) return direction === 'credit' ? 'حوالة واردة' : 'حوالة صادرة';
  if (hasKw(title, 'إيداع') || hasKw(title, 'ايداع')) return 'إيداع - صراف آلي';
  if (hasKw(title, 'أقساط') || hasKw(title, 'اقساط') || hasKw(title, 'تمويل')) return 'قسط تمويل';
  if (hasKw(title, 'البطاقات') || hasKw(title, 'الائتمانية') || hasKw(title, 'الایتمانیة')) return 'سداد بطاقة ائتمانية';
  if (hasKw(title, 'سداد') || hasKw(title, 'المخالفات')) return 'مدفوعات سداد';
  if (hasKw(title, 'انترنت')) return 'شراء عبر الإنترنت';
  if (hasKw(title, 'نقاط البيع') || hasKw(title, 'شراء')) return 'شراء - نقاط البيع';
  if (hasKw(title, 'PAYROLL') || hasKw(title, 'سريع')) return 'حوالة واردة';
  return title || 'عملية بنكية';
}

const CITY_WORDS = new Set([
  'SA', 'SAR', 'RIYADH', 'Riyadh', 'riyadh', 'BURAIDAH', 'BURIDAH', 'BURAYDAH', 'HAFR', 'ALBATIN',
  'HAIL', 'ZULFY', 'JEDDAH', 'DAMMAM', 'MAKKAH', 'MADINAH',
]);
const STOP_WORDS = new Set([
  'Online', 'Purchase', 'from', 'W', 'TO', 'FR', 'ACCT', 'TOACCT', 'FRACCT', 'Agmt', 'Cash',
  'Deposit', 'CA', 'AL', 'BR', 'ATM', 'RAJHI', 'T24Batch', 'T24', 'INST', 'LOAN', 'Advance',
  'payment', 'for', 'Card', 'ending', 'NCBK', 'CT', 'PAYROLL',
]);

/** استخراج اسم المتجر من التفاصيل */
function extractStore(title: string, note: string): string | undefined {
  const all = `${title} ${note}`;
  // "Online Purchase from X, City"
  const m = all.match(/Online Purchase from\s+([A-Za-z][A-Za-z0-9 .&'\-]*?)(?:\s*[,،]|$)/i);
  if (m) return m[1].trim();
  // أطول سلسلة كلمات لاتينية ليست مدينة/كلمة نظام
  const runs = note.match(/[A-Za-z][A-Za-z0-9 .&'\-]{2,}/g) ?? [];
  let best = '';
  for (const run of runs) {
    const words = run.trim().split(/\s+/).filter((x) => !STOP_WORDS.has(x) && !CITY_WORDS.has(x) && !/^\d+$/.test(x));
    const cleaned = words.join(' ').trim();
    if (cleaned.length > best.length) best = cleaned;
  }
  return best.length >= 3 ? best : undefined;
}

/** التصنيف الذكي */
function categorize(title: string, note: string, store: string | undefined, direction: 'debit' | 'credit'): string {
  // من نوع العملية أولًا
  if (
    hasKw(title, 'تحويل') || hasKw(title, 'حوالة') || hasKw(title, 'حوالات') ||
    hasKw(title, 'إيداع') || hasKw(title, 'ايداع') || hasKw(title, 'أقساط') ||
    hasKw(title, 'اقساط') || hasKw(title, 'رسوم') || hasKw(title, 'البطاقات') ||
    hasKw(title, 'سريع')
  ) return 'finance';
  if (hasKw(title, 'سداد') || hasKw(title, 'المخالفات')) return 'bills';
  if (direction === 'credit') return 'finance';

  const s = `${store ?? ''} ${note} ${title}`.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ['fuel', /aldrees|sasco|petromin|petrol|fuel|naft|gas station|محطة/],
    ['cafes', /\bcafe\b|caffe|coffee|barn|starbucks|dunkin|half million|kozet|روستر/],
    ['grocery', /panda|tamimi|carrefour|danube|othaim|ramez|market|supermarket|ninja|nana|baqala|بقال/],
    ['restaurants', /hungerstation|keeta|jahez|mrsool|restaura|\bfood\b|matam|shawarma|herfy|kudu|albaik|burger|pizza|مطعم/],
    ['bills', /\bstc\b|my stc|mobily|zain|electricity|kahraba|water bill|فاتورة/],
    ['online', /tabby|tamara|amazon|noon\b|shein|aliexpress|apple\.com|itunes|playstation|steam/],
    ['shopping', /saco|jarir|zara|\bmax\b|mall|centrepoint|extra|ikea|bookstore|trading/],
  ];
  for (const [cat, re] of rules) if (re.test(s)) return cat;
  if (hasKw(title, 'انترنت')) return 'online';
  return 'other';
}

const CATEGORY_NAMES: Record<string, string> = {
  fuel: 'وقود', restaurants: 'مطاعم', cafes: 'مقاهي', shopping: 'تسوق',
  online: 'تسوق أونلاين', grocery: 'بقالة', bills: 'فواتير وخدمات',
  finance: 'المالية', other: 'أخرى',
};

/** تحويل صفوف الكشف إلى عمليات جاهزة للاستيراد */
export function rowsToTransactions(rows: StatementRow[]): ParsedTx[] {
  const out: ParsedTx[] = [];
  for (const r of rows) {
    const amount = r.debit > 0 ? r.debit : r.credit;
    if (amount <= 0) continue;
    const direction: 'debit' | 'credit' = r.debit > 0 ? 'debit' : 'credit';

    const [y, m, d] = r.date.split('/').map(Number);
    const tm = r.note.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    const dt = new Date(y, m - 1, d, tm ? +tm[1] : 12, tm ? +tm[2] : 0, tm ? +tm[3] : 0);

    const title = canonicalTitle(r.title, direction);
    let store: string | undefined;
    if (/تحويل|حوالة|إيداع|قسط|رسوم|سداد|مدفوعات/.test(title)) {
      // للعمليات المالية: اسم الطرف الآخر بالعربي إن وُجد
      const arRuns = (r.note.match(/[ء-ي][ء-ي\s]{1,40}/g) ?? [])
        .map((x) => x.trim())
        .filter((x) => x.length >= 2 && !/^(ملاحظة|الوقت|ملاحظه)$/.test(x));
      store = arRuns.sort((a, b) => b.length - a.length)[0];
    } else {
      store = extractStore(r.title, r.note);
    }
    const categoryId = categorize(r.title, r.note, store, direction);

    out.push({
      date: dt.toISOString(),
      title,
      storeName: store,
      amount,
      direction,
      categoryId,
      categoryName: CATEGORY_NAMES[categoryId] ?? 'أخرى',
    });
  }
  // الأقدم أولًا حسب الكشف — نعيدها من الأحدث للأقدم
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** قراءة PDF في المتصفح وتحويله لعمليات (يُحمَّل pdfjs عند الحاجة فقط) */
export async function parseRajhiPdf(file: File): Promise<ParsedTx[]> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: PageData[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const { width } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items: RawItem[] = [];
    for (const it of content.items) {
      if ('str' in it && it.str.trim()) {
        items.push({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] });
      }
    }
    pages.push({ width, items });
  }
  await doc.destroy();

  const rows = extractStatementRows(pages);
  if (rows.length === 0) {
    throw new Error('لم يتم العثور على عمليات في الملف — تأكد أنه كشف حساب من مصرف الراجحي بصيغة PDF الأصلية');
  }
  return rowsToTransactions(rows);
}
