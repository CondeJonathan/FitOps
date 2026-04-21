import React from "react";

export default function HeaderHero({ eyebrow, title, subtitle, actions }) {
  const hasActions =
    Array.isArray(actions) ? actions.length > 0 : Boolean(actions);

  return (
    <header className="fitopsHero">
      <div className="fitopsHeroInner">
        <div>
          {eyebrow && <div className="fitopsEyebrow">{eyebrow}</div>}
          <h1 className="fitopsTitle">{title}</h1>
          {subtitle && <div className="fitopsSubtitle">{subtitle}</div>}
        </div>

        {hasActions && (
          <div className="fitopsHeroActions">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}