// Client for the RASAD AI backend.

import { getApiKey } from "./storage";

const BASE = import.meta.env.VITE_API_URL || "/api";

export type Verdict =
  | "VERIFIED"
  | "FALSE"
  | "MISLEADING"
  | "UNVERIFIED"
  | "AI_GENERATED"
  | "SATIRE";

export interface Source {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  credibility: number;
}

export interface AgentTrace {
  agent: string;
  role: string;
  summary: string;
  duration_ms: number;
}

export interface CheckResult {
  id: string;
  claim: string;
  claim_type: "text" | "url" | "image";
  language: string;
  verdict: Verdict;
  confidence: number;
  explanation_ar: string;
  explanation_en: string;
  key_points: string[];
  sources: Source[];
  agents: AgentTrace[];
  created_at: string;
  processing_time_ms: number;
  demo_mode: boolean;
}

export interface ImageCheckResult {
  id: string;
  verdict: Verdict;
  confidence: number;
  explanation_ar: string;
  indicators: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  demo_mode: boolean;
}

export interface TrendingClaim {
  title: string;
  summary: string;
  verdict: Verdict;
  confidence: number;
  source: string;
  url: string;
  detected_at: string;
}

export interface AgentInfo {
  name: string;
  role_ar: string;
  role_en: string;
  icon: string;
}

export interface Stats {
  total_checks: number;
  today_checks: number;
  verdicts: Record<string, number>;
  recent: { claim: string; verdict: Verdict; confidence: number; at: string }[];
  uptime_seconds: number;
}

export type StreamEvent =
  | { event: "start"; payload: { claim_id: string; claim?: string; demo_mode?: boolean } }
  | { event: "agent:start"; payload: { agent: string } }
  | { event: "agent:done"; payload: AgentTrace & { sources_preview?: Source[] } }
  | { event: "done"; payload: CheckResult }
  | { event: "error"; payload: { message: string } };

function authHeaders(): Record<string, string> {
  const key = getApiKey();
  return key ? { "X-Gemini-Key": key } : {};
}

async function jsonOrError<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function health(): Promise<{
  status: string;
  demo_mode: boolean;
  user_key_present: boolean;
  timestamp: string;
}> {
  return jsonOrError(
    await fetch(`${BASE}/health`, { headers: authHeaders() }),
  );
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  const res = await fetch(`${BASE}/validate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(body.detail || "Invalid key");
  }
  return true;
}

export async function checkClaim(payload: {
  text?: string;
  url?: string;
  language?: string;
}): Promise<CheckResult> {
  return jsonOrError(
    await fetch(`${BASE}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ language: "ar", ...payload }),
    }),
  );
}

export async function* streamCheck(payload: {
  text?: string;
  url?: string;
  language?: string;
}): AsyncGenerator<StreamEvent, void, unknown> {
  const res = await fetch(`${BASE}/check/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ language: "ar", ...payload }),
  });
  if (!res.ok || !res.body) {
    let detail = `HTTP ${res.status}`;
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);

      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data) continue;
        try {
          yield JSON.parse(data) as StreamEvent;
        } catch {
          /* ignore */
        }
      }
    }
  }
}

export async function checkImage(file: File): Promise<ImageCheckResult> {
  const form = new FormData();
  form.append("file", file);
  return jsonOrError(
    await fetch(`${BASE}/check/image`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    }),
  );
}

export async function ocrImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch(`${BASE}/ocr`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  const data = await jsonOrError<{ text: string }>(r);
  return data.text;
}

export async function fetchTrending(): Promise<TrendingClaim[]> {
  return jsonOrError(await fetch(`${BASE}/trending`));
}

export async function fetchAgents(): Promise<{ agents: AgentInfo[] }> {
  return jsonOrError(await fetch(`${BASE}/agents`));
}

export async function fetchStats(): Promise<Stats> {
  return jsonOrError(await fetch(`${BASE}/stats`));
}
