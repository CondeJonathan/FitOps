import { useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import SummaryCard from "../../components/ui/SummaryCard.jsx";
import ContentPanel from "../../components/ui/ContentPanel.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useMemberClassesSection } from "../member-classes/MemberClassesSection.jsx";
import { memberNavGroups } from "../../navigation/navConfig.js";

const SUPPORT_EMAIL = "support@fitops.com";

export default function MemberDashboard({
  user,
  onLogout,
  onOpenAllClasses,
  classes = [],
  onToggleClass,
  memberStatus = "Active",
  perks = [],
  upcomingCharge: upcomingChargeProp = null,
  previousCharges: previousChargesProp = null,
}) {
  const name = user?.name || "Member";
  const [activeNav, setActiveNav] = useState("dashboard");

  const quickClasses = classes.slice(0, 3);
  const joinedClasses = useMemo(() => classes.filter((item) => item.joined), [classes]);
  const upcomingJoined = useMemo(() => joinedClasses.slice(0, 4), [joinedClasses]);

  const demoPerks = [
    "Unlimited class booking",
    "Monthly trainer assessment",
    "Sauna and recovery zone access",
    "Pool access",
  ];

  const displayPerks = Array.isArray(perks) && perks.length ? perks : demoPerks;

  const demoUpcomingCharge = {
    amount: "$49.00",
    date: "Apr 10",
    label: "Monthly Membership",
  };

  const demoPreviousCharges = [
    { id: 1, amount: "$49.00", date: "Mar 10", label: "Monthly Membership" },
    { id: 2, amount: "$15.00", date: "Mar 02", label: "Drop-in Class" },
    { id: 3, amount: "$49.00", date: "Feb 10", label: "Monthly Membership" },
  ];

  const upcomingCharge = upcomingChargeProp || demoUpcomingCharge;
  const previousCharges = Array.isArray(previousChargesProp) ? previousChargesProp : demoPreviousCharges;

  const joinedCount = useMemo(() => classes.filter((item) => item.joined).length, [classes]);
  const availableCount = useMemo(
    () => classes.filter((item) => item.enrolled < item.capacity).length,
    [classes]
  );

  const classesSection = useMemberClassesSection({
    classes,
    onToggleClass,
    userName: name,
  });

  const paymentSummary = useMemo(() => {
    const rows = Array.isArray(previousCharges) ? previousCharges : [];
    const latest = rows[0] || null;
    const lastTwo = rows.slice(0, 2);
    return { latest, lastTwo };
  }, [previousCharges]);

  const summaryCards = (
    <>
      <SummaryCard
        title="Membership"
        metric={memberStatus}
        helper="Current status"
        tone={memberStatus === "Active" ? "success" : "warning"}
      />
      <SummaryCard
        title="Joined"
        metric={joinedCount}
        helper="Booked classes"
        tone="info"
      />
      <SummaryCard
        title="Available classes"
        metric={availableCount}
        helper="Open seats"
        tone="warning"
      />
      <SummaryCard
        title="Next charge"
        metric={upcomingCharge?.amount || "—"}
        helper={upcomingCharge?.date || "—"}
        tone="info"
      />
    </>
  );

  const dashboardSide = (
    <>
      <ContentPanel
        title="Membership perks"
        subtitle="A quick look at your current plan"
        action={<span className="fitopsPill" data-tone="warning">Premium tier</span>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {displayPerks.slice(0, 4).map((perk) => (
            <div key={perk} style={listItemStyle()}>
              <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>
                {perk}
              </div>
            </div>
          ))}
        </div>
      </ContentPanel>

      <ContentPanel title="Payments preview" subtitle="Upcoming and recent activity">
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ ...listItemStyle(), borderLeft: "3px solid rgba(20,108,99,0.55)" }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>
              Upcoming charge
            </div>
            <div style={{ color: "var(--text-strong)", fontSize: 22, fontWeight: 950, marginTop: 4 }}>
              {upcomingCharge?.amount || "—"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
              {upcomingCharge?.label ? `${upcomingCharge.label} — ` : ""}
              {upcomingCharge?.date || "—"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 900 }}>
              Recent charges
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {previousCharges.slice(0, 3).map((charge) => (
                <div
                  key={charge.id}
                  style={{
                    ...listItemStyle(),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>
                      {charge.label}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                      {charge.date}
                    </div>
                  </div>
                  <div style={{ color: "var(--status-success-text)", fontSize: 12, fontWeight: 950 }}>
                    {charge.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContentPanel>
    </>
  );

  const dashboardMain = (
    <div style={{ display: "grid", gap: 16 }}>
      <ContentPanel
        title="Today’s snapshot"
        subtitle="Your next sessions, recent activity, and quick actions."
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span className="fitopsPill" data-tone={memberStatus === "Active" ? "success" : "warning"}>
              {memberStatus === "Active" ? "Active membership" : memberStatus}
            </span>
            <span className="fitopsPill" data-tone="info">
              {joinedCount} booked
            </span>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr", gap: 14, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 950, color: "var(--text-strong)" }}>Next up</div>
              <button
                type="button"
                className="fitopsBtn"
                style={{ padding: "8px 10px" }}
                onClick={() => {
                  if (typeof onOpenAllClasses === "function") onOpenAllClasses();
                  setActiveNav("classes");
                }}
              >
                Browse classes
              </button>
            </div>

            {upcomingJoined.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {upcomingJoined.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...listItemStyle(),
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>
                        {item.name}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                        {item.schedule}
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="fitopsPill" data-tone="success">Joined</span>
                        {item.room ? (
                          <span className="fitopsPill" data-tone="info">{item.room}</span>
                        ) : null}
                        {item.trainer ? (
                          <span className="fitopsPill" data-tone="info">{`Coach ${item.trainer}`}</span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleClass?.(item.id)}
                      className="fitopsBtn"
                      style={{
                        border: "none",
                        background: "var(--status-danger-text)",
                        color: "#fff",
                        minWidth: 86,
                      }}
                    >
                      Drop
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={listItemStyle()}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>
                  No bookings yet
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                  Join a class to build your weekly plan. Use the calendar in the Classes tab to schedule ahead.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950, color: "var(--text-strong)" }}>Recent activity</div>

            <div style={{ display: "grid", gap: 8 }}>
              <ActivityRow
                tone="info"
                label="Upcoming charge"
                detail={`${upcomingCharge?.amount || "—"} • ${upcomingCharge?.date || "—"}`}
              />
              {paymentSummary.latest ? (
                <ActivityRow
                  tone="success"
                  label="Last payment"
                  detail={`${paymentSummary.latest.amount} • ${paymentSummary.latest.date} • ${paymentSummary.latest.label}`}
                />
              ) : (
                <ActivityRow
                  tone="warning"
                  label="Payment history"
                  detail="No recent charges on record."
                />
              )}
              <ActivityRow
                tone={joinedCount ? "success" : "info"}
                label="Classes this cycle"
                detail={joinedCount ? `${joinedCount} booked sessions` : "Join a session to start tracking attendance."}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 2 }}>
              <button
                type="button"
                className="fitopsBtn"
                onClick={() => setActiveNav("payments")}
              >
                View billing
              </button>
              <button
                type="button"
                className="fitopsBtn"
                onClick={() => setActiveNav("membership")}
              >
                View membership
              </button>
            </div>
          </div>
        </div>
      </ContentPanel>

      <ContentPanel
        title="Quick class actions"
        subtitle="Join, drop, and keep an eye on capacity."
        action={<span className="fitopsPill" data-tone="info">{quickClasses.length} showing</span>}
      >
        {quickClasses.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {quickClasses.map((item) => {
              const fillPercent = Math.min(
                100,
                Math.round((item.enrolled / Math.max(1, item.capacity)) * 100)
              );
              const isFull = item.enrolled >= item.capacity;
              const tone = item.joined ? "success" : isFull ? "warning" : "info";

              return (
                <div key={item.id} style={listItemStyle()}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div>
                      <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>
                        {item.name}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                        {item.schedule}
                      </div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="fitopsPill" data-tone={tone}>
                          {item.joined ? "Joined" : isFull ? "Full" : "Open"}
                        </span>
                        {item.room ? (
                          <span className="fitopsPill" data-tone="info">{item.room}</span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!item.joined && isFull}
                      onClick={() => onToggleClass?.(item.id)}
                      className="fitopsBtn"
                      style={{
                        border: "none",
                        background: item.joined
                          ? "var(--status-danger-text)"
                          : isFull
                            ? "rgba(31,42,39,0.36)"
                            : "var(--brand)",
                        color: "#fff",
                        cursor: !item.joined && isFull ? "not-allowed" : "pointer",
                        minWidth: 84,
                        opacity: !item.joined && isFull ? 0.8 : 1,
                      }}
                    >
                      {item.joined ? "Drop" : isFull ? "Full" : "Join"}
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Capacity</div>
                    <span className="fitopsPill" data-tone={isFull ? "warning" : "success"}>
                      {item.enrolled}/{item.capacity}
                    </span>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ height: 6, borderRadius: 999, background: "rgba(31,42,39,0.10)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: 6,
                          width: `${fillPercent}%`,
                          background: isFull ? "var(--accent-warm)" : "var(--brand)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No classes to preview"
            description="Open the Classes tab to browse all available sessions."
          />
        )}
      </ContentPanel>
    </div>
  );

  const membershipMain = (
    <ContentPanel title="Membership" subtitle="Status and plan benefits">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={listItemStyle()}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>
            Current status
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="fitopsPill" data-tone={memberStatus === "Active" ? "success" : "warning"}>
              {memberStatus}
            </span>
            <span className="fitopsPill" data-tone="info">
              {joinedCount} joined classes
            </span>
          </div>
        </div>

        <ContentPanel title="Perks" subtitle="Included with your plan">
          <div style={{ display: "grid", gap: 10 }}>
            {displayPerks.map((perk) => (
              <div key={perk} style={listItemStyle()}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>
                  {perk}
                </div>
              </div>
            ))}
          </div>
        </ContentPanel>

        <ContentPanel title="Plan details" subtitle="What to expect each billing cycle">
          <div style={{ display: "grid", gap: 10 }}>
            <div style={listItemStyle()}>
              <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Tier</div>
              <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="fitopsPill" data-tone="warning">Premium</span>
                <span className="fitopsPill" data-tone="info">Auto-renews monthly</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
                Renewal aligns with your upcoming charge. You can manage billing in the Payments tab.
              </div>
            </div>
            <div style={listItemStyle()}>
              <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Freeze policy</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                Freeze up to 14 days per cycle. While frozen, class bookings are paused but your spot history is preserved.
              </div>
            </div>
          </div>
        </ContentPanel>
      </div>
    </ContentPanel>
  );

  const paymentsMain = (
    <ContentPanel title="Payments" subtitle="Billing and payment history">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ ...listItemStyle(), borderLeft: "3px solid rgba(20,108,99,0.55)" }}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>
            Upcoming charge
          </div>
          <div style={{ color: "var(--text-strong)", fontSize: 24, fontWeight: 950, marginTop: 4 }}>
            {upcomingCharge?.amount || "—"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
            {upcomingCharge?.label ? `${upcomingCharge.label} — ` : ""}
            {upcomingCharge?.date || "—"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, fontWeight: 900 }}>
            Billing history
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {previousCharges.map((charge) => (
              <div
                key={charge.id}
                style={{
                  ...listItemStyle(),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>
                    {charge.label}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                    {charge.date}
                  </div>
                </div>
                <div style={{ color: "var(--status-success-text)", fontSize: 12, fontWeight: 950 }}>
                  {charge.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  );

  const profileMain = (
    <ContentPanel title="Profile" subtitle="Account details">
      <div style={{ display: "grid", gap: 12 }}>
        <div style={listItemStyle()}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Name</div>
          <div style={{ color: "var(--text-strong)", fontSize: 14, fontWeight: 950, marginTop: 4 }}>
            {user?.name || "—"}
          </div>
        </div>

        <div style={listItemStyle()}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Email</div>
          <div style={{ color: "var(--text-strong)", fontSize: 14, fontWeight: 950, marginTop: 4 }}>
            {user?.email || "—"}
          </div>
          {user?.email ? (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="fitopsBtn"
                onClick={() => copyToClipboard(user.email)}
              >
                Copy email
              </button>
            </div>
          ) : null}
        </div>

        <div style={listItemStyle()}>
          <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Role</div>
          <div style={{ marginTop: 8 }}>
            <span className="fitopsPill" data-tone="info">Member</span>
          </div>
        </div>
      </div>
    </ContentPanel>
  );

  const helpMain = (
    <div style={{ display: "grid", gap: 16 }}>
      <ContentPanel
        title="Help & FAQ"
        subtitle="Clear answers and quick next steps."
        action={
          <button type="button" className="fitopsBtn" onClick={() => copyToClipboard(SUPPORT_EMAIL)}>
            Copy support email
          </button>
        }
      >
        <div style={{ display: "grid", gap: 10 }}>
          <FaqRow
            q="How do I book or drop a class?"
            a="Open the Classes tab, pick a date from the calendar, then use Join/Drop on any session. Your bookings will appear under “My classes”."
          />
          <FaqRow
            q="Why does a class show as Full?"
            a="Full means the session has reached capacity. In this demo, Full sessions cannot be joined, but you can still view the schedule and roster summary."
          />
          <FaqRow
            q="Where can I see upcoming charges and payment history?"
            a="Open the Payments tab to review upcoming charges and the full billing history list."
          />
          <FaqRow
            q="What’s included with Premium?"
            a="Premium includes unlimited bookings, recovery zone access, and a monthly trainer assessment. See Membership for the full perk list."
          />
          <div style={listItemStyle()}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Support</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
              Email: <span style={{ color: "var(--text-strong)", fontWeight: 950 }}>{SUPPORT_EMAIL}</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
              Response target: within 1 business day (demo policy).
            </div>
          </div>
        </div>
      </ContentPanel>
    </div>
  );

  const sectionMap = {
    dashboard: {
      title: "Member Dashboard",
      subtitle: `${name}, here’s an at-a-glance view of your week.`,
      main: dashboardMain,
      side: dashboardSide,
      summary: summaryCards,
    },
    classes: {
      title: "Classes",
      subtitle: "Browse available sessions and manage your bookings.",
      main: classesSection.main,
      side: classesSection.side,
      summary: classesSection.summary,
    },
    membership: {
      title: "Membership",
      subtitle: "Your membership status and benefits.",
      main: membershipMain,
      side: null,
      summary: null,
    },
    payments: {
      title: "Payments",
      subtitle: "Billing and payment history.",
      main: paymentsMain,
      side: null,
      summary: null,
    },
    profile: {
      title: "Profile",
      subtitle: "Account details and preferences.",
      main: profileMain,
      side: null,
      summary: null,
    },
    help: {
      title: "Help / FAQ",
      subtitle: "Answers, policies, and support contact information.",
      main: helpMain,
      side: null,
      summary: null,
    },
  };

  const currentSection = sectionMap[activeNav] || sectionMap.dashboard;

  return (
    <DashboardLayout
      role="member"
      userName={name}
      eyebrow="Member portal"
      title={currentSection.title}
      subtitle={currentSection.subtitle}
      navGroups={memberNavGroups}
      activeNavKey={activeNav}
      onNavigate={(key) => {
        if (!key) return;
        setActiveNav(key);
        if (key === "classes" && typeof onOpenAllClasses === "function") {
          onOpenAllClasses();
        }
      }}
      actions={[
        {
          key: "logout",
          label: "Log out",
          primary: true,
          onClick: onLogout,
        },
      ]}
      summaryCards={currentSection.summary}
      sideContent={currentSection.side}
    >
      {currentSection.main}
    </DashboardLayout>
  );
}

function listItemStyle() {
  return {
    background: "var(--surface-alt)",
    border: "1px solid rgba(31,42,39,0.10)",
    borderRadius: "var(--radius-md)",
    padding: "12px 14px",
    transition: "all var(--fast) var(--ease)",
  };
}

function ActivityRow({ tone = "info", label, detail }) {
  return (
    <div style={listItemStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>{label}</div>
        <span className="fitopsPill" data-tone={tone}>
          {tone === "success" ? "Healthy" : tone === "warning" ? "Attention" : tone === "danger" ? "Urgent" : "Info"}
        </span>
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>{detail}</div>
    </div>
  );
}

function FaqRow({ q, a }) {
  return (
    <div style={listItemStyle()}>
      <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>{q}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>{a}</div>
    </div>
  );
}

async function copyToClipboard(text) {
  const value = String(text || "").trim();
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}