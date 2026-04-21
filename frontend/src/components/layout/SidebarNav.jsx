import React, { useMemo } from "react";

export default function SidebarNav({
  role,
  userName,
  navGroups = [],
  activeNavKey,
  onNavigate,
  footerActions,
}) {
  const validGroups = useMemo(() => {
    return navGroups
      .map((group) => {
        const validItems = (group?.items || []).filter((item) => {
          if (!item) return false;
          if (!item.label) return false;
          if (item.hidden) return false;

          const hasNavigation = Boolean(item.key) || typeof item.onClick === "function";
          if (!hasNavigation) return false;

          return true;
        });

        if (!validItems.length) return null;

        return {
          ...group,
          items: validItems,
        };
      })
      .filter(Boolean);
  }, [navGroups]);

  const hasFooterActions = Array.isArray(footerActions)
    ? footerActions.length > 0
    : Boolean(footerActions);

  return (
    <aside className="fitopsSidebar" aria-label="Primary">
      <div className="fitopsBrand">
        <div className="fitopsMark" aria-hidden="true">
          FO
        </div>
        <div>
          <div className="fitopsBrandName">FitOps</div>
          <div className="fitopsBrandTagline">Premium service portal</div>
        </div>
      </div>

      {validGroups.map((group) => (
        <div key={group.key || group.title} className="fitopsNavGroup">
          {group.title ? <div className="fitopsNavGroupTitle">{group.title}</div> : null}

          <div style={{ display: "grid", gap: 6 }}>
            {group.items.map((item) => {
              const isActive = Boolean(item.key) && item.key === activeNavKey;
              const isDisabled = Boolean(item.disabled);

              return (
                <button
                  key={item.key || item.label}
                  type="button"
                  className="fitopsNavItem"
                  aria-current={isActive ? "page" : undefined}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;

                    if (typeof onNavigate === "function" && item.key) {
                      onNavigate(item.key);
                    }

                    if (typeof item.onClick === "function") {
                      item.onClick();
                    }
                  }}
                >
                  <span aria-hidden="true" style={{ opacity: 0.9 }}>
                    {item.icon || "•"}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="fitopsSidebarFooter" aria-label="Account">
        <div className="fitopsSidebarFooterRow">
          <span style={{ fontWeight: 800, color: "rgba(251, 250, 247, 0.92)" }}>
            {userName || (role === "staff" ? "Staff" : "Member")}
          </span>
          <span className="fitopsSidebarPill">
            {role === "staff" ? "Staff" : "Member"}
          </span>
        </div>

        {hasFooterActions ? (
          <div style={{ display: "grid", gap: 8 }}>{footerActions}</div>
        ) : null}
      </div>
    </aside>
  );
}