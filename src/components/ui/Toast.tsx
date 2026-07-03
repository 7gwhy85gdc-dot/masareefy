import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ToastCtx {
  showToast: (msg: string, icon?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((msg: string, icon = '✅') => {
    setToast({ msg, icon });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[70] flex justify-center pb-safe">
          <div className="anim-toast flex items-center gap-2 rounded-full bg-gray-900/90 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur dark:bg-zinc-100/95 dark:text-zinc-900">
            <span>{toast.icon}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
