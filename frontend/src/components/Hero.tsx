import { motion } from "framer-motion";
import { ArrowDown, Shield, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
      {/* Decorative grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 chip mb-6"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          منصة عربية مفتوحة المصدر · مدعومة بالذكاء الاصطناعي
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight"
        >
          رصد الحقيقة <br className="sm:hidden" />
          <span className="bg-gradient-to-l from-brand-300 via-brand-400 to-violet-400 bg-clip-text text-transparent">
            بالذكاء الاصطناعي
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          أرسل أي ادعاء أو رابط خبر أو صورة، وسيقوم نظامنا متعدد الوكلاء
          بفحصها مقابل أدلة حية من مصادر موثوقة وإصدار حكم مدعوم بالأدلة
          خلال ثوانٍ.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 flex items-center justify-center gap-3 flex-wrap"
        >
          <a href="#checker" className="btn-primary">
            <Zap className="h-4 w-4" />
            ابدأ التحقق الآن
            <ArrowDown className="h-4 w-4" />
          </a>
          <a href="#agents" className="btn-ghost">
            <Shield className="h-4 w-4" />
            كيف يعمل النظام؟
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { v: "6", l: "وكلاء متخصصون" },
            { v: "+7", l: "محركات بحث" },
            { v: "<15", l: "ثانية للحكم" },
            { v: "100%", l: "عربي RTL" },
          ].map((s) => (
            <div
              key={s.l}
              className="glass rounded-2xl px-4 py-5 text-center"
            >
              <div className="text-3xl font-extrabold bg-gradient-to-l from-brand-300 to-violet-300 bg-clip-text text-transparent">
                {s.v}
              </div>
              <div className="text-xs text-slate-400 mt-1">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
