import { useMemo, useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function MemberClassesPage({ user, onLogout, onBackToDashboard, classes = [], onToggleClass }) {
  const name = user?.name || "Member";
  const [selectedDate, setSelectedDate] = useState("2026-04-10");
  const classesByDate = useMemo(() => {
    return classes.reduce((acc, item) => {
      if (!item.scheduleDate) return acc;
      if (!acc[item.scheduleDate]) acc[item.scheduleDate] = [];
      acc[item.scheduleDate].push(`${item.name} - ${item.schedule}`);
      return acc;
    }, {});
  }, [classes]);
  const selectedClasses = useMemo(() => classesByDate[selectedDate] || [], [classesByDate, selectedDate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "fixed",
        inset: 0,
        background: "linear-gradient(160deg, #0b1120 0%, #111827 45%, #1f2937 100%)",
        fontFamily: "'Inter', 'Poppins', 'Segoe UI', system-ui, sans-serif",
        padding: 20,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: 1220, margin: "0 auto", display: "grid", gap: 14 }}>
        <div
          style={{
            ...panelStyle(),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#e0f2fe" }}>Class Center - Training Floor</div>
            <div style={{ fontSize: 13, color: "#93c5fd", marginTop: 4 }}>
              {name}, browse sessions by date and reserve your gym training slot.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={onBackToDashboard} style={ghostButtonStyle()}>
              Back to Dashboard
            </button>
            <button type="button" onClick={onLogout} style={ghostButtonStyle()}>
              Log out
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 14 }}>
          <Panel title="All Classes">
            <div style={{ display: "grid", gap: 8 }}>
              {classes.map((item) => (
                <div key={item.id} style={listItemStyle(true)}>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 3 }}>
                      {item.schedule} - {item.level}
                    </div>
                    <div style={{ color: "#67e8f9", fontSize: 11, marginTop: 4, fontWeight: 700 }}>
                      Capacity: {item.enrolled}/{item.capacity}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!item.joined && item.enrolled >= item.capacity}
                    onClick={() => {
                      if (typeof onToggleClass === "function") onToggleClass(item.id);
                    }}
                    style={{
                      border: "none",
                      background: item.joined ? "#ef4444" : item.enrolled >= item.capacity ? "#475569" : "#0891b2",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "8px 12px",
                      fontSize: 12,
                      cursor: !item.joined && item.enrolled >= item.capacity ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      minWidth: 84,
                      opacity: !item.joined && item.enrolled >= item.capacity ? 0.75 : 1,
                    }}
                  >
                    {item.joined ? "Drop" : item.enrolled >= item.capacity ? "Full" : "Join"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Calendar - 2026">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 10 }}>
              {MONTHS.map((month, monthIndex) => (
                <MonthCard
                  key={month}
                  month={month}
                  monthIndex={monthIndex}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  classesByDate={classesByDate}
                />
              ))}
            </div>

            <div style={{ marginTop: 12, ...listItemStyle() }}>
              <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Selected Date: {selectedDate}
              </div>
              {selectedClasses.length ? (
                selectedClasses.map((entry) => (
                  <div key={entry} style={{ color: "#86efac", fontSize: 12, marginTop: 3 }}>
                    {entry}
                  </div>
                ))
              ) : (
                <div style={{ color: "#93c5fd", fontSize: 12 }}>No classes on this date.</div>
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Legend color="#166534" bg="#22c55e33" label="Class Available (clickable)" />
              <Legend color="#ffffff" bg="#0891b2" label="Selected Date" />
              <Legend color="#cbd5e1" bg="#0b1220" label="No Scheduled Class" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MonthCard({ month, monthIndex, selectedDate, onSelectDate, classesByDate }) {
  const year = 2026;
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  return (
    <div style={{ border: "1px solid #334155", borderRadius: 10, padding: 8, background: "#0b1220" }}>
      <div style={{ color: "#e0f2fe", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{month}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={`${month}-${d}`} style={{ textAlign: "center", color: "#64748b", fontSize: 9, fontWeight: 700 }}>
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`${month}-empty-${idx}`} style={{ height: 18 }} />;
          const key = `2026-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasClass = Boolean(classesByDate[key]);
          const isSelected = selectedDate === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              style={{
                height: 20,
                borderRadius: 5,
                border: hasClass ? "1px solid #22c55e" : "1px solid #334155",
                background: isSelected ? "#0891b2" : hasClass ? "rgba(34,197,94,0.2)" : "#0f172a",
                color: isSelected ? "#ffffff" : hasClass ? "#86efac" : "#cbd5e1",
                fontSize: 9,
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={`${month} ${day}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, bg, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: bg,
          border: "1px solid #334155",
          display: "inline-block",
        }}
      />
      <span style={{ color, fontSize: 11, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function panelStyle() {
  return {
    background: "rgba(15, 23, 42, 0.85)",
    border: "1.5px solid #334155",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 12px 28px rgba(2, 6, 23, 0.45)",
  };
}

function Panel({ title, children }) {
  return (
    <div style={panelStyle()}>
      <div style={{ fontWeight: 800, color: "#e0f2fe", fontSize: 14 }}>{title}</div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

function listItemStyle(horizontal) {
  return {
    border: "1px solid #334155",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#0b1220",
    ...(horizontal
      ? { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }
      : {}),
  };
}

function ghostButtonStyle() {
  return {
    border: "1px solid #334155",
    background: "rgba(15, 23, 42, 0.85)",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    cursor: "pointer",
    color: "#e2e8f0",
    fontWeight: 700,
  };
}
