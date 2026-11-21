import { useEffect, useId, useState } from "react";

export type ActivityItem = {
  id: string;
  kind: "tool_call" | "tool_result" | "e2b" | "job";
  name?: string;
  detail?: string;
  message?: string;
  enabled?: boolean;
};

type Props = {
  items: ActivityItem[];
  /** When true, new steps auto-expand the panel (in-flight turn). */
  live?: boolean;
};

function chipLabel(item: ActivityItem): string {
  switch (item.kind) {
    case "tool_call":
      return item.name ? `Call · ${item.name}` : "Tool call";
    case "tool_result":
      return item.name ? `Result · ${item.name}` : "Result";
    case "e2b":
      return item.message ?? "E2B";
    case "job":
      return item.message ?? "Background";
    default:
      return "Activity";
  }
}

function activitySummary(count: number): string {
  return count === 1 ? "1 tool step" : `${count} tool steps`;
}

export function ActivityPanel({ items, live = false }: Props) {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (live) setExpanded(true);
  }, [live, items.length]);

  if (!items.length) return null;

  return (
    <section className="activity-panel" aria-label="Agent activity">
      <button
        type="button"
        className="activity-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="activity-toggle-label">Activity</span>
        <span className="activity-toggle-summary muted">{activitySummary(items.length)}</span>
        <svg
          className={`activity-chevron${expanded ? " activity-chevron--open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <ul id={panelId} className="activity-chips">
          {items.map((item) => (
            <li
              key={item.id}
              className={`activity-chip activity-chip--${item.kind}${
                item.kind === "e2b"
                  ? item.enabled === false
                    ? " activity-chip--off"
                    : item.enabled
                      ? " activity-chip--on"
                      : ""
                  : ""
              }`}
            >
              <span className="activity-chip-kind" aria-hidden="true">
                {item.kind === "tool_call" && "⚡"}
                {item.kind === "tool_result" && "✓"}
                {item.kind === "e2b" && "◉"}
                {item.kind === "job" && "↻"}
              </span>
              <span className="activity-chip-text">{chipLabel(item)}</span>
              {item.detail && (
                <span className="activity-chip-detail" title={item.detail}>
                  {item.detail.length > 48 ? `${item.detail.slice(0, 48)}…` : item.detail}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}