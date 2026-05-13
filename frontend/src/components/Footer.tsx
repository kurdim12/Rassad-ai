import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
            <div>
              <div className="font-display font-bold">RASAD AI</div>
              <div className="text-xs text-slate-500">
                مشروع هاكاثون جامعة الزيتونة — مايو 2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400">
            <a
              href="https://github.com/kurdim12/rassad-ai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <Github className="h-4 w-4" />
              المصدر المفتوح
            </a>
            <span className="flex items-center gap-1.5">
              صُمم بـ <Heart className="h-4 w-4 text-red-400" /> للحقيقة
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
