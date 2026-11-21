import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  type MemoryItem,
  type MemoryTab,
  TAB_META,
  formatDisplayValue,
  formatRelativeTime,
  isPlainObject,
  memoryTitle,
} from "./memoryShared";

type MemoryDetailModalProps = {
  item: MemoryItem;
  tab: MemoryTab;
  index: number;
  onClose: () => void;
};

export function MemoryDetailModal({ item, tab, index, onClose }: MemoryDetailModalProps) {
  const [rawOpen, setRawOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const title = memoryTitle(item, index);
  const when = formatRelativeTime(item.updated_at ?? item.created_at);
  const meta = TAB_META[tab];
  const value = item.value;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  let body: ReactNode;
  if (typeof value === "string") {
    body = <p className="memory-card-text">{value}</p>;
  } else if (isPlainObject(value)) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    body =
      entries.length > 0 ? (
        <dl className="memory-kv memory-kv--modal">
          {entries.map(([k, v]) => (
            <div key={k} className="memory-kv-row">
              <dt>{k}</dt>
              <dd>{formatDisplayValue(v)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="memory-card-text muted">Empty object</p>
      );
  } else if (value !== null && value !== undefined) {
    body = <p className="memory-card-text">{formatDisplayValue(value)}</p>;
  } else {
    body = <p className="memory-card-text muted">No value</p>;
  }

  return (
    <div className="memory-modal-root" onClick={onClose}>
      <div
        ref={dialogRef}
        className="memory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="memory-modal-head">
          <div className="memory-card-title-row">
            <h2 id={titleId} className="memory-modal-title">
              {title}
            </h2>
            <span className={`memory-type-badge memory-type-badge--${tab}`}>{meta.label}</span>
          </div>
          <button
            type="button"
            className="btn-ghost icon-btn memory-modal-close"
            onClick={onClose}
            aria-label="Close memory details"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <dl className="memory-modal-meta">
          {item.key && (
            <div className="memory-modal-meta-row">
              <dt>Key</dt>
              <dd>{String(item.key)}</dd>
            </div>
          )}
          {item.namespace?.length > 0 && (
            <div className="memory-modal-meta-row">
              <dt>Namespace</dt>
              <dd>{item.namespace.join(" · ")}</dd>
            </div>
          )}
          {when && (
            <div className="memory-modal-meta-row">
              <dt>Updated</dt>
              <dd>
                <time dateTime={item.updated_at ?? item.created_at ?? undefined}>{when}</time>
              </dd>
            </div>
          )}
        </dl>

        <div className="memory-modal-body">{body}</div>

        <footer className="memory-modal-foot">
          <button
            type="button"
            className="memory-raw-toggle"
            aria-expanded={rawOpen}
            onClick={() => setRawOpen((o) => !o)}
          >
            {rawOpen ? "Hide raw JSON" : "View raw JSON"}
          </button>
          {rawOpen && (
            <pre className="memory-raw-json memory-raw-json--modal">{JSON.stringify(item, null, 2)}</pre>
          )}
        </footer>
      </div>
    </div>
  );
}