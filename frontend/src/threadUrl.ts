export function readThreadFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get("thread");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function writeThreadToUrl(
  threadId: string | null,
  mode: "replace" | "push" = "replace"
): void {
  const url = new URL(window.location.href);
  if (threadId) url.searchParams.set("thread", threadId);
  else url.searchParams.delete("thread");
  if (mode === "push") window.history.pushState({ thread: threadId }, "", url);
  else window.history.replaceState({ thread: threadId }, "", url);
}