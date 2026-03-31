import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:5000";

export default function StaffDashboard({ user, onLogout }) {
  const name = user?.name || "Staff";
  const [staffClasses, setStaffClasses] = useState([]);
  const [staffSchedule, setStaffSchedule] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [maintenanceLog, setMaintenanceLog] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [membershipSummary, setMembershipSummary] = useState({ activeCount: 0, inactiveCount: 0, totalCount: 0 });
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
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

  const openTickets = useMemo(() => tickets.filter((item) => item.status !== "Closed").length, [tickets]);
  const pendingMaintenance = useMemo(
    () => maintenanceLog.filter((entry) => entry.status !== "Done").length,
    [maintenanceLog],
  );
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
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e0f2fe" }}>Staff Dashboard</div>
            <div style={{ fontSize: 13, color: "#93c5fd", marginTop: 4 }}>
              {name}, manage trainers, equipment tickets, gym floor shifts, and facility upkeep.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={pillStyle("rgba(56, 189, 248, 0.22)", "#67e8f9", true)}>{openTickets} Active Tickets</span>
            <span style={pillStyle("rgba(245, 158, 11, 0.2)", "#fbbf24", true)}>{pendingMaintenance} Pending Logs</span>
            <button type="button" onClick={onLogout} style={ghostButtonStyle()}>
              Log out
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 14 }}>
          <Panel title="Class Attendance (At a Glance)">
            <div
              style={{
                marginBottom: 10,
                fontSize: 12,
                color: "#94a3b8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Track trainer assignment and live class fill levels.</span>
              <span style={pillStyle("rgba(8,145,178,0.2)", "#67e8f9")}>{staffClasses.length} Classes</span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {staffClasses.map((item) => (
                <div key={item.id} style={listItemStyle()}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 800 }}>{item.name}</div>
                    <span style={pillStyle("rgba(34,197,94,0.2)", "#86efac")}>
                      {item.members.length}/{item.capacity} filled
                    </span>
                  </div>
                  <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 4 }}>
                    {item.schedule} - Coach: <span style={{ color: "#bae6fd", fontWeight: 700 }}>{item.trainer}</span>
                  </div>
                  <div style={{ color: "#67e8f9", fontSize: 11, marginTop: 4, fontWeight: 700 }}>Attending Members</div>
                  <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>
                    {item.members.length ? item.members.join(", ") : "No members enrolled yet."}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Staff Shifts (Monthly View)">
            <div
              style={{
                marginBottom: 10,
                fontSize: 12,
                color: "#94a3b8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Shift ownership and area coverage by day.</span>
              <span style={pillStyle("rgba(245,158,11,0.2)", "#fbbf24")}>{staffSchedule.length} Shifts</span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {staffSchedule.map((entry) => (
                <div key={entry.day} style={listItemStyle()}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800 }}>{entry.day}</div>
                    <span style={pillStyle("rgba(59,130,246,0.2)", "#93c5fd")}>{entry.shift}</span>
                  </div>
                  <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 3 }}>
                    Lead: <span style={{ color: "#bae6fd", fontWeight: 700 }}>{entry.lead}</span>
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 3 }}>Staff: {entry.staff}</div>
                  <div style={{ color: "#67e8f9", fontSize: 11, marginTop: 4, fontWeight: 700 }}>Coverage Area: {entry.area}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Membership Dashboard">
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                Search members by name or ID, update status/plan, and review membership changes.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={pillStyle("rgba(34,197,94,0.2)", "#86efac")}>{membershipSummary.activeCount} Active</span>
                <span style={pillStyle("rgba(245,158,11,0.2)", "#fbbf24")}>{membershipSummary.inactiveCount} Inactive</span>
                <span style={pillStyle("rgba(59,130,246,0.2)", "#93c5fd")}>{membershipSummary.totalCount} Total</span>
              </div>
            </div>
            <input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Search by member name or ID (example: M-4)"
              style={inputStyle()}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
              <div style={{ ...listItemStyle(), padding: 10 }}>
                <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  Members ({filteredMemberships.length})
                </div>
                <div style={{ display: "grid", gap: 8, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
                  {filteredMemberships.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      style={{
                        ...listItemStyle(),
                        textAlign: "left",
                        cursor: "pointer",
                        border: selectedMember?.id === member.id ? "1px solid #22d3ee" : "1px solid #334155",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800 }}>
                          {member.name}
                        </div>
                        <span style={membershipStatusPillStyle(member.statusLabel)}>{member.statusLabel}</span>
                      </div>
                      <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 4 }}>
                        {member.displayId} - {member.planTypeLabel}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={listItemStyle()}>
                  <div style={{ color: "#67e8f9", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Member Profile</div>
                  {selectedMember ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 800 }}>
                        {selectedMember.name} <span style={{ color: "#93c5fd", fontSize: 12 }}>({selectedMember.displayId})</span>
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                        Plan Type: <span style={{ color: "#bae6fd", fontWeight: 700 }}>{selectedMember.planTypeLabel}</span>
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                        Membership Status:{" "}
                        <span style={{ color: selectedMember.isActive ? "#86efac" : "#fbbf24", fontWeight: 700 }}>
                          {selectedMember.statusLabel}
                        </span>
                      </div>
                      <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                        Payment Status: <span style={{ color: "#e0f2fe", fontWeight: 700 }}>{selectedMember.paymentStatus}</span>
                      </div>
                      <div style={{ color: "#67e8f9", fontSize: 11, fontWeight: 700 }}>Perks</div>
                      <div style={{ color: "#cbd5e1", fontSize: 12 }}>
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
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>No members found for your search.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "stretch" }}>
          <Panel title="Maintenance Tickets">
            <div style={{ display: "grid", gap: 14, gridTemplateRows: "auto 320px", marginTop: 12 }}>
              <div style={{ ...listItemStyle(), display: "grid", gap: 8 }}>
                <div style={{ color: "#e0f2fe", fontSize: 12, fontWeight: 800 }}>Create Ticket</div>
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
                  <button type="button" onClick={handleCreateTicket} style={actionButtonStyle("#0891b2")}>
                    Submit Ticket
                  </button>
                </div>
              </div>

              <div style={{ overflowY: "auto", paddingRight: 4, display: "grid", gap: 8, height: 320, marginTop: 4 }}>
                {tickets.map((ticket) => (
                  <div key={ticket.id} style={listItemStyle()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800 }}>
                        {ticket.id} - {ticket.equipment}
                      </div>
                      <span style={ticketStatusPillStyle(ticket.status)}>
                        {ticket.status}
                      </span>
                    </div>
                    <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 3 }}>
                      {ticket.location} - Priority:{" "}
                      <span style={{ color: priorityColor(ticket.priority), fontWeight: 800 }}>{ticket.priority}</span>
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 5 }}>{ticket.issue}</div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 5 }}>Assigned: {ticket.assignedTo}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => updateTicketStatus(ticket.id, "Open")} style={optionButtonStyle("Open")}>
                        Open
                      </button>
                      <button type="button" onClick={() => updateTicketStatus(ticket.id, "In Progress")} style={optionButtonStyle("In Progress")}>
                        In Progress
                      </button>
                      <button type="button" onClick={() => updateTicketStatus(ticket.id, "Closed")} style={optionButtonStyle("Closed")}>
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Maintenance Log">
            <div style={{ display: "grid", gap: 14, gridTemplateRows: "auto 320px", marginTop: 12 }}>
              <div style={{ ...listItemStyle(), display: "grid", gap: 8 }}>
                <div style={{ color: "#e0f2fe", fontSize: 12, fontWeight: 800 }}>Add Maintenance Entry</div>
                <input
                  value={maintenanceForm.date}
                  onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, date: event.target.value }))}
                  placeholder="Date (YYYY-MM-DD)"
                  style={inputStyle()}
                />
                <textarea
                  value={maintenanceForm.task}
                  onChange={(event) => setMaintenanceForm((prev) => ({ ...prev, task: event.target.value }))}
                  placeholder="Task details (for example: John refilled paper towels)"
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
                  <button type="button" onClick={handleAddMaintenanceLog} style={actionButtonStyle("#0d9488")}>
                    Add Log
                  </button>
                </div>
              </div>

              <div style={{ overflowY: "auto", paddingRight: 4, display: "grid", gap: 8, height: 320, marginTop: 4 }}>
                {maintenanceLog.map((entry) => (
                  <div key={entry.id} style={listItemStyle()}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 800 }}>{entry.staff}</div>
                      <span style={maintenanceStatusPillStyle(entry.status)}>
                        {entry.status}
                      </span>
                    </div>
                    <div style={{ color: "#93c5fd", fontSize: 12, marginTop: 3 }}>
                      {entry.id} - {entry.date}
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 5 }}>{entry.task}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => updateMaintenanceStatus(entry.id, "Pending")} style={optionButtonStyle("Pending")}>
                        Pending
                      </button>
                      <button type="button" onClick={() => updateMaintenanceStatus(entry.id, "In Progress")} style={optionButtonStyle("In Progress")}>
                        In Progress
                      </button>
                      <button type="button" onClick={() => updateMaintenanceStatus(entry.id, "Done")} style={optionButtonStyle("Done")}>
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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

function listItemStyle() {
  return {
    border: "1px solid #334155",
    borderRadius: 10,
    padding: "10px 12px",
    background: "#0b1220",
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

function actionButtonStyle(background) {
  return {
    border: "none",
    background,
    color: "#fff",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 700,
    minWidth: 96,
  };
}

function miniButtonStyle(background = "#1e293b") {
  return {
    border: "1px solid #334155",
    background,
    color: "#e2e8f0",
    borderRadius: 7,
    padding: "6px 9px",
    fontSize: 11,
    cursor: "pointer",
    fontWeight: 700,
  };
}

function optionButtonStyle(label) {
  const value = String(label || "").toLowerCase();
  if (value === "open" || value === "pending") return miniButtonStyle("#1e3a8a");
  if (value === "in progress") return miniButtonStyle("#b45309");
  if (value === "closed" || value === "done") return miniButtonStyle("#166534");
  return miniButtonStyle();
}

function ticketStatusPillStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value === "open") return pillStyle("rgba(30, 58, 138, 0.24)", "#93c5fd");
  if (value === "in progress") return pillStyle("rgba(180, 83, 9, 0.24)", "#fbbf24");
  if (value === "closed") return pillStyle("rgba(22, 101, 52, 0.24)", "#86efac");
  return pillStyle("rgba(8, 145, 178, 0.2)", "#67e8f9");
}

function maintenanceStatusPillStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value === "pending") return pillStyle("rgba(30, 58, 138, 0.24)", "#93c5fd");
  if (value === "in progress") return pillStyle("rgba(180, 83, 9, 0.24)", "#fbbf24");
  if (value === "done") return pillStyle("rgba(22, 101, 52, 0.24)", "#86efac");
  return pillStyle("rgba(8, 145, 178, 0.2)", "#67e8f9");
}

function membershipStatusPillStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return pillStyle("rgba(22, 101, 52, 0.24)", "#86efac");
  if (value === "suspended" || value === "expired" || value === "inactive") return pillStyle("rgba(180, 83, 9, 0.24)", "#fbbf24");
  return pillStyle("rgba(8, 145, 178, 0.2)", "#67e8f9");
}

function pillStyle(background, color, emphasize = false) {
  return {
    background,
    color,
    fontSize: emphasize ? 14 : 12,
    fontWeight: 700,
    padding: emphasize ? "8px 14px" : "6px 10px",
    borderRadius: 999,
  };
}

function inputStyle(isTextArea = false) {
  return {
    border: "1px solid #334155",
    background: "#0f172a",
    borderRadius: 8,
    padding: "8px 10px",
    color: "#e2e8f0",
    fontSize: 12,
    resize: isTextArea ? "vertical" : "none",
    width: "100%",
    boxSizing: "border-box",
  };
}

function priorityColor(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high") return "#ef4444";
  if (value === "medium") return "#f59e0b";
  if (value === "low") return "#22c55e";
  return "#93c5fd";
}


