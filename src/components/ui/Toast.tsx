import { createContext, useContext, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, Alert01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000);
    }
  }, [removeToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: "success", title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: "error", title, message, duration: 7000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: "info", title, message });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: "warning", title, message, duration: 6000 });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div 
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 sm:bottom-6 sm:right-6"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckmarkCircle01Icon,
    error: Alert01Icon,
    info: Alert01Icon,
    warning: Alert01Icon,
  };

  const colors = {
    success: "bg-pine-100 text-pine-900 border-pine-200",
    error: "bg-clay-100 text-clay-700 border-clay-300/60",
    info: "bg-pine-100 text-pine-900 border-pine-200",
    warning: "bg-gold-100 text-gold-700 border-gold-300/60",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`flex min-h-[44px] min-w-[320px] max-w-[400px] items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-300 ${colors[toast.type]}`}
      role="alert"
      aria-labelledby={`toast-title-${toast.id}`}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        <HugeiconsIcon icon={Icon} size={20} strokeWidth={2} />
      </div>
      <div className="flex-1">
        <p id={`toast-title-${toast.id}`} className="text-sm font-semibold">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-xs leading-relaxed opacity-90">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100 focus-ring"
        aria-label="Fermer la notification"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
