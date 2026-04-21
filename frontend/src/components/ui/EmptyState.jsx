import React from "react";

export default function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}) {
  const hasDescription = Boolean(description);
  const hasAction = Array.isArray(action) ? action.length > 0 : Boolean(action);

  return (
    <div className="fitopsEmpty">
      <div className="fitopsEmptyIcon" aria-hidden="true">
        ▢
      </div>

      <div>
        <div className="fitopsEmptyTitle">{title}</div>

        {hasDescription ? (
          <div className="fitopsEmptyDesc">{description}</div>
        ) : null}

        {hasAction ? (
          <div className="fitopsEmptyAction">{action}</div>
        ) : null}
      </div>
    </div>
  );
}