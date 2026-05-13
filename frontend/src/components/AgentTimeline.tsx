import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

export interface TimelineStep {
  agent: string;
  state: "pending" | "running" | "done";
  summary?: string;
  duration_ms?: number;
}

const AGENT_LABELS: Record<string, string> = {
  ArabicNLPAgent: "تحليل لغوي",
  EvidenceAgent: "جمع الأدلة",
  CredibilityAgent: "تقييم المصادر",
  FakeNewsAgent: "كشف التلاعب",
  ClaimTracerAgent: "تتبع الادعاء",
  VerdictAgent: "الحكم النهائي",
};

const ALL_AGENTS = [
  "ArabicNLPAgent",
  "FakeNewsAgent",
  "EvidenceAgent",
  "CredibilityAgent",
  "VerdictAgent",
];

export function AgentTimeline({ steps }: { steps: Record<string, TimelineStep> }) {
  const ordered = ALL_AGENTS.map((a) => steps[a] || { agent: a, state: "pending" });
  const doneCount = ordered.filter((s) => s.state === "done").length;

  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-400" />
          </span>
          نظام الوكلاء يعمل…
        </h3>
        <span className="text-xs text-slate-400 tabular-nums">
          {doneCount} / {ordered.length}
        </span>
      </div>

      <div className="space-y-2">
        {ordered.map((s, i) => (
          <motion.div
            key={s.agent}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
              s.state === "done"
                ? "bg-emerald-500/[0.06] border-emerald-500/20"
                : s.state === "running"
                  ? "bg-brand-500/[0.08] border-brand-500/30"
                  : "bg-white/[0.02] border-white/[0.06]"
            }`}
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-black/30 shrink-0">
              {s.state === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              ) : s.state === "running" ? (
                <Loader2 className="h-4 w-4 text-brand-300 animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {AGENT_LABELS[s.agent] || s.agent}
                </span>
                {s.duration_ms !== undefined && (
                  <span className="text-xs text-slate-500 tabular-nums">
                    {s.duration_ms} ms
                  </span>
                )}
              </div>
              <AnimatePresence>
                {s.state !== "pending" && s.summary && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-slate-400 mt-0.5 line-clamp-1"
                  >
                    {s.summary}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-400 to-violet-400 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${(doneCount / ordered.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
