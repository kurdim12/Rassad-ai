import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  CheckResult,
  ImageCheckResult,
  checkClaim,
  checkImage,
} from "../lib/api";
import { ResultCard } from "./ResultCard";
import { ImageResultCard } from "./ImageResultCard";

type Mode = "text" | "url" | "image";

const SAMPLES = [
  "فيتامين سي يعالج فيروس كورونا",
  "أبراج الجيل الخامس (5G) تنقل فيروس كورونا",
  "هل الأرض مسطحة؟",
  "الأردن أعلن استقلاله عام 1946",
];

export function ClaimChecker() {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [imageResult, setImageResult] = useState<ImageCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setResult(null);
    setImageResult(null);
    setError(null);
  };

  const submit = async () => {
    reset();
    setLoading(true);
    try {
      if (mode === "image") {
        if (!file) throw new Error("الرجاء اختيار صورة للفحص.");
        const res = await checkImage(file);
        setImageResult(res);
      } else {
        const payload = mode === "text" ? { text } : { url };
        if (!Object.values(payload)[0]?.trim())
          throw new Error("الرجاء إدخال محتوى للتحقق منه.");
        const res = await checkClaim(payload);
        setResult(res);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
  };

  return (
    <section id="checker" className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40"
        >
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  تحقق من ادعاء
                </h2>
                <p className="text-sm text-slate-400">
                  نصّ، رابط خبر، أو صورة — والنتيجة خلال ثوانٍ.
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-1">
              {(
                [
                  { k: "text", l: "نص", icon: FileText },
                  { k: "url", l: "رابط", icon: LinkIcon },
                  { k: "image", l: "صورة", icon: ImageIcon },
                ] as const
              ).map(({ k, l, icon: Icon }) => (
                <button
                  key={k}
                  onClick={() => {
                    setMode(k);
                    reset();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    mode === k
                      ? "bg-brand-500/20 text-brand-200 ring-1 ring-brand-400/30"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {l}
                </button>
              ))}
            </div>
          </div>

          {mode === "text" && (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder="مثلاً: «فيتامين سي يعالج فيروس كورونا»"
              rows={5}
              dir="rtl"
              className="w-full rounded-2xl bg-slate-900/60 border border-white/[0.08]
                         focus:border-brand-400/50 focus:ring-2 focus:ring-brand-400/20
                         px-4 py-3 text-base resize-none outline-none transition"
            />
          )}

          {mode === "url" && (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={onKey}
              dir="ltr"
              placeholder="https://example.com/article"
              className="w-full rounded-2xl bg-slate-900/60 border border-white/[0.08]
                         focus:border-brand-400/50 focus:ring-2 focus:ring-brand-400/20
                         px-4 py-3.5 text-base outline-none transition"
            />
          )}

          {mode === "image" && (
            <ImageDropzone file={file} setFile={setFile} />
          )}

          {/* Samples */}
          {mode === "text" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 self-center">
                جرّب مثالاً:
              </span>
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setText(s)}
                  className="chip glass-hover text-xs"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              يستخدم Gemini AI + بحث مباشر متعدد المحركات
            </p>
            <button
              onClick={submit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحقق…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  تحقق الآن
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6"
            >
              <LoadingSteps />
            </motion.div>
          )}
          {result && !loading && (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <ResultCard result={result} />
            </motion.div>
          )}
          {imageResult && !loading && (
            <motion.div
              key={imageResult.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              <ImageResultCard result={imageResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ImageDropzone({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl
                  border-2 border-dashed px-6 py-10 cursor-pointer transition
                  ${
                    dragOver
                      ? "border-brand-400/60 bg-brand-400/5"
                      : "border-white/[0.10] bg-slate-900/40 hover:bg-slate-900/60"
                  }`}
    >
      {preview ? (
        <img
          src={preview}
          alt="معاينة"
          className="max-h-48 rounded-xl ring-1 ring-white/10"
        />
      ) : (
        <Upload className="h-10 w-10 text-slate-500" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium">
          {file ? file.name : "اسحب صورة هنا أو انقر للاختيار"}
        </p>
        <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP — حتى 10MB</p>
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
    </label>
  );
}

function LoadingSteps() {
  const steps = [
    "تحليل لغوي للادعاء",
    "البحث في محركات متعددة",
    "تقييم موثوقية المصادر",
    "رصد مؤشرات التلاعب",
    "تركيب الحكم النهائي",
  ];
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Loader2 className="h-5 w-5 text-brand-300 animate-spin" />
        <h3 className="font-semibold">نظام الوكلاء يعمل…</h3>
      </div>
      <ul className="space-y-2">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-3 text-sm text-slate-300"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-brand-400 to-violet-400 shimmer rounded-full" />
      </div>
    </div>
  );
}
