import React, { useId, useMemo } from "react";

export default function SectionTabs({
  tabs = [],
  activeTab,
  onTabChange,
  ariaLabel = "Sections",
}) {
  const baseId = useId();

  const validTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (!tab) return false;
      if (!tab.key || !tab.label) return false;
      if (tab.hidden) return false;
      return true;
    });
  }, [tabs]);

  const enabledTabs = useMemo(() => {
    return validTabs.filter((tab) => !tab.disabled);
  }, [validTabs]);

  if (!validTabs.length) return null;

  const resolvedActiveTab = validTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : enabledTabs[0]?.key || validTabs[0]?.key;

  const activeIndex = Math.max(
    0,
    enabledTabs.findIndex((tab) => tab.key === resolvedActiveTab)
  );

  const focusTabAt = (idx) => {
    if (!enabledTabs.length) return;

    const clamped = Math.max(0, Math.min(enabledTabs.length - 1, idx));
    const next = enabledTabs[clamped];
    if (!next?.key) return;

    const el = document.getElementById(`${baseId}-tab-${next.key}`);
    if (el) el.focus();
  };

  return (
    <div className="fitopsTabs" role="tablist" aria-label={ariaLabel}>
      {validTabs.map((tab) => {
        const isSelected = tab.key === resolvedActiveTab;
        const isDisabled = Boolean(tab.disabled);
        const tabId = `${baseId}-tab-${tab.key}`;
        const panelId = `${baseId}-panel-${tab.key}`;
        const enabledIndex = enabledTabs.findIndex((item) => item.key === tab.key);
        const tabIndex = isSelected ? 0 : -1;

        return (
          <button
            key={tab.key}
            id={tabId}
            type="button"
            className="fitopsTab"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            aria-disabled={isDisabled ? "true" : undefined}
            disabled={isDisabled}
            tabIndex={tabIndex}
            onClick={() => {
              if (isDisabled) return;

              if (typeof onTabChange === "function") {
                onTabChange(tab.key);
              }

              if (typeof tab.onClick === "function") {
                tab.onClick();
              }
            }}
            onKeyDown={(e) => {
              if (isDisabled) return;

              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                focusTabAt(activeIndex + 1);
              }

              if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                focusTabAt(activeIndex - 1);
              }

              if (e.key === "Home") {
                e.preventDefault();
                focusTabAt(0);
              }

              if (e.key === "End") {
                e.preventDefault();
                focusTabAt(enabledTabs.length - 1);
              }

              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();

                if (typeof onTabChange === "function") {
                  onTabChange(tab.key);
                }

                if (typeof tab.onClick === "function") {
                  tab.onClick();
                }
              }
            }}
            data-enabled-index={enabledIndex >= 0 ? String(enabledIndex) : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}