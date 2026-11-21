import { useEffect, useId, useRef } from "react";
import { MessageContent } from "./MessageContent";

type CompactedHistoryModalProps = {
  summary: string;
  threadTitle: string;
  onClose: () => void;
};

export function CompactedHistoryModal({
  summary,
  threadTitle,
  onClose,
}: CompactedHistoryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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

  return (
    <div className="memory-modal-root" onClick={onClose}>
      <div
        ref={dialogRef}
        className="memory-modal compacted-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="memory-modal-head">
          <h2 id={titleId} className="memory-modal-title">
            Compacted history
          </h2>
          <button
            type="button"
            className="btn-ghost icon-btn memory-modal-close"
            onClick={onClose}
            aria-label="Close compacted history"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <p className="compacted-history-caption muted">
          Summarized checkpoint for <strong>{threadTitle}</strong>. Recent messages in chat are
          unchanged; older turns live here for the model.
        </p>
        <div className="memory-modal-body compacted-history-body">
          <MessageContent content={summary} role="assistant" />
        </div>
        <footer className="memory-modal-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}