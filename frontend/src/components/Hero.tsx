import { motion } from "framer-motion";
import { ArrowDown, Shield, Zap } from "lucide-react";
import { StatsBar } from "./StatsBar";

export function Hero() {
  return (
    <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
      {/* Animated gradient blobs */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 -z-10"
      >
        <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-brand-500/30 blur-3xl animate-pulse-slow" />
        <div
          className="absolute top-1/3 -left-32 h-[420px] w-[420px] rounded-full bg-violet-500/25 blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full bg-emerald-500/20 blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
      </motion.div>

      {/* Subtle grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />

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

        <StatsBar />
      </div>
    </section>
  );
}
