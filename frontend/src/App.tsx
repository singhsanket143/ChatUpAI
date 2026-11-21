import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ChatMessage,
  MemoryBucket,
  Thread,
  clearStoredUserId,
  compactThreadHistory,
  createThread,
  fetchCompactionSummary,
  fetchMemory,
  getMessages,
  getStoredUserId,
  listThreads,
  login,
  renameThread,
  setStoredUserId,
  streamChat,
} from "./api";
import { ActivityItem, ActivityPanel } from "./ActivityPanel";
import { MessageContent } from "./MessageContent";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { CompactedHistoryModal } from "./CompactedHistoryModal";
import { MemoryPanel, type MemoryTab } from "./MemoryPanel";
import { readThreadFromUrl, writeThreadToUrl } from "./threadUrl";

type UiMessage = ChatMessage & { activity?: ActivityItem[] };

const SIDEBAR_LEFT_KEY = "chatup_sidebar_left_collapsed";
const SIDEBAR_RIGHT_KEY = "chatup_sidebar_right_collapsed";
const THEME_KEY = "chatup_theme";

type Theme = "dark" | "light";

function readCollapsed(key: string): boolean {
  return localStorage.getItem(key) === "1";
}

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(getStoredUserId());
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [memory, setMemory] = useState<MemoryBucket | null>(null);
  const [memoryTab, setMemoryTab] = useState<MemoryTab>("semantic");
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [compacting, setCompacting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [compactedSummary, setCompactedSummary] = useState<string | null>(null);
  const [showCompactedModal, setShowCompactedModal] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(() => readCollapsed(SIDEBAR_LEFT_KEY));
  const [rightCollapsed, setRightCollapsed] = useState(() => readCollapsed(SIDEBAR_RIGHT_KEY));
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activitySeq = useRef(0);
  const assistantIndexRef = useRef(-1);
  const skipRenameBlurRef = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      if (narrow.matches && !readCollapsed(SIDEBAR_LEFT_KEY)) {
        setLeftCollapsed(true);
        localStorage.setItem(SIDEBAR_LEFT_KEY, "1");
      }
    };
    apply();
    narrow.addEventListener("change", apply);
    return () => narrow.removeEventListener("change", apply);
  }, []);

  const pushActivity = useCallback((item: Omit<ActivityItem, "id">) => {
    activitySeq.current += 1;
    const nextItem: ActivityItem = { ...item, id: `a-${activitySeq.current}` };
    setMessages((m) => {
      const next = [...m];
      let idx = assistantIndexRef.current;
      if (idx < 0 || next[idx]?.role !== "assistant") {
        idx = next.length;
        assistantIndexRef.current = idx;
        next.push({ role: "assistant", content: "", activity: [nextItem] });
      } else {
        const prev = next[idx];
        next[idx] = {
          ...prev,
          activity: [...(prev.activity ?? []), nextItem],
        };
      }
      return next;
    });
  }, []);

  const toggleLeft = () => {
    setLeftCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_LEFT_KEY, next ? "1" : "0");
      return next;
    });
  };

  const toggleRight = () => {
    setRightCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_RIGHT_KEY, next ? "1" : "0");
      return next;
    });
  };

  const selectThread = useCallback((threadId: string, history: "push" | "replace" = "push") => {
    setActiveThread(threadId);
    writeThreadToUrl(threadId, history);
  }, []);

  const loadThreads = useCallback(async (uid: string) => {
    const data = await listThreads(uid);
    setThreads(data);
    const fromUrl = readThreadFromUrl();
    const urlMatch =
      fromUrl && data.some((t) => t.thread_id === fromUrl) ? fromUrl : null;
    setActiveThread((current) => {
      const keepCurrent =
        current && data.some((t) => t.thread_id === current) ? current : null;
      const next = urlMatch ?? keepCurrent ?? data[0]?.thread_id ?? null;
      if (next) writeThreadToUrl(next, "replace");
      else writeThreadToUrl(null);
      return next;
    });
  }, []);

  const loadMessages = useCallback(
    async (uid: string, threadId: string) => {
      const data = await getMessages(uid, threadId);
      setMessages(data.messages);
    },
    []
  );

  const loadCompactionSummary = useCallback(async (uid: string, threadId: string) => {
    try {
      const data = await fetchCompactionSummary(uid, threadId);
      setCompactedSummary(data.has_compaction ? data.summary ?? null : null);
    } catch {
      setCompactedSummary(null);
    }
  }, []);

  const loadMemory = useCallback(async (uid: string) => {
    setMemoryLoading(true);
    try {
      const data = await fetchMemory(uid);
      setMemory(data);
    } finally {
      setMemoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadThreads(userId).catch((e) => setError(String(e)));
  }, [userId, loadThreads]);

  useEffect(() => {
    if (!userId || !activeThread) return;
    setShowCompactedModal(false);
    loadMessages(userId, activeThread).catch((e) => setError(String(e)));
    void loadCompactionSummary(userId, activeThread);
  }, [userId, activeThread, loadMessages, loadCompactionSummary]);

  useEffect(() => {
    if (userId) {
      void loadMemory(userId).catch(() => undefined);
    }
  }, [userId, loadMemory]);

  useEffect(() => {
    const onPopState = () => {
      setActiveThread(readThreadFromUrl());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingLabel]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const uid = (form.elements.namedItem("uid") as HTMLInputElement).value.trim();
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!uid) return;
    setBusy(true);
    setError(null);
    try {
      await login(uid, name || undefined);
      setStoredUserId(uid);
      setUserId(uid);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleNewThread() {
    if (!userId) return;
    const t = await createThread(userId, `Chat ${new Date().toLocaleString()}`);
    setThreads((prev) => [t, ...prev]);
    selectThread(t.thread_id, "push");
    setMessages([]);
  }

  function beginRename(threadId: string, title: string) {
    skipRenameBlurRef.current = true;
    setEditingThread(threadId);
    setEditTitle(title);
    window.requestAnimationFrame(() => {
      skipRenameBlurRef.current = false;
    });
  }

  async function handleSaveRename(threadId: string) {
    if (skipRenameBlurRef.current) return;
    const nextTitle = editTitle.trim();
    if (!userId || !nextTitle) {
      setEditingThread(null);
      return;
    }
    const current = threads.find((t) => t.thread_id === threadId);
    if (current?.title === nextTitle) {
      setEditingThread(null);
      return;
    }
    try {
      const updated = await renameThread(userId, threadId, nextTitle);
      setThreads((prev) =>
        prev.map((t) => (t.thread_id === threadId ? { ...t, title: updated.title } : t))
      );
    } catch (err) {
      setError(`Could not rename thread: ${String(err)}`);
    } finally {
      setEditingThread(null);
    }
  }

  async function handleCompactHistory() {
    if (!userId || !activeThread || busy || compacting) return;
    setCompacting(true);
    setNotice(null);
    setError(null);
    try {
      const result = await compactThreadHistory(userId, activeThread);
      if (result.compacted) {
        setNotice(
          `Thread compacted (${result.messages_before} → ${result.messages_after} messages).`
        );
        const full = result.summary.trim() || null;
        setCompactedSummary(full);
        if (full) setShowCompactedModal(true);
        const hist = await getMessages(userId, activeThread);
        setMessages(hist.messages);
      } else {
        setNotice(result.detail || "Nothing to compact yet.");
      }
    } catch (err) {
      setError(`Compaction failed: ${String(err)}`);
    } finally {
      setCompacting(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!userId || !activeThread || !input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    setThinkingLabel("Thinking");
    setError(null);
    activitySeq.current = 0;
    assistantIndexRef.current = -1;

    const ensureAssistantSlot = () => {
      setMessages((m) => {
        const next = [...m];
        if (assistantIndexRef.current < 0 || next[assistantIndexRef.current]?.role !== "assistant") {
          assistantIndexRef.current = next.length;
          next.push({ role: "assistant", content: "", activity: [] });
        }
        return next;
      });
    };

    try {
      await streamChat(userId, activeThread, text, (event) => {
        if (event.type === "status") {
          setThinkingLabel(event.message.replace(/…$/, ""));
        } else if (event.type === "compaction") {
          setNotice(
            `Auto-compacted thread (${event.messages_before} → ${event.messages_after} messages).`
          );
          if (userId && activeThread) {
            void getMessages(userId, activeThread).then((hist) => setMessages(hist.messages));
            void loadCompactionSummary(userId, activeThread);
          }
        } else if (event.type === "tool_call") {
          pushActivity({
            kind: "tool_call",
            name: event.name,
            detail: event.args_summary ?? "",
          });
        } else if (event.type === "tool_result") {
          pushActivity({
            kind: "tool_result",
            name: event.name,
            detail: event.preview ?? "",
          });
        } else if (event.type === "e2b_status") {
          pushActivity({
            kind: "e2b",
            message: event.message,
            enabled: event.enabled,
          });
        } else if (event.type === "job_started") {
          pushActivity({ kind: "job", message: `${event.job} started` });
        } else if (event.type === "job_done") {
          pushActivity({
            kind: "job",
            message: `${event.job} ${event.status ?? "done"}`,
          });
        } else if (event.type === "token_start") {
          setThinkingLabel(null);
          ensureAssistantSlot();
        } else if (event.type === "token") {
          setThinkingLabel(null);
          setMessages((m) => {
            const next = [...m];
            const idx = assistantIndexRef.current;
            if (idx < 0 || next[idx]?.role !== "assistant") {
              assistantIndexRef.current = next.length;
              next.push({ role: "assistant", content: event.content });
            } else {
              const prev = next[idx];
              next[idx] = {
                ...prev,
                content: prev.content + event.content,
              };
            }
            return next;
          });
        } else if (event.type === "done") {
          setThinkingLabel(null);
          if (event.reply) {
            setMessages((m) => {
              const next = [...m];
              const idx = assistantIndexRef.current;
              if (idx >= 0 && next[idx]?.role === "assistant") {
                const prev = next[idx];
                next[idx] = { ...prev, content: event.reply };
              } else {
                assistantIndexRef.current = next.length;
                next.push({ role: "assistant", content: event.reply });
              }
              return next;
            });
          }
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      });
      await loadThreads(userId);
    } catch (err) {
      setError(String(err));
      const failIdx = assistantIndexRef.current;
      setMessages((m) =>
        m.filter((_, i) => i !== failIdx || m[i]?.content || (m[i]?.activity?.length ?? 0) > 0)
      );
    } finally {
      setThinkingLabel(null);
      setBusy(false);
    }
  }

  function handleSignOut() {
    clearStoredUserId();
    setUserId(null);
    setThreads([]);
    setActiveThread(null);
    writeThreadToUrl(null);
    setMessages([]);
    setMemory(null);
  }

  if (!userId) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <h1>ChatUp</h1>
          <p className="muted">A calm assistant with long-term memory. Sign in with any user id.</p>
          <form className="login-form" onSubmit={handleLogin}>
            <input name="uid" placeholder="User id" required autoComplete="username" />
            <input name="name" placeholder="Display name (optional)" />
            <button type="submit" disabled={busy}>
              Continue
            </button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  const layoutClass = [
    "layout",
    leftCollapsed ? "left-collapsed" : "",
    rightCollapsed ? "right-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={layoutClass}>
      <aside className="panel sidebar">
        <header className="panel-head panel-head-split">
          <h2 className="sidebar-brand">ChatUp</h2>
          <button
            type="button"
            className="btn-ghost icon-btn"
            onClick={toggleLeft}
            title="Hide threads"
            aria-label="Hide conversation list"
          >
            <ChevronLeftIcon />
          </button>
        </header>
        <div className="toolbar">
          <button type="button" className="btn-primary" onClick={() => void handleNewThread()}>
            New thread
          </button>
          <div className="toolbar-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle color theme"
            >
              <ThemeIcon theme={theme} />
            </button>
            <button type="button" className="btn-secondary" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
        <p className="muted small" style={{ padding: "0 0.85rem 0.35rem", margin: 0 }}>
          Conversations
        </p>
        <ul className="thread-list">
          {threads.map((t) => (
            <li key={t.thread_id} className="thread-item">
              {editingThread === t.thread_id ? (
                <form
                  className="thread-rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSaveRename(t.thread_id);
                  }}
                >
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    aria-label="Thread title"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setEditingThread(null);
                        setEditTitle(t.title);
                      }
                    }}
                    onBlur={(e) => {
                      const related = e.relatedTarget as Node | null;
                      if (related && e.currentTarget.form?.contains(related)) return;
                      void handleSaveRename(t.thread_id);
                    }}
                  />
                </form>
              ) : (
                <>
                  <button
                    type="button"
                    className={t.thread_id === activeThread ? "active" : ""}
                    onClick={() => selectThread(t.thread_id, "push")}
                    onDoubleClick={() => beginRename(t.thread_id, t.title)}
                  >
                    {t.title}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost thread-edit icon-btn"
                    title="Rename thread"
                    aria-label={`Rename ${t.title}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => beginRename(t.thread_id, t.title)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path
                        d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16 3.5a1.4 1.4 0 0 0-2 0L3.5 14"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M13.5 5.5l5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <footer className="sidebar-foot muted">User: {userId}</footer>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-header-row">
            {leftCollapsed && (
              <button
                type="button"
                className="btn-ghost icon-btn"
                onClick={toggleLeft}
                title="Show threads"
                aria-label="Show conversation list"
              >
                <MenuIcon />
              </button>
            )}
            <h1 className="chat-title">
              {threads.find((t) => t.thread_id === activeThread)?.title ?? "Chat"}
            </h1>
            <div className="header-spacer" />
            <button
              type="button"
              className="btn-ghost compact-history-btn"
              title="View summarized older messages stored in the checkpoint"
              aria-label="View compacted history"
              disabled={!activeThread || !compactedSummary}
              onClick={() => setShowCompactedModal(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path
                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V6H6.5A2.5 2.5 0 0 0 4 8.5v11zM8 10h8M8 14h5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>View summary</span>
            </button>
            <button
              type="button"
              className="btn-ghost compact-history-btn"
              title="Summarize older messages and shrink checkpoint history"
              aria-label="Compact thread history"
              disabled={!activeThread || busy || compacting}
              onClick={() => void handleCompactHistory()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path
                  d="M4 7h10M4 12h6M4 17h8M16 7v10l4-5-4-5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{compacting ? "Compacting…" : "Compact history"}</span>
            </button>
            {rightCollapsed && (
              <button
                type="button"
                className="btn-ghost icon-btn"
                onClick={toggleRight}
                title="Show memory"
                aria-label="Show memory panel"
              >
                <ChevronLeftIcon />
              </button>
            )}
          </div>
        </header>
        <div className="chat-column">
          {notice && (
            <p className="thread-notice muted" role="status">
              {notice}
            </p>
          )}
          <div className="messages" aria-label="Chat messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <p className="empty-state-title">What can I help with?</p>
                <p className="empty-state-hint muted">
                  Ask anything — your agent streams replies and remembers context over time.
                </p>
              </div>
            )}
            {messages.map((m, i) => {
              const isLiveAssistant = busy && m.role === "assistant" && i === messages.length - 1;
              const showThinking = isLiveAssistant && thinkingLabel && !m.content;
              return (
                <article key={i} className={`message-row ${m.role}`}>
                  <span className="message-role-label">{m.role === "user" ? "You" : "Assistant"}</span>
                  {m.role === "assistant" && (m.activity?.length ?? 0) > 0 && (
                    <ActivityPanel items={m.activity!} live={isLiveAssistant} />
                  )}
                  {(m.content || showThinking) && (
                    <div className={`bubble ${m.role}${showThinking ? " thinking-bubble" : ""}`}>
                      {m.content ? (
                        <MessageContent content={m.content} role={m.role} />
                      ) : (
                        <ThinkingIndicator label={thinkingLabel!} />
                      )}
                    </div>
                  )}
                </article>
              );
            })}
            {thinkingLabel &&
              !(
                messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" &&
                !messages[messages.length - 1].content
              ) && (
                <article className="message-row assistant thinking-row">
                  <span className="message-role-label">Assistant</span>
                  <div className="bubble assistant thinking-bubble">
                    <ThinkingIndicator label={thinkingLabel} />
                  </div>
                </article>
              )}
            <div ref={messagesEndRef} />
          </div>
          <div className="composer-wrap">
            <form className="composer" onSubmit={(e) => void handleSend(e)}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={busy || !activeThread}
                rows={1}
                aria-label="Message input"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend(e as unknown as FormEvent);
                  }
                }}
              />
              <button
                type="submit"
                className={`send-btn${busy ? " send-btn--busy" : ""}`}
                disabled={busy || !activeThread || !input.trim()}
                aria-label={busy ? "Sending" : "Send message"}
              >
                <SendIcon />
              </button>
            </form>
            {error && <p className="error composer-error">{error}</p>}
          </div>
        </div>
      </main>

      {showCompactedModal && compactedSummary && (
        <CompactedHistoryModal
          summary={compactedSummary}
          threadTitle={threads.find((t) => t.thread_id === activeThread)?.title ?? "Chat"}
          onClose={() => setShowCompactedModal(false)}
        />
      )}

      {!rightCollapsed && (
        <MemoryPanel
          memory={memory}
          memoryTab={memoryTab}
          onTabChange={setMemoryTab}
          loading={memoryLoading}
          onRefresh={() => {
            if (userId) void loadMemory(userId);
          }}
          onCollapse={toggleRight}
        />
      )}
    </div>
  );
}