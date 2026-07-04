/** «اسأل مصاريفك» — إجابة محلية على أسئلة عربية بسيطة عن المصروفات */
import type { AppState, Category } from '../types';
import { expensesIn, financialPeriod, lastDays, sumAmounts, type Range } from './period';
import { fmtSAR } from './format';
import { spentByStore, topEntry, totalBudget, spentByCategory } from '../store/selectors';

const CAT_SYNONYMS: Record<string, string[]> = {
  fuel: ['وقود', 'بنزين', 'محطة'],
  restaurants: ['مطاعم', 'مطعم', 'أكل', 'اكل', 'وجبات'],
  cafes: ['مقاهي', 'مقهى', 'قهوة', 'قهوه', 'كافيه', 'كوفي'],
  shopping: ['تسوق', 'ملابس'],
  online: ['أونلاين', 'اونلاين', 'الانترنت', 'الإنترنت'],
  grocery: ['بقالة', 'بقاله', 'تموينات', 'سوبرماركت'],
  bills: ['فواتير', 'فاتورة', 'فاتوره', 'خدمات'],
  finance: ['تحويلات', 'المالية', 'الماليه', 'تحويل'],
  other: ['أخرى', 'اخرى'],
};

const MONTHS: Record<string, number> = {
  يناير: 0, فبراير: 1, مارس: 2, أبريل: 3, ابريل: 3, مايو: 4, يونيو: 5,
  يوليو: 6, اغسطس: 7, أغسطس: 7, سبتمبر: 8, أكتوبر: 9, اكتوبر: 9, نوفمبر: 10, ديسمبر: 11,
};

function detectRange(q: string, state: AppState): { range: Range; label: string } {
  const { monthStartDay, calendar } = state.settings;
  if (q.includes('اليوم')) return { range: lastDays(0), label: 'اليوم' };
  if (q.includes('أمس') || q.includes('امس')) {
    const y = new Date(); y.setDate(y.getDate() - 1); y.setHours(0, 0, 0, 0);
    const e = new Date(y); e.setDate(e.getDate() + 1);
    return { range: { start: y, end: e }, label: 'أمس' };
  }
  if (q.includes('أسبوع') || q.includes('اسبوع')) return { range: lastDays(7), label: 'هذا الأسبوع' };
  if (q.includes('الشهر الماضي') || q.includes('الشهر السابق'))
    return { range: financialPeriod(monthStartDay, -1, new Date(), calendar), label: 'الشهر الماضي' };
  if (q.includes('3 أشهر') || q.includes('٣ أشهر') || q.includes('ثلاثة أشهر'))
    return { range: lastDays(90), label: 'آخر 3 أشهر' };
  for (const [name, m] of Object.entries(MONTHS)) {
    if (q.includes(name)) {
      const now = new Date();
      const year = m > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
      return { range: { start: new Date(year, m, 1), end: new Date(year, m + 1, 1) }, label: name };
    }
  }
  return { range: financialPeriod(monthStartDay, 0, new Date(), calendar), label: 'هذا الشهر' };
}

export function askExpenses(question: string, state: AppState, categories: Category[]): string {
  const q = question.trim();
  if (!q) return '';
  const { range, label } = detectRange(q, state);
  const txs = expensesIn(state.transactions, range);

  // «كم باقي من الميزانية؟»
  if (q.includes('باقي') || q.includes('متبقي') || q.includes('المتبقي')) {
    const budget = totalBudget(state);
    if (budget <= 0) return 'لم تحدد ميزانية شهرية بعد — حددها من صفحة الميزانية.';
    const spent = sumAmounts(expensesIn(state.transactions, financialPeriod(state.settings.monthStartDay, 0, new Date(), state.settings.calendar)));
    return spent <= budget
      ? `باقي لك ${fmtSAR(budget - spent)} من ميزانية ${fmtSAR(budget)} هذا الشهر.`
      : `تجاوزت ميزانيتك (${fmtSAR(budget)}) بمقدار ${fmtSAR(spent - budget)} هذا الشهر.`;
  }

  // «أكثر متجر / أكثر تصنيف؟»
  if (q.includes('أكثر') || q.includes('اكثر')) {
    if (q.includes('متجر') || q.includes('محل')) {
      const top = topEntry(spentByStore(txs));
      return top
        ? `أكثر متجر صرفت فيه ${label}: ${top[0]} بمبلغ ${fmtSAR(top[1])}.`
        : `لا توجد عمليات ${label}.`;
    }
    const top = topEntry(spentByCategory(txs));
    if (top) {
      const cat = categories.find((c) => c.id === top[0]);
      return `أكثر تصنيف صرفت عليه ${label}: ${cat?.name ?? top[0]} بمبلغ ${fmtSAR(top[1])}.`;
    }
    return `لا توجد عمليات ${label}.`;
  }

  // تصنيف محدد؟
  let catId: string | null = null;
  for (const [id, words] of Object.entries(CAT_SYNONYMS)) {
    if (words.some((w) => q.includes(w))) { catId = id; break; }
  }
  for (const c of categories) if (q.includes(c.name)) catId = c.id;

  // متجر محدد؟
  const stores = new Set(state.transactions.map((t) => t.storeName?.trim()).filter(Boolean) as string[]);
  let storeMatch: string | null = null;
  for (const s of stores) if (s.length >= 3 && q.toLowerCase().includes(s.toLowerCase())) storeMatch = s;

  let filtered = txs;
  let subject = 'إجمالي مصروفاتك';
  if (storeMatch) {
    filtered = txs.filter((t) => t.storeName?.trim() === storeMatch);
    subject = `مصروفاتك في ${storeMatch}`;
  } else if (catId) {
    filtered = txs.filter((t) => t.categoryId === catId);
    const cat = categories.find((c) => c.id === catId);
    subject = `مصروفاتك على ${cat?.name ?? ''}`;
  }

  if (filtered.length === 0) return `لا توجد عمليات مطابقة ${label}.`;
  const total = sumAmounts(filtered);
  let answer = `${subject} ${label}: ${fmtSAR(total)} في ${filtered.length} عملية.`;
  if (!storeMatch) {
    const top = topEntry(spentByStore(filtered));
    if (top && top[0] !== 'غير محدد') answer += ` أكثرها في ${top[0]} (${fmtSAR(top[1])}).`;
  }
  return answer;
}
