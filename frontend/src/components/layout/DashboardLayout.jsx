import React, { useMemo, useState } from "react";
import SidebarNav from "./SidebarNav.jsx";
import HeaderHero from "./HeaderHero.jsx";

export default function DashboardLayout({
  role,
  userName,
  eyebrow,
  title,
  subtitle,
  navGroups,
  activeNavKey,
  onNavigate,
  actions = [],
  summaryCards,
  children,
  sideContent,
  headerExtras,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const validActions = useMemo(() => {
    return actions.filter((action) => {
      if (!action) return false;
      if (typeof action.render === "function") return true;
      if (typeof action.onClick === "function" && action.label) return true;
      return false;
    });
  }, [actions]);

  const footerActions = useMemo(() => {
    if (!validActions.length) return null;

    return validActions.map((action, idx) => (
      <div key={action.key || idx}>
        {typeof action.render === "function" ? (
          action.render({ variant: "sidebar" })
        ) : (
          <button
            type="button"
            className={`fitopsBtn ${action.primary ? "fitopsBtnPrimary" : ""}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    ));
  }, [validActions]);

  const heroActions = useMemo(() => {
    if (!validActions.length) return null;

    return validActions.map((action, idx) => (
      <span key={action.key || idx}>
        {typeof action.render === "function" ? (
          action.render({ variant: "hero" })
        ) : (
          <button
            type="button"
            className={`fitopsBtn fitopsBtnOnHero ${action.primary ? "fitopsBtnPrimary" : ""}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </span>
    ));
  }, [validActions]);

  return (
    <div className="fitopsApp">
      <div className="fitopsMobileTopbar">
        <div className="fitopsMobileTopbarRow">
          <button
            type="button"
            className="fitopsIconBtn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? "Close" : "Menu"}
          </button>

          <div style={{ fontWeight: 900, letterSpacing: -0.3, color: "var(--text-strong)" }}>
            FitOps
          </div>

          <div style={{ width: 72 }} />
        </div>
      </div>

      <div className="fitopsShell" data-sidebar-open={sidebarOpen ? "true" : "false"}>
        <SidebarNav
          role={role}
          userName={userName}
          navGroups={navGroups}
          activeNavKey={activeNavKey}
          onNavigate={(key) => {
            setSidebarOpen(false);
            if (typeof onNavigate === "function") onNavigate(key);
          }}
          footerActions={footerActions}
        />

        <main className="fitopsMain">
          <HeaderHero eyebrow={eyebrow} title={title} subtitle={subtitle} actions={heroActions} />
          {headerExtras ? <div style={{ marginTop: 12 }}>{headerExtras}</div> : null}
          {summaryCards ? <div className="fitopsSummaryRow">{summaryCards}</div> : null}

          <div className="fitopsGrid">
            <div style={{ display: "grid", gap: 16 }}>{children}</div>
            {sideContent ? <div style={{ display: "grid", gap: 16 }}>{sideContent}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}