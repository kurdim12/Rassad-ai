import { AnimatePresence, motion } from "framer-motion";
import { Clock, Trash2, X } from "lucide-react";
import { HistoryItem, removeHistory } from "../lib/storage";
import { verdictMeta } from "../lib/verdict";

interface Props {
  open: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onPick: (item: HistoryItem) => void;
  onChanged: (next: HistoryItem[]) => void;
}

export function HistoryDrawer({ open, onClose, items, onPick, onChanged }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed top-0 bottom-0 right-0 z-50 w-[min(440px,92vw)] glass border-l border-white/[0.08] flex flex-col"
            dir="rtl"
          >
            <header className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-300" />
                السجل
                <span className="chip text-xs">{items.length}</span>
              </h2>
              <button onClick={onClose} className="btn-ghost px-2 py-2">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">لا توجد عمليات تحقق سابقة بعد.</p>
                </div>
              )}
              {items.map((it) => {
                const meta = verdictMeta(it.verdict);
                return (
                  <div
                    key={it.id}
                    className="glass glass-hover rounded-xl p-3 cursor-pointer"
                    onClick={() => {
                      onPick(it);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.classBg} ${meta.classText}`}
                      >
                        {meta.emoji} {meta.short}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChanged(removeHistory(it.id));
                        }}
                        className="p-1 text-slate-500 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm leading-snug line-clamp-2">{it.claim}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{Math.round(it.confidence * 100)}٪</span>
                      <time>
                        {new Date(it.at).toLocaleString("ar-EG", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
