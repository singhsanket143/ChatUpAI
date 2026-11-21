const STORAGE_KEY = "chatup_user_id";

export function getStoredUserId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredUserId(userId: string): void {
  localStorage.setItem(STORAGE_KEY, userId);
}

export function clearStoredUserId(): void {
  localStorage.removeItem(STORAGE_KEY);
}

async function api<T>(
  path: string,
  options: RequestInit & { userId?: string } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.userId) {
    headers.set("X-User-Id", options.userId);
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }
  return res.json() as Promise<T>;
}

export type Thread = {
  thread_id: string;
  title: string;
  updated_at: string | null;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type MemoryBucket = Record<string, unknown[]>;

export type StreamChatEvent =
  | { type: "start" }
  | { type: "token_start" }
  | { type: "token"; content: string }
  | { type: "status"; message: string }
  | { type: "tool_call"; name: string; args_summary?: string }
  | { type: "tool_result"; name: string; preview?: string }
  | { type: "e2b_status"; enabled: boolean; message: string }
  | { type: "job_started"; job: string }
  | { type: "job_done"; job: string; status?: string }
  | { type: "done"; reply: string; thread_id: string }
  | {
      type: "compaction";
      trigger: string;
      messages_before: number;
      messages_after: number;
      summary_preview?: string;
    }
  | { type: "error"; message: string };

export type CompactThreadResult = {
  thread_id: string;
  compacted: boolean;
  trigger: string;
  messages_before: number;
  messages_after: number;
  summary_preview: string;
  summary: string;
  detail: string;
};

export type CompactionSummaryResponse = {
  thread_id: string;
  has_compaction: boolean;
  summary: string | null;
};

export async function login(userId: string, displayName?: string) {
  return api<{ user_id: string; display_name: string | null }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, display_name: displayName }),
  });
}

export async function listThreads(userId: string) {
  return api<Thread[]>("/api/threads", { userId });
}

export async function createThread(userId: string, title = "New chat") {
  return api<Thread>("/api/threads", {
    method: "POST",
    userId,
    body: JSON.stringify({ title }),
  });
}

export async function renameThread(userId: string, threadId: string, title: string) {
  return api<Thread>(`/api/threads/${encodeURIComponent(threadId)}`, {
    method: "PATCH",
    userId,
    body: JSON.stringify({ title }),
  });
}

export async function fetchCompactionSummary(userId: string, threadId: string) {
  return api<CompactionSummaryResponse>(
    `/api/threads/${encodeURIComponent(threadId)}/compaction`,
    { userId }
  );
}

export async function compactThreadHistory(userId: string, threadId: string) {
  return api<CompactThreadResult>(`/api/threads/${encodeURIComponent(threadId)}/compact`, {
    method: "POST",
    userId,
  });
}

export async function getMessages(userId: string, threadId: string) {
  return api<{ messages: ChatMessage[] }>(`/api/threads/${encodeURIComponent(threadId)}/messages`, {
    userId,
  });
}

export async function sendChat(userId: string, threadId: string, message: string) {
  return api<{ reply: string }>(`/api/threads/${encodeURIComponent(threadId)}/chat`, {
    method: "POST",
    userId,
    body: JSON.stringify({ message }),
  });
}

export async function streamChat(
  userId: string,
  threadId: string,
  message: string,
  onEvent: (event: StreamChatEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("X-User-Id", userId);

  const res = await fetch(`/api/threads/${encodeURIComponent(threadId)}/chat/stream`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || res.statusText);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported by this browser.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("data:"));
      if (!line) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        onEvent(JSON.parse(payload) as StreamChatEvent);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function fetchMemory(userId: string) {
  return api<MemoryBucket>("/api/memory", { userId });
}