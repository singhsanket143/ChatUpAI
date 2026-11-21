import { MemoryBucket } from "./api";

export type MemoryTab = "semantic" | "episodes" | "profile" | "procedural";

export type MemoryItem = {
  key: string | null;
  namespace: string[];
  value: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export const MEMORY_TABS: MemoryTab[] = ["semantic", "episodes", "profile", "procedural"];

export const TAB_META: Record<
  MemoryTab,
  { label: string; blurb: string; emptyTitle: string; emptyHint: string }
> = {
  semantic: {
    label: "Semantic",
    blurb: "Facts and knowledge extracted from chats (hot path + background).",
    emptyTitle: "No semantic memories",
    emptyHint: "Send a few messages with facts to remember — they appear here after processing.",
  },
  episodes: {
    label: "Episodic",
    blurb: "Patterns from successful interactions, recalled in context.",
    emptyTitle: "No episodes yet",
    emptyHint: "Episodes are created in the background as you have meaningful exchanges.",
  },
  profile: {
    label: "Profile",
    blurb: "A rolling summary of who you are — updated in place.",
    emptyTitle: "Profile not created",
    emptyHint: "Share your name, preferences, or goals in chat to seed your profile.",
  },
  procedural: {
    label: "Procedural",
    blurb: "How the agent should behave — rules and optimized prompts.",
    emptyTitle: "Default procedures",
    emptyHint: "Custom procedural rules appear here after the optimizer runs.",
  },
};

export function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function memoryTitle(item: MemoryItem, index: number): string {
  if (item.key && String(item.key).trim()) return String(item.key);
  const v = item.value;
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    return t.length > 56 ? `${t.slice(0, 56)}…` : t;
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    for (const k of ["summary", "content", "text", "fact", "description", "name"]) {
      const raw = (v as Record<string, unknown>)[k];
      if (typeof raw === "string" && raw.trim()) {
        const t = raw.trim();
        return t.length > 56 ? `${t.slice(0, 56)}…` : t;
      }
    }
  }
  return `Memory ${index + 1}`;
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function formatDisplayValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(formatDisplayValue).join(", ");
  return JSON.stringify(v);
}

export type { MemoryBucket };