import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  msg: string;
}

interface Ctx {
  push: (msg: string, kind?: ToastKind) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(420px,calc(100vw-2rem))]">
        <AnimatePresence>
          {toasts.map((t) => {
            const meta =
              t.kind === "success"
                ? {
                    icon: CheckCircle2,
                    klass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
                  }
                : t.kind === "error"
                  ? {
                      icon: AlertCircle,
                      klass: "border-red-500/30 bg-red-500/10 text-red-200",
                    }
                  : {
                      icon: Info,
                      klass: "border-brand-500/30 bg-brand-500/10 text-brand-200",
                    };
            const Icon = meta.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                className={`glass rounded-xl px-4 py-3 border ${meta.klass} flex items-center gap-3 shadow-xl shadow-black/40`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-sm flex-1">{t.msg}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  className="opacity-60 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}
