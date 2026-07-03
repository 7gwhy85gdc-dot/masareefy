import React, { useEffect } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** Bottom Sheet بأسلوب iOS */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 anim-fade" onClick={onClose} />
      <div className="anim-sheet relative w-full max-w-lg rounded-t-[2rem] bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-zinc-700" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="press flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 pb-5 pb-safe">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

/** Confirm Sheet بأسلوب iOS Action Sheet */
export function ConfirmSheet({
  open, title, message, confirmLabel = 'تأكيد', onConfirm, onCancel, destructive = true,
}: ConfirmSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 anim-fade" onClick={onCancel} />
      <div className="anim-sheet relative w-full max-w-lg px-3 pb-3 pb-safe">
        <div className="overflow-hidden rounded-3xl bg-white/95 backdrop-blur dark:bg-zinc-900/95">
          <div className="px-4 py-4 text-center">
            <p className="font-semibold">{title}</p>
            {message && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{message}</p>}
          </div>
          <button
            type="button"
            onClick={onConfirm}
            className={`press block w-full border-t border-gray-100 dark:border-zinc-800 py-3.5 text-center text-base font-semibold ${
              destructive ? 'text-red-500' : 'text-brand-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="press mt-2 block w-full rounded-3xl bg-white py-3.5 text-center text-base font-semibold text-brand-600 dark:bg-zinc-900"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
