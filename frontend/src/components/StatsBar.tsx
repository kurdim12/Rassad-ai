import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { Stats, fetchStats } from "../lib/api";

export function StatsBar() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetchStats()
        .then((d) => alive && setS(d))
        .catch(() => {
          /* ignore */
        });
    };
    load();
    const t = setInterval(load, 12000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (!s) return null;

  const tiles = [
    {
      v: s.total_checks,
      l: "ادعاء تم فحصه",
      icon: ShieldCheck,
      tint: "text-brand-300",
    },
    {
      v: s.verdicts.FALSE || 0,
      l: "ادعاء كاذب",
      icon: XCircle,
      tint: "text-red-300",
    },
    {
      v: s.verdicts.VERIFIED || 0,
      l: "ادعاء صحيح",
      icon: CheckCircle2,
      tint: "text-emerald-300",
    },
    {
      v: s.today_checks,
      l: "اليوم",
      icon: Sparkles,
      tint: "text-violet-300",
    },
  ];

  return (
    <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
      {tiles.map((t, i) => (
        <motion.div
          key={t.l}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
          className="glass rounded-2xl px-4 py-4 flex items-center gap-3"
        >
          <t.icon className={`h-6 w-6 ${t.tint}`} />
          <div>
            <CountUp value={t.v} className="text-2xl font-extrabold tabular-nums" />
            <div className="text-[11px] text-slate-400 mt-0.5">{t.l}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CountUp({ value, className = "" }: { value: number; className?: string }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (value === n) return;
    const from = n;
    const to = value;
    const start = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <div className={className}>{n.toLocaleString("ar-EG")}</div>;
}
