import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useToast } from "../lib/toast";

interface Props {
  onResult: (text: string) => void;
  className?: string;
}

interface SpeechRecognitionLike {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: (e: { error: string }) => void;
  onend: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
    SpeechRecognition?: { new (): SpeechRecognitionLike };
  }
}

export function VoiceButton({ onResult, className = "" }: Props) {
  const toast = useToast();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!Rec);
  }, []);

  if (!supported) return null;

  const start = () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    const r = new Rec();
    r.lang = "ar-SA";
    r.continuous = false;
    r.interimResults = true;
    let final = "";
    r.onresult = (event) => {
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (i === event.results.length - 1) {
          interim = piece;
        }
        final = piece;
      }
      onResult(interim || final);
    };
    r.onerror = (e) => {
      toast.push(`تعذّر تشغيل الميكروفون: ${e.error}`, "error");
      setListening(false);
    };
    r.onend = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  };

  const stop = () => {
    recRef.current?.stop();
    setListening(false);
  };

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      title={listening ? "إيقاف" : "إملاء صوتي بالعربية"}
      className={`p-2 rounded-lg transition ${
        listening
          ? "bg-red-500/20 text-red-200 ring-2 ring-red-400/40 animate-pulse"
          : "bg-white/[0.05] hover:bg-white/[0.10] text-slate-300"
      } ${className}`}
    >
      {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
