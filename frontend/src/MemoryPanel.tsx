import { useState } from "react";
import { MemoryDetailModal } from "./MemoryDetailModal";
import {
  MEMORY_TABS,
  TAB_META,
  type MemoryBucket,
  type MemoryItem,
  type MemoryTab,
  formatRelativeTime,
  memoryTitle,
} from "./memoryShared";

export type { MemoryTab };

function TabIcon({ tab }: { tab: MemoryTab }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  switch (tab) {
    case "semantic":
      return (
        <svg {...common} stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8M12 8v8" strokeLinecap="round" />
        </svg>
      );
    case "episodes":
      return (
        <svg {...common} stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common} stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c1.5-4 6-6 7-6s5.5 2 7 6" strokeLinecap="round" />
        </svg>
      );
    case "procedural":
      return (
        <svg {...common} stroke="currentColor" strokeWidth="2">
          <path d="M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7l8-4z" strokeLinejoin="round" />
        </svg>
      );
  }
}

function MemoryCard({
  item,
  tab,
  index,
  onOpen,
}: {
  item: MemoryItem;
  tab: MemoryTab;
  index: number;
  onOpen: () => void;
}) {
  const when = formatRelativeTime(item.updated_at ?? item.created_at);
  const title = memoryTitle(item, index);

  return (
    <button type="button" className="memory-card memory-card-btn" onClick={onOpen}>
      <header className="memory-card-head">
        <div className="memory-card-title-row">
          <h3 className="memory-card-title">{title}</h3>
          <span className={`memory-type-badge memory-type-badge--${tab}`}>
            {TAB_META[tab].label}
          </span>
        </div>
        {when && (
          <time className="memory-card-time" dateTime={item.updated_at ?? item.created_at ?? undefined}>
            {when}
          </time>
        )}
      </header>
      <p className="memory-card-teaser muted small">Click for full details</p>
    </button>
  );
}

function MemorySkeleton() {
  return (
    <div className="memory-skeleton-list" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="memory-skeleton-card">
          <div className="memory-skeleton-line w-60" />
          <div className="memory-skeleton-line w-full" />
          <div className="memory-skeleton-line w-80" />
        </div>
      ))}
    </div>
  );
}

type MemoryPanelProps = {
  memory: MemoryBucket | null;
  memoryTab: MemoryTab;
  onTabChange: (tab: MemoryTab) => void;
  loading: boolean;
  onRefresh: () => void;
  onCollapse?: () => void;
};

export function MemoryPanel({
  memory,
  memoryTab,
  onTabChange,
  loading,
  onRefresh,
  onCollapse,
}: MemoryPanelProps) {
  const [detail, setDetail] = useState<{ item: MemoryItem; tab: MemoryTab; index: number } | null>(
    null
  );
  const meta = TAB_META[memoryTab];
  const tabItems = (memory?.[memoryTab] as MemoryItem[] | undefined) ?? [];
  const counts = MEMORY_TABS.reduce(
    (acc, t) => {
      acc[t] = ((memory?.[t] as unknown[] | undefined) ?? []).length;
      return acc;
    },
    {} as Record<MemoryTab, number>
  );

  const showSkeleton = loading && !memory;
  const showEmpty = !loading && tabItems.length === 0;

  return (
    <aside className="panel memory-panel">
      <header className="memory-panel-header">
        <div>
          <h2>Memory</h2>
          <p className="muted small memory-panel-subtitle">
            What your agent recalls — facts, episodes, profile, and procedures.
          </p>
        </div>
        <div className="memory-header-actions">
          {onCollapse && (
            <button
              type="button"
              className="btn-ghost icon-btn"
              onClick={onCollapse}
              title="Hide memory"
              aria-label="Hide memory panel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="memory-refresh-btn"
            onClick={onRefresh}
            disabled={loading}
            title="Reload from server"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={loading ? "memory-refresh-spin" : undefined}
              aria-hidden
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
              <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{loading ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>
      </header>

      <div className="memory-segment" role="tablist" aria-label="Memory type">
        {MEMORY_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={memoryTab === tab}
            className={`memory-segment-btn ${memoryTab === tab ? "active" : ""}`}
            onClick={() => onTabChange(tab)}
          >
            <TabIcon tab={tab} />
            <span className="memory-segment-label">{TAB_META[tab].label}</span>
            {counts[tab] > 0 && (
              <span className="memory-segment-count">{counts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      <p className="memory-tab-blurb muted small">{meta.blurb}</p>

      <div className="memory-body" role="tabpanel">
        {showSkeleton && <MemorySkeleton />}
        {!showSkeleton && loading && tabItems.length > 0 && (
          <p className="memory-loading-inline muted small">Updating…</p>
        )}
        {showEmpty && (
          <div className="memory-empty">
            <div className="memory-empty-icon" aria-hidden>
              <TabIcon tab={memoryTab} />
            </div>
            <p className="memory-empty-title">{meta.emptyTitle}</p>
            <p className="memory-empty-hint muted small">{meta.emptyHint}</p>
          </div>
        )}
        {!showSkeleton &&
          tabItems.map((item, i) => (
            <MemoryCard
              key={`${item.key ?? "k"}-${i}`}
              item={item}
              tab={memoryTab}
              index={i}
              onOpen={() => setDetail({ item, tab: memoryTab, index: i })}
            />
          ))}
      </div>

      {detail && (
        <MemoryDetailModal
          item={detail.item}
          tab={detail.tab}
          index={detail.index}
          onClose={() => setDetail(null)}
        />
      )}
    </aside>
  );
}