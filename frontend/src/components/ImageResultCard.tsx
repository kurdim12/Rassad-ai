import { motion } from "framer-motion";
import { AlertTriangle, ImageIcon } from "lucide-react";
import { ImageCheckResult } from "../lib/api";
import { verdictMeta } from "../lib/verdict";

export function ImageResultCard({ result }: { result: ImageCheckResult }) {
  const meta = verdictMeta(result.verdict);
  const pct = Math.round(result.confidence * 100);

  return (
    <div
      className={`glass rounded-3xl p-6 sm:p-8 border-2 ${meta.classBorder} ${meta.classBg}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <ImageIcon className="h-6 w-6 text-violet-300" />
        <div>
          <h3 className="font-display text-xl font-bold">تحليل الصورة</h3>
          <p className="text-xs text-slate-400">كشف الصور المولّدة + EXIF</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-5xl">{meta.emoji}</div>
        <div>
          <div className={`text-xs uppercase tracking-wider ${meta.classText} font-bold`}>
            الحكم
          </div>
          <h4 className={`text-2xl font-extrabold ${meta.classText}`}>{meta.label}</h4>
        </div>
        <div className="sm:mr-auto text-center">
          <div className="text-3xl font-extrabold tabular-nums">{pct}%</div>
          <div className="text-xs text-slate-400">احتمال أنها مولّدة بالذكاء الاصطناعي</div>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-violet-400/70"
        />
      </div>

      <p className="mt-5 text-base leading-relaxed">{result.explanation_ar}</p>

      {result.indicators.length > 0 && (
        <div className="mt-5">
          <h5 className="text-sm font-bold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            المؤشرات
          </h5>
          <ul className="space-y-1.5">
            {result.indicators.map((ind, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-200">
                <span className="text-amber-300">•</span>
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mt-5">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200">
          بيانات وصفية (EXIF + معلومات الملف)
        </summary>
        <pre
          dir="ltr"
          className="mt-2 text-xs bg-black/30 rounded-xl p-3 overflow-x-auto text-left"
        >
          {JSON.stringify(result.metadata, null, 2)}
        </pre>
      </details>
    </div>
  );
}
