// In dev, Vite proxies /upload, /sequences, /blast → localhost:3001 automatically.
// In production, set VITE_API_URL to your deployed backend URL.
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface Sequence {
  _id: string;
  header: string;
  sequence: string;
  length: number;
  uploadedAt: string;
}

export interface SequencesResponse {
  sequences: Sequence[];
  page: number;
  pages: number;
  total: number;
}

export interface UploadResponse {
  message: string;
  count: number;
  sequences: Array<{ header: string; sequence: string; length: number }>;
}

export interface BlastSubmitResponse {
  rid: string;
  estimatedTime: number;
}

export interface BlastStatusResponse {
  status: "READY" | "WAITING" | "FAILED" | "UNKNOWN";
  result: string | null;
}

// ── Sequences ────────────────────────────────────────────────────────────────

export async function fetchSequences(
  search = "",
  page = 1
): Promise<SequencesResponse> {
  const res = await fetch(
    `${BASE_URL}/sequences?search=${encodeURIComponent(search)}&page=${page}`
  );
  if (!res.ok) throw new Error("Failed to fetch sequences");
  return res.json();
}

export async function fetchSequenceById(id: string): Promise<Sequence> {
  const res = await fetch(`${BASE_URL}/sequences/${id}`);
  if (!res.ok) throw new Error("Sequence not found");
  return res.json();
}

// ── Upload ───────────────────────────────────────────────────────────────────

export async function uploadFasta(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Upload failed");
  }
  return res.json();
}

// ── BLAST ────────────────────────────────────────────────────────────────────

export async function submitBlast(sequence: string): Promise<BlastSubmitResponse> {
  const res = await fetch(`${BASE_URL}/blast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sequence }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "BLAST submission failed");
  }
  return res.json();
}

export async function pollBlastStatus(rid: string): Promise<BlastStatusResponse> {
  const res = await fetch(`${BASE_URL}/blast/${rid}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "BLAST status check failed");
  }
  return res.json();
}