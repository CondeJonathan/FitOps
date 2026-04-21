import { useMemo, useState } from "react";
import ContentPanel from "../../components/ui/ContentPanel.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import SectionTabs from "../../components/ui/SectionTabs.jsx";
import SummaryCard from "../../components/ui/SummaryCard.jsx";

export function useMemberClassesSection({
  classes = [],
  onToggleClass,
  userName = "Member",
}) {
  const [activeTab, setActiveTab] = useState("available");
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [dateFilterEnabled, setDateFilterEnabled] = useState(true);
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));

  const joined = useMemo(() => classes.filter((c) => c.joined), [classes]);
  const available = useMemo(() => classes.filter((c) => c.enrolled < c.capacity), [classes]);
  const full = useMemo(() => classes.filter((c) => c.enrolled >= c.capacity), [classes]);

  const selectedDateLabel = useMemo(() => formatISODateLabel(selectedDate), [selectedDate]);

  const tabs = useMemo(() => {
    const base = [{ key: "available", label: "Available classes" }];
    if (joined.length) base.push({ key: "mine", label: "My classes" });
    return base;
  }, [joined.length]);

  const baseRows = useMemo(() => {
    switch (activeTab) {
      case "mine":
        return joined;
      default:
        return available;
    }
  }, [activeTab, joined, available]);

  const visibleRows = useMemo(() => {
    if (!dateFilterEnabled) return baseRows;
    return baseRows.filter((row) => (row.scheduleDate || "") === selectedDate);
  }, [baseRows, dateFilterEnabled, selectedDate]);

  const classesByDate = useMemo(() => {
    const map = new Map();
    for (const item of classes) {
      const key = item.scheduleDate;
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [classes]);

  const selectedDayAllClasses = useMemo(() => classesByDate.get(selectedDate) || [], [classesByDate, selectedDate]);
  const calendarDays = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

  const calendarMeta = useMemo(() => {
    const label = monthAnchor.toLocaleString(undefined, { month: "long", year: "numeric" });
    const hasAnyInMonth = calendarDays.some((d) => d.inMonth && (classesByDate.get(d.iso) || []).length > 0);
    return { label, hasAnyInMonth };
  }, [calendarDays, classesByDate, monthAnchor]);

  const handlePickDate = (iso) => {
    setSelectedDate(iso);
    setDateFilterEnabled(true);
  };

  const jumpToToday = () => {
    const today = new Date();
    setMonthAnchor(startOfMonth(today));
    setSelectedDate(toISODate(today));
    setDateFilterEnabled(true);
  };

  const summary = (
    <>
      <SummaryCard title="Joined" metric={joined.length} helper="Your bookings" tone="success" />
      <SummaryCard title="Available" metric={available.length} helper="Open seats" tone="info" />
      <SummaryCard title="Full" metric={full.length} helper="Waitlist soon" tone="warning" />
    </>
  );

  return {
    summary,

    main: (
      <ContentPanel
        title="Browse classes"
        subtitle={
          dateFilterEnabled
            ? `Showing ${activeTab === "mine" ? "your bookings" : "available classes"} on ${selectedDateLabel}.`
            : `Showing ${activeTab === "mine" ? "your bookings" : "available classes"} for all dates.`
        }
        action={
          tabs.length > 1 ? (
            <SectionTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          ) : null
        }
      >
        {visibleRows.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {visibleRows.map((item) => {
              const isFull = item.enrolled >= item.capacity;
              const tone = item.joined ? "success" : isFull ? "warning" : "info";

              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid rgba(31,42,39,0.10)",
                    borderRadius: 18,
                    padding: 14,
                    background: "var(--surface-alt)",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 950, color: "var(--text-strong)" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.schedule}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                        <span className="fitopsPill" data-tone={tone}>
                          {item.room || "Studio"}
                        </span>
                        <span className="fitopsPill" data-tone="info" style={{ marginLeft: 8 }}>
                          {item.trainer ? `Coach ${item.trainer}` : "Coach"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!item.joined && isFull}
                      onClick={() => onToggleClass?.(item.id)}
                      className="fitopsBtn"
                    >
                      {item.joined ? "Drop" : isFull ? "Full" : "Join"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={
              activeTab === "mine"
                ? dateFilterEnabled
                  ? "No bookings on this date"
                  : "No bookings yet"
                : dateFilterEnabled
                  ? "No available classes on this date"
                  : "No available classes"
            }
            description={
              activeTab === "mine"
                ? `${userName}, join a class to see it here.`
                : "Try another date or clear the date filter."
            }
          />
        )}
      </ContentPanel>
    ),

    side: (
      <ContentPanel
        title="Calendar"
        subtitle="Pick a date to filter classes."
        action={
          <button type="button" className="fitopsBtn" onClick={jumpToToday} style={{ padding: "8px 10px" }}>
            Today
          </button>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <button
              type="button"
              className="fitopsBtn"
              onClick={() => setMonthAnchor((prev) => addMonths(prev, -1))}
              style={{ padding: "8px 10px" }}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div style={{ fontWeight: 950, color: "var(--text-strong)", fontSize: 13 }}>{calendarMeta.label}</div>
            <button
              type="button"
              className="fitopsBtn"
              onClick={() => setMonthAnchor((prev) => addMonths(prev, 1))}
              style={{ padding: "8px 10px" }}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((label) => (
              <div
                key={label}
                style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", fontWeight: 900 }}
              >
                {label}
              </div>
            ))}

            {calendarDays.map((day) => {
              const count = (classesByDate.get(day.iso) || []).length;
              const isSelected = day.iso === selectedDate;
              const isDim = !day.inMonth;

              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => handlePickDate(day.iso)}
                  className="fitopsBtn"
                  aria-label={`Select ${day.iso}`}
                  style={{
                    padding: 0,
                    height: 36,
                    borderRadius: 12,
                    border: isSelected ? "1px solid rgba(20,108,99,0.55)" : "1px solid rgba(31,42,39,0.10)",
                    background: isSelected ? "rgba(20,108,99,0.10)" : "var(--surface-alt)",
                    color: isDim ? "rgba(88,102,98,0.75)" : "var(--text-strong)",
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 12 }}>{day.day}</span>
                  {count > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        height: 8,
                        width: 8,
                        borderRadius: 999,
                        background: "var(--brand)",
                        opacity: isDim ? 0.35 : 1,
                      }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(31,42,39,0.10)",
              paddingTop: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 950, color: "var(--text-strong)", fontSize: 13 }}>{selectedDateLabel}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  {selectedDayAllClasses.length
                    ? `${selectedDayAllClasses.length} class${selectedDayAllClasses.length === 1 ? "" : "es"} scheduled`
                    : calendarMeta.hasAnyInMonth
                      ? "No classes scheduled on this day"
                      : "No classes scheduled this month"}
                </div>
              </div>

              <button
                type="button"
                className="fitopsBtn"
                onClick={() => setDateFilterEnabled((prev) => !prev)}
                style={{ padding: "8px 10px" }}
              >
                {dateFilterEnabled ? "Show all" : "Filter date"}
              </button>
            </div>

            {selectedDayAllClasses.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {selectedDayAllClasses.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid rgba(31,42,39,0.10)",
                      borderRadius: 14,
                      padding: 10,
                      background: "var(--surface-alt)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 950, fontSize: 13, color: "var(--text-strong)" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{item.schedule}</div>
                    </div>
                    <span className="fitopsPill" data-tone={item.joined ? "success" : "info"}>
                      {item.joined ? "Joined" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </ContentPanel>
    ),
  };
}

function toISODate(value) {
  const d = value instanceof Date ? value : new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(date, delta) {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function buildMonthGrid(monthAnchor) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();

  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - startDow);

  const out = [];
  for (let i = 0; i < 42; i += 1) {
    const current = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    out.push({
      iso: toISODate(current),
      day: current.getDate(),
      inMonth: current.getMonth() === month,
    });
  }
  return out;
}

function formatISODateLabel(iso) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  if (!year || !month || !day) return iso;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}