import React from "react";

export default function SummaryCard({ title, metric, helper, tone = "info" }) {
  const hasTitle = Boolean(title);
  const hasMetric = metric !== undefined && metric !== null;
  const hasHelper = Boolean(helper);

  if (!hasTitle && !hasMetric) return null;

  return (
    <div className="fitopsSummaryCard">
      {hasTitle ? (
        <div className="fitopsSummaryTitle">{title}</div>
      ) : null}

      {hasMetric ? (
        <div className="fitopsSummaryMetric">{metric}</div>
      ) : null}

      {hasHelper ? (
        <div className="fitopsSummaryHelper">
          <span className="fitopsPill" data-tone={tone}>
            {helper}
          </span>
        </div>
      ) : null}
    </div>
  );
}