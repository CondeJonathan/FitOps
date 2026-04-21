import React from "react";

export default function ContentPanel({
  title,
  subtitle,
  action,
  children,
  footer,
}) {
  const hasHeader = Boolean(title || subtitle || action);
  const hasAction = Array.isArray(action) ? action.length > 0 : Boolean(action);
  const hasFooter = Array.isArray(footer) ? footer.length > 0 : Boolean(footer);

  return (
    <section className="fitopsPanel">
      {hasHeader ? (
        <div className="fitopsPanelHeader">
          <div>
            {title ? <h2 className="fitopsPanelTitle">{title}</h2> : null}
            {subtitle ? <div className="fitopsPanelSubtitle">{subtitle}</div> : null}
          </div>

          {hasAction ? <div>{action}</div> : null}
        </div>
      ) : null}

      <div className="fitopsPanelBody">{children}</div>

      {hasFooter ? <div style={{ padding: "0 20px 18px" }}>{footer}</div> : null}
    </section>
  );
}