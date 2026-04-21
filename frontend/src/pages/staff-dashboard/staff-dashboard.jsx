import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout.jsx";
import SummaryCard from "../../components/ui/SummaryCard.jsx";
import ContentPanel from "../../components/ui/ContentPanel.jsx";
import { API_BASE } from "../../api/config.js";
import { staffNavGroups } from "../../navigation/navConfig.js";

export default function StaffDashboard({ user, onLogout }) {
  const name = user?.name || "Staff";
  const [activeNav, setActiveNav] = useState("dashboard");
  const [staffClasses, setStaffClasses] = useState([]);
  const [staffSchedule, setStaffSchedule] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [membershipSummary, setMembershipSummary] = useState({ activeCount: 0, inactiveCount: 0, totalCount: 0 });
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState(() => new Map());
  const [ticketForm, setTicketForm] = useState({
    equipment: "",
    location: "",
    issue: "",
    priority: "Medium",
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    date: "2026-03-31",
    task: "",
    status: "Pending",
    area: "Facility",
  });
  const [maintenanceDateFilterEnabled, setMaintenanceDateFilterEnabled] = useState(true);
  const [maintenanceSelectedDate, setMaintenanceSelectedDate] = useState("2026-03-31");
  const [maintenanceMonthAnchor, setMaintenanceMonthAnchor] = useState(() => startOfMonth(new Date("2026-03-31")));

  const openTickets = useMemo(() => tickets.filter((item) => item.status !== "Closed").length, [tickets]);
  const pendingMaintenance = useMemo(
    () => maintenanceLog.filter((entry) => entry.status !== "Done").length,
    [maintenanceLog],
  );
  const urgentTickets = useMemo(() => {
    const open = tickets.filter((t) => t.status !== "Closed");
    const sorted = [...open].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
    return sorted.slice(0, 5);
  }, [tickets]);
  const urgentMaintenance = useMemo(() => {
    const rows = maintenanceLog.filter((entry) => entry.status !== "Done");
    return rows.slice(0, 4);
  }, [maintenanceLog]);
  const filteredMemberships = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return memberships;
    return memberships.filter((member) => {
      return (
        String(member.name || "").toLowerCase().includes(query) ||
        String(member.displayId || "").toLowerCase().includes(query) ||
        String(member.id || "").toLowerCase().includes(query)
      );
    });
  }, [memberships, memberSearch]);
  const selectedMember = useMemo(
    () => memberships.find((member) => member.id === selectedMemberId) || filteredMemberships[0] || null,
    [memberships, filteredMemberships, selectedMemberId],
  );
  const selectedClass = useMemo(() => {
    const fallback = staffClasses[0] || null;
    if (selectedClassId === null || selectedClassId === undefined) return fallback;
    return staffClasses.find((c) => String(c.id) === String(selectedClassId)) || fallback;
  }, [staffClasses, selectedClassId]);

  const loadDashboard = () => {
    fetch(`${API_BASE}/api/staff/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;
        setStaffClasses(Array.isArray(data.classes) ? data.classes : []);
        setStaffSchedule(Array.isArray(data.schedule) ? data.schedule : []);
        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
        setMaintenanceLog(Array.isArray(data.maintenance) ? data.maintenance : []);
        const membershipRows = Array.isArray(data.memberships) ? data.memberships : [];
        setMemberships(membershipRows);
        setMembershipSummary(
          data.membershipSummary || { activeCount: 0, inactiveCount: 0, totalCount: membershipRows.length || 0 },
        );
        setSelectedMemberId((prev) => {
          if (!membershipRows.length) return null;
          if (prev && membershipRows.some((member) => member.id === prev)) return prev;
          return membershipRows[0].id;
        });
        const classRows = Array.isArray(data.classes) ? data.classes : [];
        setSelectedClassId((prev) => {
          if (!classRows.length) return null;
          if (prev && classRows.some((c) => c.id === prev)) return prev;
          return classRows[0].id;
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateTicket = () => {
    if (!ticketForm.equipment.trim() || !ticketForm.location.trim() || !ticketForm.issue.trim()) return;
    fetch(`${API_BASE}/api/staff/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterEmail: user?.email || "",
        equipment: ticketForm.equipment.trim(),
        location: ticketForm.location.trim(),
        issue: ticketForm.issue.trim(),
        priority: ticketForm.priority,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) loadDashboard();
      })
      .catch(() => {});
    setTicketForm({ equipment: "", location: "", issue: "", priority: "Medium" });
  };

  const updateTicketStatus = (ticketId, nextStatus) => {
    const numericId = Number(String(ticketId).replace("T-", ""));
    fetch(`${API_BASE}/api/staff/tickets/${numericId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) loadDashboard();
      })
      .catch(() => {});
  };

  const handleAddMaintenanceLog = () => {
    if (!maintenanceForm.task.trim()) return;
    fetch(`${API_BASE}/api/staff/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterEmail: user?.email || "",
        date: maintenanceForm.date,
        task: maintenanceForm.task.trim(),
        status: maintenanceForm.status,
        area: maintenanceForm.area || "Facility",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) loadDashboard();
      })
      .catch(() => {});
    setMaintenanceForm({ date: "2026-03-31", task: "", status: "Pending", area: "Facility" });
  };

  const updateMaintenanceStatus = (logId, nextStatus) => {
    const numericId = Number(String(logId).replace("M-", ""));
    fetch(`${API_BASE}/api/staff/maintenance/${numericId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) loadDashboard();
      })
      .catch(() => {});
  };

  const updateMembership = (memberId, action) => {
    fetch(`${API_BASE}/api/staff/memberships/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterEmail: user?.email || "",
        action,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          loadDashboard();
        }
      })
      .catch(() => {});
  };

  const navGroups = staffNavGroups;

  const summaryCards = (
    <>
      <SummaryCard title="Open tickets" metric={openTickets} helper="Needs attention" tone="warning" />
      <SummaryCard title="Pending maintenance" metric={pendingMaintenance} helper="In queue" tone="info" />
      <SummaryCard title="Active memberships" metric={membershipSummary.activeCount} helper="Current" tone="success" />
      <SummaryCard title="Classes today" metric={staffClasses.length} helper="Scheduled" tone="info" />
    </>
  );

  const sideClasses = (
    <>
      <ContentPanel
        title="Staff shifts"
        subtitle="Monthly coverage snapshot"
        action={<span className="fitopsPill" data-tone="warning">{staffSchedule.length} shifts</span>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {staffSchedule.map((entry) => (
            <div key={entry.day} style={listItemStyle("base")}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 800 }}>{entry.day}</div>
                <span className="fitopsPill" data-tone="info">{entry.shift}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                Lead: <span style={{ color: "var(--brand)", fontWeight: 900 }}>{entry.lead}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>Staff: {entry.staff}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>Area: {entry.area}</div>
            </div>
          ))}
        </div>
      </ContentPanel>

      <ContentPanel
        title="Class attendance"
        subtitle="Fill level and trainer assignment"
        action={<span className="fitopsPill" data-tone="info">{staffClasses.length} classes</span>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {staffClasses.map((item) => (
            <div key={item.id} style={listItemStyle("base")}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>{item.name}</div>
                <span className="fitopsPill" data-tone="success">
                  {item.members.length}/{item.capacity} filled
                </span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                {item.schedule} — Coach{" "}
                <span style={{ color: "var(--brand)", fontWeight: 900 }}>{item.trainer}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(31,42,39,0.10)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: 6,
                      width: `${Math.min(100, Math.round((item.members.length / Math.max(1, item.capacity)) * 100))}%`,
                      background: "var(--brand)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8, fontWeight: 800 }}>Attending members</div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                {item.members.length ? item.members.join(", ") : "No members enrolled yet."}
              </div>
            </div>
          ))}
        </div>
      </ContentPanel>
    </>
  );

  const mainMemberships = (
    <ContentPanel
      title="Membership desk"
      subtitle="Search, review, and update member status"
      action={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className="fitopsPill" data-tone="success">{membershipSummary.activeCount} active</span>
          <span className="fitopsPill" data-tone="warning">{membershipSummary.inactiveCount} inactive</span>
          <span className="fitopsPill" data-tone="info">{membershipSummary.totalCount} total</span>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 12 }}>
        <input
          value={memberSearch}
          onChange={(event) => setMemberSearch(event.target.value)}
          placeholder="Search by member name or ID (example: M-4)"
          style={inputStyle()}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
          <div style={{ ...listItemStyle("base"), padding: 10 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
              Members ({filteredMemberships.length})
            </div>
            <div style={{ display: "grid", gap: 8, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
              {filteredMemberships.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMemberId(member.id)}
                  style={{
                    ...listItemStyle("base"),
                    textAlign: "left",
                    cursor: "pointer",
                    border:
                      selectedMember?.id === member.id
                        ? "2px solid rgba(20,108,99,0.35)"
                        : "1px solid rgba(31,42,39,0.10)",
                    background: selectedMember?.id === member.id ? "rgba(20,108,99,0.10)" : "var(--surface-alt)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>{member.name}</div>
                    <span style={membershipStatusPillStyle(member.statusLabel)}>{member.statusLabel}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                    {member.displayId} — {member.planTypeLabel}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={listItemStyle("base")}>
              <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Member profile</div>
              {selectedMember ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ color: "var(--text-strong)", fontSize: 16, fontWeight: 950 }}>
                    {selectedMember.name}{" "}
                    <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>
                      ({selectedMember.displayId})
                    </span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Plan: <span style={{ color: "var(--text-strong)", fontWeight: 900 }}>{selectedMember.planTypeLabel}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Status:{" "}
                    <span
                      style={{
                        color: selectedMember.isActive ? "var(--status-success-text)" : "var(--status-warning-text)",
                        fontWeight: 900,
                      }}
                    >
                      {selectedMember.statusLabel}
                    </span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Payment: <span style={{ color: "var(--text-strong)", fontWeight: 900 }}>{selectedMember.paymentStatus}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900, marginTop: 2 }}>Perks</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {selectedMember.perks?.length ? selectedMember.perks.join(", ") : "No perks listed."}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => updateMembership(selectedMember.id, "renew")} style={optionButtonStyle("Done")}>
                      Renew
                    </button>
                    <button type="button" onClick={() => updateMembership(selectedMember.id, "suspend")} style={optionButtonStyle("In Progress")}>
                      Suspend
                    </button>
                    <button type="button" onClick={() => updateMembership(selectedMember.id, "upgrade")} style={optionButtonStyle("Open")}>
                      Upgrade
                    </button>
                    <button type="button" onClick={() => updateMembership(selectedMember.id, "downgrade")} style={optionButtonStyle("Pending")}>
                      Downgrade
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No members found for your search.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContentPanel>
  );

  const mainTickets = (
    <ContentPanel title="Tickets" subtitle="Create and update equipment tickets">
      <div style={{ display: "grid", gap: 14, gridTemplateRows: "auto 360px" }}>
        <div style={{ ...listItemStyle("base"), display: "grid", gap: 8 }}>
          <div style={{ color: "var(--text-strong)", fontSize: 12, fontWeight: 950 }}>Create ticket</div>
          <input
            value={ticketForm.equipment}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, equipment: event.target.value }))}
            placeholder="Equipment name"
            style={inputStyle()}
          />
          <input
            value={ticketForm.location}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, location: event.target.value }))}
            placeholder="Location"
            style={inputStyle()}
          />
          <textarea
            value={ticketForm.issue}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, issue: event.target.value }))}
            placeholder="Issue description"
            rows={3}
            style={inputStyle(true)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={ticketForm.priority}
              onChange={(event) => setTicketForm((prev) => ({ ...prev, priority: event.target.value }))}
              style={inputStyle()}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <button type="button" onClick={handleCreateTicket} style={actionButtonStyle("teal")}>
              Submit
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", paddingRight: 4, display: "grid", gap: 8, height: 360, marginTop: 4 }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={ticketCardStyle(ticket.priority)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>
                  {ticket.id} — {ticket.equipment}
                </div>
                <span style={ticketStatusPillStyle(ticket.status)}>{ticket.status}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                {ticket.location} — Priority <span style={{ color: priorityColor(ticket.priority), fontWeight: 950 }}>{ticket.priority}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 5 }}>{ticket.issue}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 5 }}>Assigned: {ticket.assignedTo}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => updateTicketStatus(ticket.id, "Open")} style={optionButtonStyle("Open")}>
                  Open
                </button>
                <button type="button" onClick={() => updateTicketStatus(ticket.id, "In Progress")} style={optionButtonStyle("In Progress")}>
                  In progress
                </button>
                <button type="button" onClick={() => updateTicketStatus(ticket.id, "Closed")} style={optionButtonStyle("Closed")}>
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContentPanel>
  );

  const maintenanceByDate = useMemo(() => {
    const map = new Map();
    for (const entry of maintenanceLog) {
      const key = entry.date;
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push(entry);
      map.set(key, arr);
    }
    return map;
  }, [maintenanceLog]);

  const maintenanceCalendarDays = useMemo(
    () => buildMonthGrid(maintenanceMonthAnchor),
    [maintenanceMonthAnchor],
  );

  const filteredMaintenanceRows = useMemo(() => {
    if (!maintenanceDateFilterEnabled) return maintenanceLog;
    return maintenanceLog.filter((entry) => entry.date === maintenanceSelectedDate);
  }, [maintenanceDateFilterEnabled, maintenanceLog, maintenanceSelectedDate]);

  const mainMaintenance = (
    <ContentPanel title="Maintenance log" subtitle="Add facility tasks and update progress">
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1.1fr", alignItems: "start" }}>
        <div style={{ ...listItemStyle("base"), display: "grid", gap: 8 }}>
          <div style={{ color: "var(--text-strong)", fontSize: 12, fontWeight: 950 }}>Add entry</div>
          <input
            value={maintenanceForm.date}
            onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, date: event.target.value }))}
            placeholder="Date (YYYY-MM-DD)"
            style={inputStyle()}
          />
          <textarea
            value={maintenanceForm.task}
            onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, task: event.target.value }))}
            placeholder="Task details"
            rows={3}
            style={inputStyle(true)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={maintenanceForm.status}
              onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, status: event.target.value }))}
              style={inputStyle()}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <button type="button" onClick={handleAddMaintenanceLog} style={actionButtonStyle("teal")}>
              Add
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ ...listItemStyle("base"), padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 950, color: "var(--text-strong)" }}>Maintenance calendar</div>
              <button
                type="button"
                className="fitopsBtn"
                style={{ padding: "8px 10px" }}
                onClick={() => setMaintenanceDateFilterEnabled((prev) => !prev)}
              >
                {maintenanceDateFilterEnabled ? "Show all" : "Filter date"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="fitopsBtn"
                onClick={() => setMaintenanceMonthAnchor((prev) => addMonths(prev, -1))}
                style={{ padding: "8px 10px" }}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div style={{ fontWeight: 950, color: "var(--text-strong)", fontSize: 13 }}>
                {maintenanceMonthAnchor.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </div>
              <button
                type="button"
                className="fitopsBtn"
                onClick={() => setMaintenanceMonthAnchor((prev) => addMonths(prev, 1))}
                style={{ padding: "8px 10px" }}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 10 }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((label) => (
                <div key={label} style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", fontWeight: 900 }}>
                  {label}
                </div>
              ))}

              {maintenanceCalendarDays.map((day) => {
                const count = (maintenanceByDate.get(day.iso) || []).length;
                const isSelected = day.iso === maintenanceSelectedDate;
                const isDim = !day.inMonth;

                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => {
                      setMaintenanceSelectedDate(day.iso);
                      setMaintenanceDateFilterEnabled(true);
                    }}
                    className="fitopsBtn"
                    style={{
                      padding: 0,
                      height: 34,
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
                          background: "var(--accent-warm)",
                          opacity: isDim ? 0.35 : 1,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ overflowY: "auto", paddingRight: 4, display: "grid", gap: 8, height: 360 }}>
            {filteredMaintenanceRows.map((entry) => (
              <div key={entry.id} style={listItemStyle("base")}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>{entry.staff}</div>
                  <span style={maintenanceStatusPillStyle(entry.status)}>{entry.status}</span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3 }}>
                  {entry.id} — {entry.date}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 5 }}>{entry.task}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => updateMaintenanceStatus(entry.id, "Pending")} style={optionButtonStyle("Pending")}>
                    Pending
                  </button>
                  <button type="button" onClick={() => updateMaintenanceStatus(entry.id, "In Progress")} style={optionButtonStyle("In Progress")}>
                    In progress
                  </button>
                  <button type="button" onClick={() => updateMaintenanceStatus(entry.id, "Done")} style={optionButtonStyle("Done")}>
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  );

  const mainClasses = (
    <div style={{ display: "grid", gap: 16 }}>
      <ContentPanel
        title="Classes"
        subtitle="Roster, attendance, and trainer snapshot."
        action={
          staffClasses.length ? (
            <select
              value={selectedClass?.id !== undefined && selectedClass?.id !== null ? String(selectedClass.id) : ""}
              onChange={(e) => setSelectedClassId(e.target.value)}
              style={inputStyle()}
              aria-label="Select class"
            >
              {staffClasses.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.name} — {c.schedule}
                </option>
              ))}
            </select>
          ) : null
        }
      >
        {selectedClass ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ ...listItemStyle("base"), borderLeft: "3px solid rgba(20,108,99,0.55)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ color: "var(--text-strong)", fontSize: 14, fontWeight: 950 }}>
                  {selectedClass.name}
                </div>
                <span className="fitopsPill" data-tone={selectedClass.members.length >= selectedClass.capacity ? "warning" : "success"}>
                  {selectedClass.members.length}/{selectedClass.capacity} filled
                </span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                {selectedClass.schedule} • Coach{" "}
                <span style={{ color: "var(--brand)", fontWeight: 900 }}>{selectedClass.trainer}</span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>
                Attendance
              </div>
              <div style={listItemStyle("base")}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="fitopsPill" data-tone="info">
                      {presentCountForClass(selectedClass, attendanceMap)} present
                    </span>
                    <span className="fitopsPill" data-tone="warning">
                      {Math.max(0, selectedClass.members.length - presentCountForClass(selectedClass, attendanceMap))} unmarked
                    </span>
                  </div>
                  <button
                    type="button"
                    className="fitopsBtn"
                    onClick={() => {
                      setAttendanceMap((prev) => {
                        const next = new Map(prev);
                        for (const memberName of selectedClass.members) {
                          next.delete(`${selectedClass.id}:${memberName}`);
                        }
                        return next;
                      });
                    }}
                    style={{ padding: "8px 10px" }}
                  >
                    Clear marks
                  </button>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
                  Use “Mark present” during check-in to quickly spot who still needs attendance confirmed (demo-only; not persisted).
                </div>
              </div>
              {selectedClass.members.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {selectedClass.members.map((memberName) => {
                    const key = `${selectedClass.id}:${memberName}`;
                    const present = attendanceMap.get(key) === true;
                    return (
                      <div
                        key={key}
                        style={{
                          ...listItemStyle("base"),
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>
                          {memberName}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAttendanceMap((prev) => {
                              const next = new Map(prev);
                              next.set(key, !present);
                              return next;
                            });
                          }}
                          className="fitopsBtn"
                          style={{
                            border: "none",
                            background: present ? "var(--status-success-text)" : "rgba(31,42,39,0.28)",
                            color: "#fff",
                            minWidth: 110,
                          }}
                        >
                          {present ? "Present" : "Mark present"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={listItemStyle("base")}>
                  <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>No members enrolled</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                    When bookings exist, the roster will appear here for roll call.
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={listItemStyle("base")}>
            <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>No classes scheduled</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
              Check back after the staff dashboard data loads.
            </div>
          </div>
        )}
      </ContentPanel>
    </div>
  );

  const dashboardMain = (
    <div style={{ display: "grid", gap: 16 }}>
      <ContentPanel
        title="Operations overview"
        subtitle="Priority items, memberships, and today’s class load."
        action={
          <button type="button" className="fitopsBtn" onClick={loadDashboard}>
            Refresh
          </button>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Open tickets (priority)</div>
            {urgentTickets.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {urgentTickets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveNav("tickets")}
                    className="fitopsBtn"
                    style={{
                      ...listItemStyle("base"),
                      textAlign: "left",
                      cursor: "pointer",
                      borderLeft: `3px solid ${priorityAccent(t.priority)}`,
                      borderRadius: `0 var(--radius-md) var(--radius-md) 0`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>
                        {t.equipment}
                      </div>
                      <span style={ticketStatusPillStyle(t.status)}>{t.status}</span>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                      {t.id} • {t.location} • Priority{" "}
                      <span style={{ color: priorityAccent(t.priority), fontWeight: 950 }}>{t.priority}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={listItemStyle("base")}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>No open tickets</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                  The queue is clear right now.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900 }}>Maintenance (urgent)</div>
            {urgentMaintenance.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {urgentMaintenance.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveNav("maintenance")}
                    className="fitopsBtn"
                    style={{ ...listItemStyle("base"), textAlign: "left", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>{m.task}</div>
                      <span style={maintenanceStatusPillStyle(m.status)}>{m.status}</span>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                      {m.id} • {m.date} • Requested by {m.staff}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={listItemStyle("base")}>
                <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>No pending maintenance</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
                  Nothing currently waiting in the log.
                </div>
              </div>
            )}
          </div>
        </div>
      </ContentPanel>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16, alignItems: "start" }}>
        <ContentPanel
          title="Membership snapshot"
          subtitle="Search, review, and update member status."
          action={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span className="fitopsPill" data-tone="success">{membershipSummary.activeCount} active</span>
              <span className="fitopsPill" data-tone="warning">{membershipSummary.inactiveCount} inactive</span>
            </div>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            <input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Search member name or ID (example: M-4)"
              style={inputStyle()}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" }}>
              <div style={{ display: "grid", gap: 8, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
                {filteredMemberships.slice(0, 8).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className="fitopsBtn"
                    style={{
                      ...listItemStyle("base"),
                      textAlign: "left",
                      cursor: "pointer",
                      border:
                        selectedMember?.id === member.id
                          ? "2px solid rgba(20,108,99,0.35)"
                          : "1px solid rgba(31,42,39,0.10)",
                      background: selectedMember?.id === member.id ? "rgba(20,108,99,0.10)" : "var(--surface-alt)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 900 }}>{member.name}</div>
                      <span style={membershipStatusPillStyle(member.statusLabel)}>{member.statusLabel}</span>
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                      {member.displayId} — {member.planTypeLabel}
                    </div>
                  </button>
                ))}
              </div>

              <div style={listItemStyle("base")}>
                <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
                  Selected member
                </div>
                {selectedMember ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ color: "var(--text-strong)", fontSize: 14, fontWeight: 950 }}>
                      {selectedMember.name}{" "}
                      <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>
                        ({selectedMember.displayId})
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                      <button type="button" onClick={() => updateMembership(selectedMember.id, "renew")} style={optionButtonStyle("Done")}>
                        Renew
                      </button>
                      <button type="button" onClick={() => updateMembership(selectedMember.id, "suspend")} style={optionButtonStyle("In Progress")}>
                        Suspend
                      </button>
                      <button type="button" onClick={() => updateMembership(selectedMember.id, "upgrade")} style={optionButtonStyle("Open")}>
                        Upgrade
                      </button>
                    </div>
                    <button type="button" className="fitopsBtn" onClick={() => setActiveNav("memberships")}>
                      Open full membership desk
                    </button>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No members found for your search.</div>
                )}
              </div>
            </div>
          </div>
        </ContentPanel>

        <ContentPanel
          title="Classes today"
          subtitle="Capacity + roster preview."
          action={<span className="fitopsPill" data-tone="info">{staffClasses.length} scheduled</span>}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {staffClasses.slice(0, 3).map((c) => (
              <button
                key={c.id}
                type="button"
                className="fitopsBtn"
                onClick={() => {
                  setSelectedClassId(c.id);
                  setActiveNav("classes");
                }}
                style={{ ...listItemStyle("base"), textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>{c.name}</div>
                  <span className="fitopsPill" data-tone={c.members.length >= c.capacity ? "warning" : "success"}>
                    {c.members.length}/{c.capacity}
                  </span>
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
                  {c.schedule} • Coach {c.trainer}
                </div>
              </button>
            ))}
            <button type="button" className="fitopsBtn" onClick={() => setActiveNav("classes")}>
              Open classes view
            </button>
          </div>
        </ContentPanel>
      </div>
    </div>
  );

  const helpMain = (
    <div style={{ display: "grid", gap: 16 }}>
      <ContentPanel title="Help / FAQ" subtitle="Policies and operational guidance for the demo portal.">
        <div style={{ display: "grid", gap: 10 }}>
          <div style={listItemStyle("base")}>
            <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>How do ticket priorities work?</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
              High = safety/critical downtime, Medium = impacts operations, Low = cosmetic/maintenance. Use the Tickets tab to change status and keep the queue current.
            </div>
          </div>
          <div style={listItemStyle("base")}>
            <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>Maintenance status expectations</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
              Pending = queued, In Progress = assigned and active, Done = verified complete. The calendar highlights dates with planned work.
            </div>
          </div>
          <div style={listItemStyle("base")}>
            <div style={{ color: "var(--text-strong)", fontSize: 13, fontWeight: 950 }}>Attendance tracking</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>
              In the Classes tab, “Mark present” toggles attendance locally for demo realism. It does not persist to the backend.
            </div>
          </div>
        </div>
      </ContentPanel>
    </div>
  );

  const sectionMap = {
    dashboard: {
      title: "Staff Dashboard",
      subtitle: `${name}, here’s your at-a-glance operations overview.`,
      main: dashboardMain,
      side: sideClasses,
      summary: summaryCards,
    },
    classes: {
      title: "Classes",
      subtitle: "Roster, attendance, and trainer info.",
      main: mainClasses,
      side: sideClasses,
      summary: null,
    },
    memberships: {
      title: "Memberships",
      subtitle: "Search and manage member status.",
      main: mainMemberships,
      side: null,
      summary: null,
    },
    tickets: {
      title: "Tickets",
      subtitle: "Create and update equipment tickets.",
      main: mainTickets,
      side: null,
      summary: null,
    },
    maintenance: {
      title: "Maintenance",
      subtitle: "Track facility upkeep with a date-driven log.",
      main: mainMaintenance,
      side: null,
      summary: null,
    },
    help: {
      title: "Help / FAQ",
      subtitle: "Operational guidance for the demo.",
      main: helpMain,
      side: null,
      summary: null,
    },
  };

  const currentSection = sectionMap[activeNav] || sectionMap.dashboard;

  return (
    <DashboardLayout
      role="staff"
      userName={name}
      eyebrow="Operations portal"
      title={currentSection.title}
      subtitle={currentSection.subtitle}
      navGroups={navGroups}
      activeNavKey={activeNav}
      onNavigate={(key) => {
        if (key) setActiveNav(key);
      }}
      actions={[
        {
          key: "logout",
          label: "Log out",
          primary: true,
          onClick: onLogout,
          render: ({ variant }) => (
            <button
              type="button"
              className={`fitopsBtn ${variant === "hero" ? "fitopsBtnOnHero" : ""} fitopsBtnPrimary`}
              onClick={onLogout}
            >
              Log out
            </button>
          ),
        },
      ]}
      summaryCards={currentSection.summary}
      sideContent={currentSection.side}
    >
      {currentSection.main}
    </DashboardLayout>
  );
}
function listItemStyle(mode = "base") {
  return {
    background: mode === "alt" ? "var(--surface)" : "var(--surface-alt)",
    border: "1px solid rgba(31,42,39,0.10)",
    borderRadius: "var(--radius-md)",
    padding: "12px 14px",
    transition: "all var(--fast) var(--ease)",
  };
}

function ticketCardStyle(priority) {
  const value = String(priority || "").toLowerCase();
  const left =
    value === "high"
      ? "var(--status-danger-text)"
      : value === "medium"
        ? "var(--status-warning-text)"
        : value === "low"
          ? "var(--status-success-text)"
          : "rgba(31,42,39,0.18)";
  return {
    ...listItemStyle(),
    borderLeft: `3px solid ${left}`,
    borderRadius: `0 var(--radius-md) var(--radius-md) 0`,
  };
}

function actionButtonStyle(kind) {
  if (kind === "teal") {
    return {
      border: "none",
      background: "var(--brand)",
      color: "#fff",
      borderRadius: "var(--radius-sm)",
      padding: "9px 14px",
      fontSize: 12,
      cursor: "pointer",
      fontWeight: 700,
      minWidth: 96,
      transition: "all var(--fast) var(--ease)",
    };
  }
  return {
    border: "none",
    background: "var(--brand)",
    color: "#fff",
    borderRadius: "var(--radius-sm)",
    padding: "9px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 700,
    minWidth: 96,
    transition: "all var(--fast) var(--ease)",
  };
}

function optionButtonStyle(label) {
  const value = String(label || "").toLowerCase();
  if (value === "open" || value === "pending") return statusPillButtonStyle("info");
  if (value === "in progress") return statusPillButtonStyle("warning");
  if (value === "closed" || value === "done") return statusPillButtonStyle("success");
  return statusPillButtonStyle("neutral");
}

function ticketStatusPillStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value === "open") return pillStyle("info");
  if (value === "in progress") return pillStyle("warning");
  if (value === "closed") return pillStyle("success");
  return pillStyle("info");
}

function maintenanceStatusPillStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value === "pending") return pillStyle("info");
  if (value === "in progress") return pillStyle("warning");
  if (value === "done") return pillStyle("success");
  return pillStyle("info");
}

function membershipStatusPillStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return pillStyle("success");
  if (value === "suspended" || value === "expired" || value === "inactive") return pillStyle("warning");
  return pillStyle("info");
}

function pillStyle(kind) {
  if (kind === "success") return { background: "var(--status-success-bg)", color: "var(--status-success-text)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(31,122,84,0.18)" };
  if (kind === "warning") return { background: "var(--status-warning-bg)", color: "var(--status-warning-text)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(184,135,42,0.20)" };
  if (kind === "info") return { background: "var(--status-info-bg)", color: "var(--status-info-text)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(20,108,99,0.18)" };
  if (kind === "danger") return { background: "var(--status-danger-bg)", color: "var(--status-danger-text)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(169,52,44,0.18)" };
  return { background: "rgba(31,42,39,0.06)", color: "var(--text-muted)", borderRadius: "var(--radius-pill)", padding: "4px 12px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(31,42,39,0.12)" };
}

function statusPillButtonStyle(kind) {
  const base = {
    borderRadius: "var(--radius-pill)",
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all var(--fast) var(--ease)",
  };
  if (kind === "info") return { ...base, background: "var(--status-info-bg)", color: "var(--status-info-text)", border: "1px solid rgba(20,108,99,0.20)" };
  if (kind === "warning") return { ...base, background: "var(--status-warning-bg)", color: "var(--status-warning-text)", border: "1px solid rgba(184,135,42,0.22)" };
  if (kind === "success") return { ...base, background: "var(--status-success-bg)", color: "var(--status-success-text)", border: "1px solid rgba(31,122,84,0.20)" };
  if (kind === "danger") return { ...base, background: "var(--status-danger-bg)", color: "var(--status-danger-text)", border: "1px solid rgba(169,52,44,0.22)" };
  return { ...base, background: "transparent", color: "var(--text-muted)", border: "1.5px solid rgba(31,42,39,0.18)" };
}

function inputStyle(isTextArea = false) {
  return {
    border: "1.5px solid rgba(31,42,39,0.14)",
    background: "var(--surface)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    color: "var(--text-strong)",
    fontSize: 13,
    resize: isTextArea ? "vertical" : "none",
    width: "100%",
    boxSizing: "border-box",
  };
}

function priorityColor(priority) {
  return priorityAccent(priority);
}
function priorityRank(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function priorityAccent(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high") return "var(--status-danger-text)";
  if (value === "medium") return "var(--status-warning-text)";
  if (value === "low") return "var(--status-success-text)";
  return "rgba(31,42,39,0.18)";
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

function presentCountForClass(selectedClass, attendanceMap) {
  if (!selectedClass?.members?.length) return 0;
  let count = 0;
  for (const memberName of selectedClass.members) {
    const key = `${selectedClass.id}:${memberName}`;
    if (attendanceMap.get(key) === true) count += 1;
  }
  return count;
}

