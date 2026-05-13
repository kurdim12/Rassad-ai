import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  ScanText,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  CheckResult,
  ImageCheckResult,
  checkImage,
  ocrImage,
  streamCheck,
} from "../lib/api";
import { pushHistory } from "../lib/storage";
import { useToast } from "../lib/toast";
import { AgentTimeline, TimelineStep } from "./AgentTimeline";
import { ImageResultCard } from "./ImageResultCard";
import { ResultCard } from "./ResultCard";
import { VoiceButton } from "./VoiceButton";

type Mode = "text" | "url" | "image";

const SAMPLES = [
  "فيتامين سي يعالج فيروس كورونا",
  "أبراج الجيل الخامس (5G) تنقل فيروس كورونا",
  "هل الأرض مسطحة؟",
  "الأردن أعلن استقلاله عام 1946",
];

export function ClaimChecker({
  prefilledClaim,
  prefilledResult,
}: {
  prefilledClaim?: string;
  prefilledResult?: CheckResult | null;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState(prefilledClaim || "");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CheckResult | null>(prefilledResult || null);
  const [imageResult, setImageResult] = useState<ImageCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, TimelineStep>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (prefilledClaim) {
      setText(prefilledClaim);
      setMode("text");
    }
  }, [prefilledClaim]);

  const reset = () => {
    setResult(null);
    setImageResult(null);
    setError(null);
    setSteps({});
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
        const value = Object.values(payload)[0];
        if (!value?.trim()) throw new Error("الرجاء إدخال محتوى للتحقق منه.");

        let last: CheckResult | null = null;
        for await (const ev of streamCheck(payload)) {
          if (ev.event === "agent:start") {
            setSteps((s) => ({
              ...s,
              [ev.payload.agent]: { agent: ev.payload.agent, state: "running" },
            }));
          } else if (ev.event === "agent:done") {
            setSteps((s) => ({
              ...s,
              [ev.payload.agent]: {
                agent: ev.payload.agent,
                state: "done",
                summary: ev.payload.summary,
                duration_ms: ev.payload.duration_ms,
              },
            }));
          } else if (ev.event === "done") {
            last = ev.payload;
          } else if (ev.event === "error") {
            throw new Error(ev.payload.message);
          }
        }
        if (last) {
          setResult(last);
          pushHistory({
            id: last.id,
            claim: last.claim,
            verdict: last.verdict,
            confidence: last.confidence,
            at: Date.now(),
            result: last,
          });
          // Update URL so the result is shareable.
          const u = new URL(window.location.href);
          u.searchParams.set("claim", last.claim.slice(0, 200));
          window.history.replaceState({}, "", u.toString());
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
      toast.push(
        `خطأ: ${e instanceof Error ? e.message : "غير معروف"}`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
  };

  const runOCR = async (f: File) => {
    setOcrLoading(true);
    try {
      const t = await ocrImage(f);
      if (t.trim()) {
        setText(t);
        setMode("text");
        toast.push("✅ تم استخراج النص من الصورة. تحقق الآن.", "success");
      } else {
        toast.push("لم نتمكن من استخراج نص (يحتاج مفتاح Gemini).", "info");
      }
    } catch (e) {
      toast.push(
        `تعذّر استخراج النص: ${e instanceof Error ? e.message : "خطأ"}`,
        "error",
      );
    } finally {
      setOcrLoading(false);
    }
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
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="مثلاً: «فيتامين سي يعالج فيروس كورونا»  ·  ⌘K للتركيز  ·  ⌘↵ للإرسال"
                rows={5}
                dir="rtl"
                className="w-full rounded-2xl bg-slate-900/60 border border-white/[0.08]
                           focus:border-brand-400/50 focus:ring-2 focus:ring-brand-400/20
                           px-4 py-3 pl-12 text-base resize-none outline-none transition"
              />
              <div className="absolute left-2 bottom-2">
                <VoiceButton onResult={(t) => setText(t)} />
              </div>
              <div className="absolute left-2 top-2 text-[10px] text-slate-500 tabular-nums">
                {text.length} / 4000
              </div>
            </div>
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
            <ImageDropzone
              file={file}
              setFile={setFile}
              onOCR={runOCR}
              ocrLoading={ocrLoading}
            />
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
              <AgentTimeline steps={steps} />
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
  onOCR,
  ocrLoading,
}: {
  file: File | null;
  setFile: (f: File | null) => void;
  onOCR: (f: File) => void;
  ocrLoading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div className="space-y-3">
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
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG, WebP — حتى 10MB
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>

      {file && (
        <button
          type="button"
          onClick={() => onOCR(file)}
          disabled={ocrLoading}
          className="btn-ghost text-sm w-full"
        >
          {ocrLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanText className="h-4 w-4" />
          )}
          استخرج النص من الصورة (OCR) ثم تحقق منه كنص
        </button>
      )}
    </div>
  );
}
