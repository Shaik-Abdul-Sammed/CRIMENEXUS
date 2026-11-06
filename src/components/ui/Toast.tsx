/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = 'toast-' + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast({ message, title, type: 'success' }), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast({ message, title, type: 'error' }), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast({ message, title, type: 'warning' }), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast({ message, title, type: 'info' }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md text-xs ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                  : 'bg-slate-900/90 border-blue-500/50 text-blue-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />}

              <div className="flex-1 min-w-0">
                {toast.title && <div className="font-bold text-foreground mb-0.5">{toast.title}</div>}
                <div className="leading-relaxed">{toast.message}</div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded shrink-0"
                aria-label="Close notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Resilient fallback when used outside provider
    return {
      showToast: () => {},
      success: (m: string) => console.log('Toast success:', m),
      error: (m: string) => console.error('Toast error:', m),
      warning: (m: string) => console.warn('Toast warning:', m),
      info: (m: string) => console.info('Toast info:', m),
    };
  }
  return context;
}
