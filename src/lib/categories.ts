import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'fuel', name: 'وقود', icon: '⛽', color: '#6366f1' },
  { id: 'restaurants', name: 'مطاعم', icon: '🍽️', color: '#f97316' },
  { id: 'cafes', name: 'مقاهي', icon: '☕', color: '#a16207' },
  { id: 'shopping', name: 'تسوق', icon: '🛍️', color: '#ec4899' },
  { id: 'online', name: 'تسوق أونلاين', icon: '🛒', color: '#0ea5e9' },
  { id: 'grocery', name: 'بقالة', icon: '🧺', color: '#22c55e' },
  { id: 'bills', name: 'فواتير وخدمات', icon: '🧾', color: '#8b5cf6' },
  { id: 'finance', name: 'المالية', icon: '💰', color: '#d97706' },
  { id: 'other', name: 'أخرى', icon: '📦', color: '#64748b' },
];

export const GOAL_ICONS = ['🚗', '✈️', '💻', '🏠', '📱', '🎓', '💍', '🕋', '🎯'];
