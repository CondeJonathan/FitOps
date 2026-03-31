import { useState } from "react";
export default function MemberDashboard({
  user,
  onLogout,
  onOpenAllClasses,
  classes = [],
  onToggleClass,
  memberStatus = "Active",
}) {
  const name = user?.name || "Member";
  const quickClasses = classes.slice(0, 3);
  const premiumPerks = [
    "Unlimited class booking",
    "Monthly trainer assessment",
    "Sauna and recovery zone access",
    "Pool access",
  ];
  const upcomingCharge = { amount: "$49.00", date: "Apr 10", label: "Monthly Membership" };
  const previousCharges = [
    { id: 1, amount: "$49.00", date: "Mar 10", label: "Monthly Membership" },
    { id: 2, amount: "$15.00", date: "Mar 02", label: "Drop-in Class" },
    { id: 3, amount: "$49.00", date: "Feb 10", label: "Monthly Membership" },
  ];

  const [_, setLocalUiState] = useState(0);

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
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e0f2fe" }}>Welcome, {name}</div>
            <div style={{ fontSize: 13, color: "#93c5fd", marginTop: 4 }}>Your gym profile, classes, and billing overview</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                background: "rgba(8, 145, 178, 0.25)",
                color: "#67e8f9",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 10px",
                borderRadius: 999,
              }}
            >
              {memberStatus} Member
            </span>
            <button
              type="button"
              onClick={onLogout}
              style={{
                border: "1px solid #334155",
                background: "rgba(15, 23, 42, 0.85)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                cursor: "pointer",
                color: "#e2e8f0",
                fontWeight: 700,
              }}
            >
              Log out
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Panel title="Membership Perks">
            <div
              style={{
                marginBottom: 10,
                display: "inline-block",
                borderRadius: 999,
                background: "linear-gradient(90deg, #f59e0b, #f97316)",
                color: "#fff7ed",
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              Premium Tier
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {premiumPerks.map((perk) => (
                <li
                  key={perk}
                  style={{
                    ...listItemStyle(),
                    fontFamily: "'Poppins', 'Trebuchet MS', 'Inter', sans-serif",
                    fontSize: 15,
                    letterSpacing: 0.25,
                    color: "#dbeafe",
                    fontWeight: 800,
                  }}
                >
                  {perk}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Join Class / Drop Class">
            <div style={{ display: "grid", gap: 8 }}>
              {quickClasses.map((item) => (
                <div key={item.id} style={listItemStyle(true)}>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 3 }}>{item.schedule}</div>
                    <div style={{ color: "#67e8f9", fontSize: 11, marginTop: 4, fontWeight: 700 }}>
                      Capacity: {item.enrolled}/{item.capacity}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!item.joined && item.enrolled >= item.capacity}
                    onClick={() => {
                      if (typeof onToggleClass === "function") {
                        onToggleClass(item.id);
                      } else {
                        setLocalUiState((v) => v + 1);
                      }
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
            <button
              type="button"
              onClick={() => {
                if (typeof onOpenAllClasses === "function") onOpenAllClasses();
              }}
              style={{
                marginTop: 10,
                width: "100%",
                border: "1px solid #164e63",
                background: "rgba(8, 145, 178, 0.2)",
                color: "#67e8f9",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              View All Classes
            </button>
          </Panel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <Panel title="Payments">
            <div
              style={{
                border: "1px solid #164e63",
                background: "rgba(8, 145, 178, 0.12)",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 12,
              }}
            >
              <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700 }}>Upcoming Charge</div>
              <div style={{ color: "#ecfeff", fontSize: 18, fontWeight: 800, marginTop: 3 }}>{upcomingCharge.amount}</div>
              <div style={{ color: "#bae6fd", fontSize: 12, marginTop: 2 }}>
                {upcomingCharge.label} - {upcomingCharge.date}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 8, fontWeight: 700 }}>Previous Charges</div>
            <div style={{ display: "grid", gap: 8 }}>
              {previousCharges.map((charge) => (
                <div key={charge.id} style={listItemStyle(true)}>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>{charge.label}</div>
                    <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 3 }}>{charge.date}</div>
                  </div>
                  <div style={{ color: "#16a34a", fontSize: 12, fontWeight: 800 }}>{charge.amount}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
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

