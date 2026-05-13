import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CheckResult } from "../lib/api";
import { useToast } from "../lib/toast";
import { confidenceLabel, verdictMeta } from "../lib/verdict";

interface Props {
  result: CheckResult;
}

export function ResultCard({ result }: Props) {
  const meta = verdictMeta(result.verdict);
  const pct = Math.round(result.confidence * 100);
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement | null>(null);

  const shareText = `${meta.emoji} «${result.claim.slice(0, 90)}…»
الحكم: ${meta.label} (${pct}%)
${result.explanation_ar}

— تحقّق على RASAD AI`;

  const copyAll = async () => {
    await navigator.clipboard.writeText(shareText);
    toast.push("📋 تم نسخ ملخص الحكم.", "success");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RASAD AI · ${meta.label}`,
          text: shareText,
          url: typeof location !== "undefined"
            ? `${location.origin}/?claim=${encodeURIComponent(result.claim.slice(0, 200))}`
            : "",
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyAll();
    }
  };

  const exportPng = async () => {
    if (!cardRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const data = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#0b1220",
      });
      const a = document.createElement("a");
      a.href = data;
      a.download = `rasad-${result.id}.png`;
      a.click();
      toast.push("📥 تم تصدير البطاقة كصورة.", "success");
    } catch (e) {
      toast.push(`تعذّر التصدير: ${e instanceof Error ? e.message : "خطأ"}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Verdict header (export target) */}
      <div
        ref={cardRef}
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
            <AnimatedNumber value={pct} className="text-4xl font-extrabold tabular-nums" />
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

        <div className="mt-5 rounded-xl bg-black/20 border border-white/[0.04] p-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            الادعاء
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-100/90 line-clamp-4">
            {result.claim}
          </p>
        </div>

        <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-100">
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

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <button onClick={copyAll} className="btn-ghost text-sm">
          <Copy className="h-4 w-4" />
          نسخ الملخص
        </button>
        <button onClick={shareNative} className="btn-ghost text-sm">
          <Share2 className="h-4 w-4" />
          مشاركة
        </button>
        <button onClick={exportPng} className="btn-ghost text-sm">
          <Download className="h-4 w-4" />
          تصدير PNG
        </button>
        <span className="text-xs text-slate-500 mr-auto">
          ID: <code className="font-mono">{result.id}</code>
        </span>
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
                <div className="flex items-start gap-2 mb-2">
                  <Favicon domain={s.domain} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-slate-400 truncate">{s.domain}</div>
                  </div>
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
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${color} shrink-0`}
    >
      موثوقية {pct}٪
    </span>
  );
}

function Favicon({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);
  if (!domain || failed) {
    return (
      <div className="h-5 w-5 rounded bg-white/[0.06] shrink-0 flex items-center justify-center text-[10px] text-slate-400">
        {domain?.[0]?.toUpperCase() || "?"}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      width={20}
      height={20}
      onError={() => setFailed(true)}
      className="h-5 w-5 rounded shrink-0 bg-white/5"
      loading="lazy"
    />
  );
}

function AnimatedNumber({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = n;
    const to = value;
    const dur = 800;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <div className={className}>{n}%</div>;
}
