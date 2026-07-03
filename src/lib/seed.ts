import type { Budget, Goal, Transaction } from '../types';
import { uid } from './format';

function daysAgo(n: number, hour = 14, min = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

export function seedTransactions(): Transaction[] {
  const rows: Array<[number, string, string, string | undefined, number, number]> = [
    // [amount, categoryId, categoryName, storeName, daysAgo, hour]
    [100, 'fuel', 'وقود', 'محطة الدريس', 0, 8],
    [42.5, 'cafes', 'مقاهي', 'هاف مليون', 1, 17],
    [186, 'grocery', 'بقالة', 'بنده', 2, 20],
    [95, 'restaurants', 'مطاعم', 'البيك', 3, 21],
    [230, 'online', 'تسوق أونلاين', 'أمازون', 5, 13],
    [350, 'bills', 'فواتير وخدمات', 'فاتورة الكهرباء', 7, 10],
    [120, 'fuel', 'وقود', 'محطة ساسكو', 9, 7],
    [64, 'restaurants', 'مطاعم', 'شاورمر', 11, 22],
    [275, 'shopping', 'تسوق', 'العثيم مول', 14, 19],
    [38, 'cafes', 'مقاهي', 'دانكن', 16, 9],
    [510, 'grocery', 'بقالة', 'التميمي', 20, 18],
    [149, 'online', 'تسوق أونلاين', 'نون', 24, 15],
    [90, 'fuel', 'وقود', 'محطة الدريس', 28, 8],
    [430, 'shopping', 'تسوق', 'زارا', 35, 20],
    [55, 'restaurants', 'مطاعم', 'ماما نورة', 40, 21],
    [320, 'bills', 'فواتير وخدمات', 'فاتورة الجوال', 45, 11],
    [200, 'finance', 'المالية', 'تحويل ادخار', 50, 12],
    [75, 'cafes', 'مقاهي', 'ستار باکس', 55, 16],
    [610, 'grocery', 'بقالة', 'كارفور', 60, 19],
    [130, 'fuel', 'وقود', 'محطة نفط', 70, 8],
  ];
  return rows.map(([amount, categoryId, categoryName, storeName, days, hour]) => ({
    id: uid(),
    amount,
    categoryId,
    categoryName,
    storeName,
    note: undefined,
    date: daysAgo(days, hour),
    type: 'expense' as const,
  }));
}

export function seedBudgets(month: string): Budget[] {
  return [
    { id: uid(), name: 'الميزانية الشهرية', amount: 3500, categoryId: null, month },
    { id: uid(), name: 'وقود', amount: 400, categoryId: 'fuel', month },
    { id: uid(), name: 'مطاعم', amount: 500, categoryId: 'restaurants', month },
    { id: uid(), name: 'بقالة', amount: 900, categoryId: 'grocery', month },
    { id: uid(), name: 'مقاهي', amount: 200, categoryId: 'cafes', month },
  ];
}

export function seedGoals(): Goal[] {
  const inMonths = (n: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + n);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: uid(), title: 'سيارة', targetAmount: 50000, currentAmount: 12500, expectedDate: inMonths(18), icon: '🚗' },
    { id: uid(), title: 'سفر الصيف', targetAmount: 8000, currentAmount: 5200, expectedDate: inMonths(3), icon: '✈️' },
  ];
}
