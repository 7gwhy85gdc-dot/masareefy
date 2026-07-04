import React from 'react';

/**
 * نظام أيقونات مصاريفي — مستخرج من ملف التصميم (خط 1.8، viewBox 24)
 * النقاط الخضراء بلون الهوية #16A34A، والخطوط بـ currentColor لتتبع الثيم.
 */

export type IconName =
  | 'home' | 'bell' | 'tag' | 'user' | 'wallet' | 'filePlus' | 'trending'
  | 'target' | 'plus' | 'search' | 'help' | 'exchange'
  | 'trash' | 'export' | 'import' | 'bank' | 'calendar' | 'repeat';

interface Shape {
  paths?: string[];
  lines?: Array<[number, number, number, number]>;
  circles?: Array<{ cx: number; cy: number; r: number; fill?: boolean }>;
  dots?: Array<{ cx: number; cy: number; r?: number }>;
  text?: { x: number; y: number; s: string };
}

const ICONS: Record<IconName, Shape> = {
  home: { paths: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'] },
  bell: { paths: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'] },
  tag: { paths: ['M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z'], dots: [{ cx: 7, cy: 7, r: 1 }] },
  user: { circles: [{ cx: 12, cy: 8, r: 4 }], paths: ['M6 21v-2a6 6 0 0 1 12 0v2'] },
  wallet: { paths: ['M4 8a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z', 'M17 12h3'], text: { x: 9.2, y: 14.2, s: '$' } },
  filePlus: { paths: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M9 15h6', 'M12 12v6'] },
  trending: { lines: [[6, 20, 6, 14], [12, 20, 12, 4], [18, 20, 18, 10]] },
  target: { circles: [{ cx: 12, cy: 12, r: 9 }, { cx: 12, cy: 12, r: 5 }, { cx: 12, cy: 12, r: 1.3, fill: true }] },
  plus: { lines: [[12, 7, 12, 17], [7, 12, 17, 12]] },
  search: { circles: [{ cx: 10.5, cy: 10.5, r: 6.5 }], lines: [[20, 20, 15.3, 15.3]] },
  help: { circles: [{ cx: 12, cy: 12, r: 9 }], paths: ['M9.1 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4'], dots: [{ cx: 12, cy: 17, r: 0.8 }] },
  exchange: { paths: ['M21 16.2 17 20.4 13 16.2', 'M17 20.4V4', 'M3 7.8 7 3.6l4 4.2', 'M7 3.6v16.8'] },
  // أيقونات مكملة بنفس أسلوب المجموعة
  trash: { paths: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'], lines: [[10, 11, 10, 17], [14, 11, 14, 17]] },
  export: { paths: ['M12 15V3', 'M8 7l4-4 4 4', 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'] },
  import: { paths: ['M12 3v12', 'M8 11l4 4 4-4', 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'] },
  bank: { paths: ['M2 10l10-7 10 7', 'M4 10v9', 'M20 10v9', 'M9 10v9', 'M15 10v9', 'M2 21h20'] },
  calendar: { paths: ['M5 5h14a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2Z', 'M16 3v4', 'M8 3v4', 'M3 10h18'] },
  repeat: { paths: ['M17 1l4 4-4 4', 'M3 11V9a4 4 0 0 1 4-4h14', 'M7 23l-4-4 4-4', 'M21 13v2a4 4 0 0 1-4 4H3'] },
};

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** لون النقاط الزخرفية (الافتراضي أخضر الهوية) */
  accent?: string;
}

export function Icon({ name, size = 22, strokeWidth = 1.8, className, accent = '#16A34A' }: IconProps) {
  const s = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {s.paths?.map((d, i) => <path key={`p${i}`} d={d} />)}
      {s.lines?.map((l, i) => <line key={`l${i}`} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />)}
      {s.circles?.map((c, i) => (
        <circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke={c.fill ? 'none' : undefined} fill={c.fill ? 'currentColor' : 'none'} />
      ))}
      {s.dots?.map((d, i) => <circle key={`d${i}`} cx={d.cx} cy={d.cy} r={d.r ?? 1} fill={accent} stroke="none" />)}
      {s.text && (
        <text x={s.text.x} y={s.text.y} fontSize="7" fontWeight="700" fill="currentColor" stroke="none" fontFamily="Arial">
          {s.text.s}
        </text>
      )}
    </svg>
  );
}

/** دائرة خلفية بأسلوب ملف التصميم */
export function IconCircle({ name, size = 44, iconSize = 22, className = '' }: { name: IconName; size?: number; iconSize?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-50 text-gray-800 dark:bg-zinc-800 dark:text-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon name={name} size={iconSize} />
    </div>
  );
}
