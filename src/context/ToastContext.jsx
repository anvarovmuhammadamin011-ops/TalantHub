import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle, error: XCircle, info: Info };
const STYLES = {
  success: "bg-white border-success/20 text-ink",
  error: "bg-white border-danger/20 text-ink",
  info: "bg-white border-border text-ink",
};
const ICON_COLORS = { success: "text-success", error: "text-danger", info: "text-accent" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium max-w-sm animate-toast-in ${STYLES[t.type] || STYLES.info}`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${ICON_COLORS[t.type] || ICON_COLORS.info}`} />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-ink-3 hover:text-ink flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}
