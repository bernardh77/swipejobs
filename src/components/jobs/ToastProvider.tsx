"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Toast from "./Toast";
import styles from "./ToastProvider.module.css";

type ToastItem = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissAfterMs?: number;
};

type ToastInput = Omit<ToastItem, "id">;

type ToastContextValue = {
  showToast: (toast: ToastInput) => string;
  updateToast: (id: string, updates: Partial<ToastItem>) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const existing = timers.current.get(id);
    if (existing) {
      window.clearTimeout(existing);
      timers.current.delete(id);
    }
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, delay?: number) => {
      if (!delay) return;
      clearTimer(id);
      const timeoutId = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        timers.current.delete(id);
      }, delay);
      timers.current.set(id, timeoutId);
    },
    [clearTimer]
  );

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = createId();
      setToasts((current) => [{ id, ...toast }, ...current]);
      scheduleDismiss(id, toast.dismissAfterMs);
      return id;
    },
    [scheduleDismiss]
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<ToastItem>) => {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id ? { ...toast, ...updates } : toast
        )
      );
      if (updates.dismissAfterMs !== undefined) {
        scheduleDismiss(id, updates.dismissAfterMs);
      }
    },
    [scheduleDismiss]
  );

  const dismissToast = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [clearTimer]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ showToast, updateToast, dismissToast }),
    [showToast, updateToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastStack} aria-live="polite">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            onClose={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
