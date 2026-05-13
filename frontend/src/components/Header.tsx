import { AlertCircle, Github, Sparkles } from "lucide-react";

interface Props {
  demoMode: boolean | null;
  serverError: string | null;
}

export function Header({ demoMode, serverError }: Props) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="RASAD" className="h-9 w-9 rounded-lg" />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight">RASAD AI</div>
            <div className="text-xs text-slate-400 -mt-0.5">رصد الحقيقة</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <a href="#checker" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white">
            التحقق
          </a>
          <a href="#agents" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white">
            الوكلاء
          </a>
          <a href="#trending" className="px-3 py-1.5 text-sm text-slate-300 hover:text-white">
            الأكثر تداولاً
          </a>
        </div>

        <div className="flex items-center gap-2">
          {serverError ? (
            <span
              title={serverError}
              className="chip border-red-500/30 bg-red-500/10 text-red-200"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              الخادم غير متصل
            </span>
          ) : demoMode === true ? (
            <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              وضع تجريبي
            </span>
          ) : demoMode === false ? (
            <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              متصل بـ Gemini AI
            </span>
          ) : null}

          <a
            href="https://github.com/kurdim12/rassad-ai"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost text-sm"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
