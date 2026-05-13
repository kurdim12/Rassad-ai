import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Moon,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { validateApiKey } from "../lib/api";
import {
  getApiKey,
  getTheme,
  setApiKey,
  setTheme,
  clearHistory,
} from "../lib/storage";
import { useToast } from "../lib/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onKeyChange?: () => void;
}

export function SettingsDrawer({ open, onClose, onKeyChange }: Props) {
  const toast = useToast();
  const [key, setKey] = useState("");
  const [reveal, setReveal] = useState(false);
  const [validating, setValidating] = useState(false);
  const [theme, setLocalTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (open) {
      setKey(getApiKey());
      setLocalTheme(getTheme());
    }
  }, [open]);

  const save = async () => {
    if (!key.trim()) {
      setApiKey("");
      toast.push("تم حذف المفتاح. النظام يعمل في الوضع التجريبي.", "info");
      onKeyChange?.();
      return;
    }
    setValidating(true);
    try {
      await validateApiKey(key.trim());
      setApiKey(key.trim());
      toast.push("✅ تم التحقق من المفتاح وحفظه محلياً.", "success");
      onKeyChange?.();
      onClose();
    } catch (e) {
      toast.push(
        `❌ المفتاح غير صالح: ${e instanceof Error ? e.message : "خطأ غير معروف"}`,
        "error",
      );
    } finally {
      setValidating(false);
    }
  };

  const swapTheme = (t: "dark" | "light") => {
    setLocalTheme(t);
    setTheme(t);
  };

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
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed top-0 bottom-0 left-0 z-50 w-[min(400px,90vw)] glass border-l border-white/[0.08] flex flex-col"
            dir="rtl"
          >
            <header className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-brand-300" />
                الإعدادات
              </h2>
              <button onClick={onClose} className="btn-ghost px-2 py-2">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* API key */}
              <section>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-300" />
                  مفتاح Gemini API
                </h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  بدون مفتاح، يعمل النظام في الوضع التجريبي مع أمثلة جاهزة.
                  أضف مفتاحك لتفعيل التحقق الفوري من أي ادعاء عربي.
                  المفتاح يُحفظ في متصفحك فقط ويُرسل عبر HTTPS مع كل طلب.
                </p>

                <div className="relative">
                  <input
                    type={reveal ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="AIza..."
                    dir="ltr"
                    className="w-full rounded-xl bg-slate-900/60 border border-white/[0.08]
                               focus:border-brand-400/50 focus:ring-2 focus:ring-brand-400/20
                               px-4 py-3 pl-10 text-sm font-mono outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white"
                  >
                    {reveal ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <button
                  onClick={save}
                  disabled={validating}
                  className="btn-primary w-full mt-3"
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري التحقق…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      حفظ وتفعيل
                    </>
                  )}
                </button>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-xs text-brand-300 hover:text-brand-200 inline-flex items-center gap-1"
                >
                  احصل على مفتاح مجاني من Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a>
              </section>

              {/* Theme */}
              <section>
                <h3 className="font-bold mb-2">المظهر</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => swapTheme("dark")}
                    className={`glass glass-hover rounded-xl p-3 flex items-center justify-center gap-2 ${
                      theme === "dark"
                        ? "ring-2 ring-brand-400/50 bg-brand-500/10"
                        : ""
                    }`}
                  >
                    <Moon className="h-4 w-4" /> داكن
                  </button>
                  <button
                    onClick={() => swapTheme("light")}
                    className={`glass glass-hover rounded-xl p-3 flex items-center justify-center gap-2 ${
                      theme === "light"
                        ? "ring-2 ring-brand-400/50 bg-brand-500/10"
                        : ""
                    }`}
                  >
                    <Sun className="h-4 w-4" /> فاتح
                  </button>
                </div>
              </section>

              {/* Data */}
              <section>
                <h3 className="font-bold mb-2">البيانات</h3>
                <button
                  onClick={() => {
                    clearHistory();
                    toast.push("تم حذف السجل المحلي.", "info");
                  }}
                  className="btn-ghost text-red-200 hover:text-red-100 w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف سجل التحقق المحلي
                </button>
              </section>
            </div>

            <footer className="p-4 text-xs text-slate-500 border-t border-white/[0.06]">
              المفتاح محفوظ في المتصفح فقط — لا يُرسل لأي خادم خارجي.
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
