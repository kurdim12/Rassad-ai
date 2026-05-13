import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CheckResult } from "../lib/api";
import { confidenceLabel, verdictMeta } from "../lib/verdict";

interface Props {
  result: CheckResult;
}

export function ResultCard({ result }: Props) {
  const meta = verdictMeta(result.verdict);
  const pct = Math.round(result.confidence * 100);

  return (
    <div className="space-y-6">
      {/* Verdict header */}
      <div
        className={`glass rounded-3xl p-6 sm:p-8 border-2 ${meta.classBorder} ${meta.classBg} shadow-2xl ${meta.glow}`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{meta.emoji}</div>
            <div>
              <div className={`text-xs uppercase tracking-wider ${meta.classText} font-bold`}>
                الحكم النهائي
              </div>
              <h3 className={`font-display text-3xl font-extrabold ${meta.classText}`}>
                {meta.label}
              </h3>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="text-4xl font-extrabold tabular-nums">{pct}%</div>
            <div className="text-xs text-slate-300">{confidenceLabel(result.confidence)}</div>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-black/30 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${meta.classText.replace("text-", "bg-")} opacity-70`}
          />
        </div>

        <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-100">
          {result.explanation_ar}
        </p>

        {result.explanation_en && (
          <details className="mt-3 group">
            <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-200">
              English summary
            </summary>
            <p
              dir="ltr"
              className="mt-2 text-sm text-slate-300 text-left bg-black/20 rounded-lg p-3"
            >
              {result.explanation_en}
            </p>
          </details>
        )}

        <div className="mt-5 flex items-center gap-3 flex-wrap text-xs text-slate-300">
          <span className="chip">
            <Clock className="h-3 w-3" />
            {(result.processing_time_ms / 1000).toFixed(1)} ث
          </span>
          <span className="chip">
            <ShieldCheck className="h-3 w-3" />
            {result.sources.length} مصدر
          </span>
          {result.demo_mode && (
            <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-200">
              <Sparkles className="h-3 w-3" />
              وضع تجريبي
            </span>
          )}
        </div>
      </div>

      {/* Key points */}
      {result.key_points.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h4 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-brand-300" />
            النقاط الجوهرية
          </h4>
          <ul className="space-y-2">
            {result.key_points.map((p, i) => (
              <li key={i} className="flex gap-3 text-slate-200">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {result.sources.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h4 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-300" />
            الأدلة والمصادر ({result.sources.length})
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group glass glass-hover rounded-xl p-4 block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-xs font-mono text-slate-400">{s.domain}</div>
                  <CredibilityBadge value={s.credibility} />
                </div>
                <div className="font-semibold text-sm leading-snug group-hover:text-brand-200 transition">
                  {s.title}
                </div>
                {s.snippet && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3">{s.snippet}</p>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-brand-300">
                  فتح المصدر
                  <ExternalLink className="h-3 w-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Agent trace */}
      <div className="glass rounded-2xl p-6">
        <h4 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-300" />
          مسار الوكلاء
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {result.agents.map((a, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-violet-300">{a.agent}</span>
                {a.duration_ms > 0 && (
                  <span className="text-xs text-slate-500">{a.duration_ms} ms</span>
                )}
              </div>
              <div className="text-sm font-medium mt-1">{a.role}</div>
              {a.summary && (
                <div className="text-xs text-slate-400 mt-1 line-clamp-2">{a.summary}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CredibilityBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.8
      ? "text-emerald-300 bg-emerald-500/15"
      : value >= 0.6
        ? "text-blue-300 bg-blue-500/15"
        : value >= 0.4
          ? "text-amber-300 bg-amber-500/15"
          : "text-slate-400 bg-slate-500/15";
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${color}`}
    >
      موثوقية {pct}٪
    </span>
  );
}
