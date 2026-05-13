// Client for the RASAD AI backend.

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
  timestamp: string;
}> {
  return jsonOrError(await fetch(`${BASE}/health`));
}

export async function checkClaim(payload: {
  text?: string;
  url?: string;
  language?: string;
}): Promise<CheckResult> {
  return jsonOrError(
    await fetch(`${BASE}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "ar", ...payload }),
    }),
  );
}

export async function checkImage(file: File): Promise<ImageCheckResult> {
  const form = new FormData();
  form.append("file", file);
  return jsonOrError(
    await fetch(`${BASE}/check/image`, {
      method: "POST",
      body: form,
    }),
  );
}

export async function fetchTrending(): Promise<TrendingClaim[]> {
  return jsonOrError(await fetch(`${BASE}/trending`));
}

export async function fetchAgents(): Promise<{ agents: AgentInfo[] }> {
  return jsonOrError(await fetch(`${BASE}/agents`));
}
