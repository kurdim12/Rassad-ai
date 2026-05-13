import { Verdict } from "./api";

interface VerdictMeta {
  label: string;
  short: string;
  emoji: string;
  classBg: string;
  classBorder: string;
  classText: string;
  glow: string;
}

const META: Record<Verdict, VerdictMeta> = {
  VERIFIED: {
    label: "تم التحقق",
    short: "صحيح",
    emoji: "✅",
    classBg: "bg-emerald-500/15",
    classBorder: "border-emerald-500/30",
    classText: "text-emerald-300",
    glow: "shadow-emerald-500/30",
  },
  FALSE: {
    label: "ادعاء كاذب",
    short: "كاذب",
    emoji: "❌",
    classBg: "bg-red-500/15",
    classBorder: "border-red-500/30",
    classText: "text-red-300",
    glow: "shadow-red-500/30",
  },
  MISLEADING: {
    label: "مضلل",
    short: "مضلل",
    emoji: "⚠️",
    classBg: "bg-amber-500/15",
    classBorder: "border-amber-500/30",
    classText: "text-amber-300",
    glow: "shadow-amber-500/30",
  },
  UNVERIFIED: {
    label: "غير متحقق منه",
    short: "غير محسوم",
    emoji: "❔",
    classBg: "bg-slate-500/15",
    classBorder: "border-slate-500/30",
    classText: "text-slate-300",
    glow: "shadow-slate-500/30",
  },
  AI_GENERATED: {
    label: "مُولَّد بالذكاء الاصطناعي",
    short: "AI",
    emoji: "🤖",
    classBg: "bg-violet-500/15",
    classBorder: "border-violet-500/30",
    classText: "text-violet-300",
    glow: "shadow-violet-500/30",
  },
  SATIRE: {
    label: "ساخر",
    short: "ساخر",
    emoji: "🎭",
    classBg: "bg-pink-500/15",
    classBorder: "border-pink-500/30",
    classText: "text-pink-300",
    glow: "shadow-pink-500/30",
  },
};

export const verdictMeta = (v: Verdict): VerdictMeta => META[v] || META.UNVERIFIED;

export const confidenceLabel = (c: number) => {
  if (c >= 0.85) return "ثقة عالية جداً";
  if (c >= 0.7) return "ثقة عالية";
  if (c >= 0.5) return "ثقة متوسطة";
  if (c >= 0.3) return "ثقة منخفضة";
  return "ثقة ضعيفة";
};
