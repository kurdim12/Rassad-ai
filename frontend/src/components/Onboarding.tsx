import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, KeyRound, Search, Shield, Sparkles, X } from "lucide-react";
import { markOnboarded } from "../lib/storage";

const STEPS = [
  {
    icon: Sparkles,
    title: "أهلاً بك في RASAD AI",
    body: "منصة عربية تتحقق من أي ادعاء، رابط، أو صورة باستخدام فريق من 6 وكلاء ذكاء اصطناعي.",
  },
  {
    icon: Search,
    title: "كيف يعمل النظام؟",
    body: "تكتب الادعاء — يحلّل الوكلاء اللغة، يبحثون في عشرات المصادر، يقيّمون الموثوقية، ويُصدرون حكماً شفافاً مدعوماً بالأدلة.",
  },
  {
    icon: KeyRound,
    title: "أضف مفتاحك (اختياري)",
    body: "النظام يعمل مباشرة في وضع تجريبي. أضف مفتاح Gemini مجاناً من زر «المفتاح» أعلاه لتفعيل التحقق الكامل من أي ادعاء.",
  },
  {
    icon: Shield,
    title: "كل شيء شفّاف",
    body: "تستطيع رؤية كل وكيل وهو يعمل، الأدلة الكاملة، وتقييم موثوقية كل مصدر. لا صناديق سوداء.",
  },
];

export function Onboarding() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);

  const close = () => {
    setOpen(false);
    markOnboarded();
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-3xl max-w-md w-full p-6 sm:p-8 relative"
            dir="rtl"
          >
            <button
              onClick={close}
              className="absolute top-3 left-3 btn-ghost px-2 py-2"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center mx-auto mb-5">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-center mb-3">
              {current.title}
            </h2>
            <p className="text-slate-300 text-center leading-relaxed">
              {current.body}
            </p>

            <div className="mt-6 flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition ${
                    step === i ? "w-8 bg-brand-400" : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={close} className="text-sm text-slate-400 hover:text-white">
                تخطّي
              </button>
              <button
                onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : close())}
                className="btn-primary"
              >
                {step < STEPS.length - 1 ? (
                  <>
                    التالي <ArrowLeft className="h-4 w-4" />
                  </>
                ) : (
                  "ابدأ التحقق"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
