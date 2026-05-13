import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { TrendingClaim, fetchTrending } from "../lib/api";
import { verdictMeta } from "../lib/verdict";

export function Trending() {
  const [items, setItems] = useState<TrendingClaim[]>([]);

  useEffect(() => {
    fetchTrending()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  return (
    <section id="trending" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="chip mb-3">
              <Flame className="h-3 w-3 text-amber-300" />
              مرصد التداول
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
              ادعاءات يجري التحقق منها الآن
            </h2>
          </div>
          <span className="text-sm text-slate-400">يتم التحديث تلقائياً</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, i) => {
            const meta = verdictMeta(it.verdict);
            return (
              <motion.a
                key={i}
                href={it.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`glass glass-hover rounded-2xl p-5 block border ${meta.classBorder}`}
              >
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${meta.classBg} ${meta.classText}`}>
                  {meta.emoji} {meta.short}
                </div>
                <h4 className="mt-3 font-bold leading-snug line-clamp-3">
                  {it.title}
                </h4>
                <p className="mt-2 text-xs text-slate-400 line-clamp-2">
                  {it.summary}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>المصدر: {it.source}</span>
                  <span className="tabular-nums">
                    {Math.round(it.confidence * 100)}٪
                  </span>
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
