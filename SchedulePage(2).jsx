import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEMBERSHIP_TYPES = ["Basic", "Standard", "Premium"];
const MEMBER_STATUSES = ["Active", "Expired", "Suspended"];
const TICKET_TYPES = [
  { name: "Single Pass", price: 5, color: "#2563eb", bg: "#dbeafe" },
  { name: "Double Pass", price: 8, color: "#f59e0b", bg: "#fef3c7" },
  { name: "Monthly Pass", price: 100, color: "#8b5cf6", bg: "#ede9fe" },
];
const SUPPORT_TICKETS = [
  { id: "T-001", title: "Broken treadmill in Main Floor", priority: "High", status: "Open", date: "Mar 25, 2026" },
  { id: "T-002", title: "Locker room light flickering", priority: "Low", status: "In Progress", date: "Mar 24, 2026" },
  { id: "T-003", title: "Pool pump maintenance needed", priority: "Medium", status: "Open", date: "Mar 23, 2026" },
  { id: "T-004", title: "AC unit in Studio B not working", priority: "High", status: "Resolved", date: "Mar 20, 2026" },
];
const HISTORY_EVENTS = [
  { time: "Today 09:14", action: "Class added", detail: "Yoga Flow added to Monday 07:00", icon: "CL", color: "#dbeafe" },
  { time: "Today 08:52", action: "Member registered", detail: "Sophie Nguyen joined as Premium member", icon: "MB", color: "#dcfce7" },
  { time: "Yesterday", action: "Class cancelled", detail: "HIIT Blast on Friday removed by staff", icon: "CN", color: "#fee2e2" },
  { time: "Mar 26", action: "Ticket resolved", detail: "AC unit in Studio B repaired", icon: "TK", color: "#dcfce7" },
  { time: "Mar 25", action: "Member suspended", detail: "Tyler Brooks account suspended", icon: "MS", color: "#fef9c3" },
  { time: "Mar 24", action: "Capacity updated", detail: "Spin Room capacity increased to 18", icon: "CP", color: "#ede9fe" },
];

const avatarInitials = (m) => `${m.firstName[0]}${m.lastName[0]}`;

const initialClasses = [
  { id: 1, name: "Yoga Flow", day: 0, time: "07:00", duration: 60, instructor: "Sarah L.", room: "Studio A", capacity: 15, booked: 11, color: "#10b981", bookedByMe: false },
  { id: 2, name: "HIIT Blast", day: 0, time: "09:00", duration: 45, instructor: "Mike T.", room: "Main Floor", capacity: 20, booked: 20, color: "#ef4444", bookedByMe: false },
  { id: 3, name: "Spin Cycle", day: 1, time: "06:30", duration: 50, instructor: "Jess W.", room: "Spin Room", capacity: 18, booked: 14, color: "#f59e0b", bookedByMe: true },
  { id: 4, name: "Pilates Core", day: 1, time: "10:00", duration: 60, instructor: "Sarah L.", room: "Studio A", capacity: 12, booked: 8, color: "#8b5cf6", bookedByMe: false },
  { id: 5, name: "Boxing Basics", day: 2, time: "18:00", duration: 60, instructor: "Carlos R.", room: "Boxing Ring", capacity: 10, booked: 7, color: "#ef4444", bookedByMe: false },
  { id: 6, name: "Zumba Dance", day: 2, time: "19:30", duration: 60, instructor: "Maria G.", room: "Studio B", capacity: 25, booked: 18, color: "#ec4899", bookedByMe: true },
  { id: 7, name: "Strength & Power", day: 3, time: "07:00", duration: 75, instructor: "Mike T.", room: "Weight Room", capacity: 12, booked: 9, color: "#3b82f6", bookedByMe: false },
  { id: 8, name: "Yoga Flow", day: 3, time: "12:00", duration: 60, instructor: "Sarah L.", room: "Studio A", capacity: 15, booked: 6, color: "#10b981", bookedByMe: false },
  { id: 9, name: "Aqua Aerobics", day: 4, time: "08:00", duration: 45, instructor: "Tom B.", room: "Pool", capacity: 20, booked: 13, color: "#06b6d4", bookedByMe: false },
  { id: 10, name: "HIIT Blast", day: 4, time: "17:30", duration: 45, instructor: "Carlos R.", room: "Main Floor", capacity: 20, booked: 15, color: "#ef4444", bookedByMe: false },
  { id: 11, name: "Weekend Warrior", day: 5, time: "09:00", duration: 90, instructor: "Mike T.", room: "Main Floor", capacity: 15, booked: 10, color: "#f59e0b", bookedByMe: false },
  { id: 12, name: "Gentle Stretch", day: 6, time: "10:00", duration: 60, instructor: "Sarah L.", room: "Studio A", capacity: 20, booked: 5, color: "#10b981", bookedByMe: false },
];

const initialMembers = [
  { id: 1, firstName: "John", lastName: "Doe", email: "john.doe@email.com", phone: "555-0101", membership: "Premium", status: "Active", joined: "Jan 12, 2024", expiry: "Jan 12, 2026", emergencyContact: "Jane Doe", emergencyPhone: "555-0102", notes: "", avatar: "#8b5cf6", bookedClasses: [3, 6] },
  { id: 2, firstName: "Emily", lastName: "Chen", email: "emily.chen@email.com", phone: "555-0203", membership: "Standard", status: "Active", joined: "Mar 5, 2024", expiry: "Mar 5, 2025", emergencyContact: "Tom Chen", emergencyPhone: "555-0204", notes: "Prefers morning classes", avatar: "#ec4899", bookedClasses: [1, 7] },
  { id: 3, firstName: "Marcus", lastName: "Rivera", email: "m.rivera@email.com", phone: "555-0305", membership: "Premium", status: "Active", joined: "Feb 20, 2023", expiry: "Feb 20, 2025", emergencyContact: "Ana Rivera", emergencyPhone: "555-0306", notes: "", avatar: "#3b82f6", bookedClasses: [2, 5] },
  { id: 4, firstName: "Aisha", lastName: "Patel", email: "aisha.p@email.com", phone: "555-0407", membership: "Basic", status: "Expired", joined: "Jun 1, 2023", expiry: "Jun 1, 2024", emergencyContact: "Raj Patel", emergencyPhone: "555-0408", notes: "Renewal pending", avatar: "#f59e0b", bookedClasses: [] },
  { id: 5, firstName: "Tyler", lastName: "Brooks", email: "t.brooks@email.com", phone: "555-0509", membership: "Standard", status: "Active", joined: "Sep 10, 2024", expiry: "Sep 10, 2025", emergencyContact: "Lisa Brooks", emergencyPhone: "555-0510", notes: "", avatar: "#06b6d4", bookedClasses: [9, 11] },
  { id: 6, firstName: "Sophie", lastName: "Nguyen", email: "s.nguyen@email.com", phone: "555-0611", membership: "Premium", status: "Suspended", joined: "Apr 3, 2023", expiry: "Apr 3, 2025", emergencyContact: "Minh Nguyen", emergencyPhone: "555-0612", notes: "Account suspended - payment issue", avatar: "#ef4444", bookedClasses: [] },
];

const initialTicketPurchases = [
  { purchaseId: "P-1001", customerName: "John Doe", ticketType: "Monthly Pass", quantity: 1, unitPrice: 100, totalPrice: 100, purchaseDate: "Mar 28, 2026", paymentStatus: "Paid" },
  { purchaseId: "P-1002", customerName: "Emily Chen", ticketType: "Double Pass", quantity: 2, unitPrice: 8, totalPrice: 16, purchaseDate: "Mar 27, 2026", paymentStatus: "Paid" },
  { purchaseId: "P-1003", customerName: "Marcus Rivera", ticketType: "Single Pass", quantity: 3, unitPrice: 5, totalPrice: 15, purchaseDate: "Mar 26, 2026", paymentStatus: "Paid" },
];

const CURRENT_MEMBER = initialMembers[0];

const statusColor = (s) => s === "Active" ? { bg: "#dcfce7", text: "#15803d" } : s === "Expired" ? { bg: "#fef9c3", text: "#a16207" } : { bg: "#fee2e2", text: "#b91c1c" };
const membershipColor = (m) => m === "Premium" ? { bg: "#ede9fe", text: "#6d28d9" } : m === "Standard" ? { bg: "#dbeafe", text: "#1d4ed8" } : { bg: "#f1f5f9", text: "#475569" };
const paymentStatusColor = (s) => s === "Paid" ? { bg: "#dcfce7", text: "#15803d" } : { bg: "#f1f5f9", text: "#475569" };
const formatCurrency = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
const formatPurchaseDate = (date = new Date()) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const ticketMeta = (ticketType) => TICKET_TYPES.find((ticket) => ticket.name === ticketType) || TICKET_TYPES[0];
const fullName = (member) => `${member.firstName} ${member.lastName}`;
const nextPurchaseId = (purchases) => {
  const numbers = purchases.map((purchase) => Number(String(purchase.purchaseId).replace(/\D/g, ""))).filter((value) => Number.isFinite(value));
  const nextValue = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `P-${String(nextValue).padStart(4, "0")}`;
};

const IconMemberships = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="14" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M14 11h4M14 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 7V5a6 6 0 0112 0v2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const IconPerson = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M2 21v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="19" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
    <path d="M22 21v-1a5 5 0 00-4-4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconClasses = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
    <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
    <rect x="11" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
    <rect x="15" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
  </svg>
);

const IconTickets = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 9a2 2 0 000 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 000-4V8a2 2 0 00-2-2H5a2 2 0 00-2 2v1z" stroke="currentColor" strokeWidth="2" />
    <path d="M9 8v8M15 8v8" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
);

const IconHistory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 109-9 9 9 0 00-6.22 2.5L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function LoginScreen({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, background: "linear-gradient(135deg,#2563eb,#06b6d4)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 auto 16px" }}>GX</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>GymX Management</div>
        <div style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Please select your account type to continue</div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <div onClick={() => onLogin("member")} style={{ width: 200, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "center", transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 52, height: 52, background: "#dbeafe", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#2563eb" strokeWidth="2" />
              <path d="M4 20v-1a8 8 0 0116 0v1" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Member</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Book classes and manage your schedule</div>
          <div style={{ marginTop: 18, padding: "8px 0", background: "#eff6ff", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#2563eb" }}>Login as Member</div>
        </div>

        <div onClick={() => onLogin("staff")} style={{ width: 200, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "28px 24px", cursor: "pointer", textAlign: "center", transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ width: 52, height: 52, background: "#dcfce7", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="7" width="18" height="13" rx="2" stroke="#16a34a" strokeWidth="2" />
              <path d="M8 7V5a4 4 0 018 0v2" stroke="#16a34a" strokeWidth="2" />
              <circle cx="12" cy="13" r="2" stroke="#16a34a" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>Staff</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Manage members, classes and facilities</div>
          <div style={{ marginTop: 18, padding: "8px 0", background: "#f0fdf4", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#16a34a" }}>Login as Staff</div>
        </div>
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "#94a3b8" }}>Login functionality handled by authentication module</div>
    </div>
  );
}

function AppShell({ role, onLogout, activeTab, setActiveTab, children }) {
  const staffNav = [
    { key: "memberships", label: "Memberships", icon: <IconMemberships /> },
    { key: "person", label: "Person", icon: <IconPerson /> },
    { key: "classes", label: "Classes", icon: <IconClasses /> },
    { key: "tickets", label: "Tickets", icon: <IconTickets /> },
    { key: "history", label: "Facility History", icon: <IconHistory /> },
  ];
  const memberNav = [
    { key: "memberships", label: "Memberships", icon: <IconMemberships /> },
    { key: "person", label: "Person", icon: <IconPerson /> },
    { key: "classes", label: "Classes", icon: <IconClasses /> },
    { key: "tickets", label: "Tickets", icon: <IconTickets /> },
  ];
  const navItems = role === "staff" ? staffNav : memberNav;

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#2563eb,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>GX</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>GymX Management</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: role === "staff" ? "#dcfce7" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: role === "staff" ? "#16a34a" : "#2563eb" }}>
              {role === "staff" ? "ST" : "JD"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1 }}>{role === "staff" ? "Staff User" : "John Doe"}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{role === "staff" ? "Administrator" : "Premium Member"}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>Log out</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 230, background: "#fff", borderRight: "1px solid #e2e8f0", padding: "20px 12px", flexShrink: 0, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 8px", marginBottom: 8 }}>Main Menu</div>
          {navItems.map((item) => {
            const active = activeTab === item.key;
            return (
              <div key={item.key} onClick={() => setActiveTab(item.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", marginBottom: 2, background: active ? "#eff6ff" : "transparent", color: active ? "#2563eb" : "#334155", fontWeight: active ? 600 : 400, fontSize: 14, transition: "all .15s" }}>
                <span style={{ color: active ? "#2563eb" : "#64748b", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function TicketPurchaseModule({
  pageTitle,
  subtitle,
  purchases,
  onAddPurchase,
  members = [],
  initialCustomerName = "",
  lockCustomer = false,
  showAllRecords = false,
  recordsTitle = "Purchase Records",
  emptyText = "No purchase records yet.",
}) {
  const memberOptions = members.map(fullName);
  const fallbackName = initialCustomerName || memberOptions[0] || "";
  const [form, setForm] = useState({ customerName: fallbackName, ticketType: TICKET_TYPES[0].name, quantity: 1 });
  const [formError, setFormError] = useState("");

  const selectedTicket = ticketMeta(form.ticketType);
  const quantity = Number(form.quantity) || 0;
  const totalPrice = quantity > 0 ? selectedTicket.price * quantity : 0;
  const visiblePurchases = showAllRecords ? purchases : purchases.filter((purchase) => purchase.customerName === initialCustomerName);
  const ticketsSold = visiblePurchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const totalRevenue = visiblePurchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0);

  const T = {
    pageTitle: { fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
    subtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
    card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, marginBottom: 12 },
    statCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px" },
    label: { fontSize: 12, color: "#64748b", marginBottom: 5, display: "block" },
    input: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#1e293b", fontSize: 13, boxSizing: "border-box" },
    select: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#1e293b", fontSize: 13, boxSizing: "border-box" },
    saveBtn: { padding: "8px 16px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },
    pill: (bg, text) => ({ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: text }),
  };

  const resetForm = () => {
    setForm({ customerName: fallbackName, ticketType: TICKET_TYPES[0].name, quantity: 1 });
    setFormError("");
  };

  const handlePurchase = () => {
    const customerName = form.customerName.trim();
    if (!customerName) {
      setFormError("Please select or enter a customer name.");
      return;
    }
    if (quantity < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }

    onAddPurchase({
      customerName,
      ticketType: selectedTicket.name,
      quantity,
      unitPrice: selectedTicket.price,
      totalPrice,
      paymentStatus: "Paid",
    });
    resetForm();
  };

  return (
    <>
      <div style={T.pageTitle}>{pageTitle}</div>
      <div style={T.subtitle}>{subtitle}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Purchase Records", value: visiblePurchases.length, color: "#2563eb" },
          { label: "Tickets Sold", value: ticketsSold, color: "#15803d" },
          { label: "Revenue", value: formatCurrency(totalRevenue), color: "#a16207" },
        ].map((stat) => (
          <div key={stat.label} style={T.statCard}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(290px,1.15fr) minmax(260px,0.85fr)", gap: 16, alignItems: "start", marginBottom: 20 }}>
        <div style={T.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Create Purchase</div>

          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Customer Name</label>
            {lockCustomer ? (
              <input style={{ ...T.input, color: "#64748b" }} value={form.customerName} disabled />
            ) : memberOptions.length > 0 ? (
              <select style={T.select} value={form.customerName} onChange={(e) => { setForm((prev) => ({ ...prev, customerName: e.target.value })); setFormError(""); }}>
                {memberOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            ) : (
              <input style={T.input} value={form.customerName} placeholder="Enter customer name" onChange={(e) => { setForm((prev) => ({ ...prev, customerName: e.target.value })); setFormError(""); }} />
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Ticket Type</label>
            <select style={T.select} value={form.ticketType} onChange={(e) => { setForm((prev) => ({ ...prev, ticketType: e.target.value })); setFormError(""); }}>
              {TICKET_TYPES.map((ticket) => <option key={ticket.name} value={ticket.name}>{ticket.name} - {formatCurrency(ticket.price)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={T.label}>Quantity</label>
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {[1, 2, 5].map((value) => (
                <button key={value} type="button" onClick={() => { setForm((prev) => ({ ...prev, quantity: value })); setFormError(""); }} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${Number(form.quantity) === value ? "#2563eb" : "#e2e8f0"}`, background: Number(form.quantity) === value ? "#eff6ff" : "#fff", color: Number(form.quantity) === value ? "#2563eb" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: Number(form.quantity) === value ? 600 : 400 }}>
                  {value}
                </button>
              ))}
            </div>
            <input type="number" min="1" style={T.input} value={form.quantity} onChange={(e) => { setForm((prev) => ({ ...prev, quantity: e.target.value })); setFormError(""); }} />
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 6 }}>
              <span>Unit Price</span>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{formatCurrency(selectedTicket.price)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
              <span>Total Price</span>
              <span style={{ fontWeight: 700, color: "#2563eb" }}>{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          {formError && <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 8, background: "#fee2e2", color: "#b91c1c", fontSize: 12, fontWeight: 500 }}>{formError}</div>}
          <button style={T.saveBtn} onClick={handlePurchase}>Purchase Tickets</button>
        </div>

        <div style={T.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 14 }}>Available Ticket Types</div>
          <div style={{ display: "grid", gap: 10 }}>
            {TICKET_TYPES.map((ticket) => {
              const active = form.ticketType === ticket.name;
              return (
                <div key={ticket.name} onClick={() => setForm((prev) => ({ ...prev, ticketType: ticket.name }))} style={{ border: `1.5px solid ${active ? ticket.color : "#e2e8f0"}`, background: active ? ticket.bg : "#fff", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{ticket.name}</div>
                    <span style={T.pill(ticket.bg, ticket.color)}>{formatCurrency(ticket.price)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{ticket.name === "Monthly Pass" ? "Best for regular gym visits" : "Quick pass for flexible gym access"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10 }}>{recordsTitle}</div>
      {visiblePurchases.length === 0 ? (
        <div style={{ ...T.card, textAlign: "center", color: "#94a3b8" }}>{emptyText}</div>
      ) : (
        visiblePurchases.map((purchase) => {
          const ticket = ticketMeta(purchase.ticketType);
          const status = paymentStatusColor(purchase.paymentStatus);
          return (
            <div key={purchase.purchaseId} style={T.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{purchase.purchaseId} | {purchase.purchaseDate}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{purchase.customerName}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={T.pill(ticket.bg, ticket.color)}>{purchase.ticketType}</span>
                  <span style={T.pill(status.bg, status.text)}>{purchase.paymentStatus}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10 }}>
                {[["Quantity", purchase.quantity], ["Unit Price", formatCurrency(purchase.unitPrice)], ["Total Price", formatCurrency(purchase.totalPrice)]].map(([label, value]) => (
                  <div key={label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

function MemberApp({ onLogout, ticketPurchases, onAddPurchase }) {
  const [activeTab, setActiveTab] = useState("memberships");
  const [classes, setClasses] = useState(initialClasses);
  const [selectedDay, setSelectedDay] = useState(0);

  const filtered = classes.filter((c) => c.day === selectedDay);
  const myBookings = classes.filter((c) => c.bookedByMe);
  const currentMemberName = fullName(CURRENT_MEMBER);
  const handleBook = (id) => setClasses((prev) => prev.map((c) => c.id === id ? { ...c, bookedByMe: true, booked: c.booked + 1 } : c));
  const handleCancel = (id) => setClasses((prev) => prev.map((c) => c.id === id ? { ...c, bookedByMe: false, booked: c.booked - 1 } : c));
  const spotsLeft = (c) => c.capacity - c.booked;
  const isFull = (c) => c.booked >= c.capacity;

  const C = {
    pageTitle: { fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
    subtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
    card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, marginBottom: 10 },
    badge: (full) => ({ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: full ? "#fee2e2" : "#dcfce7", color: full ? "#b91c1c" : "#15803d" }),
    dayBtn: (active) => ({ minWidth: 54, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`, cursor: "pointer", fontSize: 11, fontWeight: 600, background: active ? "#eff6ff" : "#fff", color: active ? "#2563eb" : "#94a3b8", textAlign: "center" }),
    progress: { height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden", margin: "4px 0" },
    bookBtn: (booked, full) => ({ padding: "6px 18px", borderRadius: 7, border: "none", cursor: booked || full ? "default" : "pointer", fontSize: 12, fontWeight: 600, background: booked ? "#dcfce7" : full ? "#f1f5f9" : "#2563eb", color: booked ? "#15803d" : full ? "#94a3b8" : "#fff" }),
    meta: { fontSize: 12, color: "#94a3b8" },
    statCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px", flex: 1 },
  };

  return (
    <AppShell role="member" onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "memberships" && (
        <>
          <div style={C.pageTitle}>My Membership</div>
          <div style={C.subtitle}>Your current plan and status</div>
          <div style={{ ...C.card, borderLeft: "4px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{CURRENT_MEMBER.membership}</div>
              <span style={{ ...membershipColor(CURRENT_MEMBER.membership), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{CURRENT_MEMBER.status}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Valid Until</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{CURRENT_MEMBER.expiry}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Member since {CURRENT_MEMBER.joined}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            {[["Booked Classes", myBookings.length, "#2563eb"], ["This Week", "3", "#15803d"], ["Days Active", "142", "#a16207"]].map(([label, value, color]) => (
              <div key={label} style={C.statCard}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "person" && (
        <>
          <div style={C.pageTitle}>My Profile</div>
          <div style={C.subtitle}>Your personal information</div>
          <div style={C.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#2563eb" }}>JD</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{currentMemberName}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{CURRENT_MEMBER.email}</div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#ede9fe", color: "#6d28d9", display: "inline-block", marginTop: 4 }}>{CURRENT_MEMBER.membership} Member</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Phone", CURRENT_MEMBER.phone], ["Email", CURRENT_MEMBER.email], ["Emergency Contact", CURRENT_MEMBER.emergencyContact], ["Emergency Phone", CURRENT_MEMBER.emergencyPhone]].map(([label, value]) => (
                <div key={label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "classes" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={C.pageTitle}>Class Schedule</div>
          </div>
          <div style={C.subtitle}>Browse and book available classes | Week of Mar 24-30</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
            {DAYS.map((day, index) => {
              const count = classes.filter((c) => c.day === index).length;
              return (
                <button key={index} style={C.dayBtn(selectedDay === index)} onClick={() => setSelectedDay(index)}>
                  <span style={{ fontSize: 15, fontWeight: 700, display: "block" }}>{index + 24}</span>
                  <span>{day}</span>
                  {count > 0 && <span style={{ display: "block", fontSize: 10, color: selectedDay === index ? "#2563eb" : "#cbd5e1" }}>{count}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>{FULL_DAYS[selectedDay]} | {filtered.length} class{filtered.length !== 1 ? "es" : ""}</div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No classes on this day</div>
            </div>
          ) : filtered.sort((a, b) => a.time.localeCompare(b.time)).map((cls) => {
            const pct = cls.booked / cls.capacity;
            const full = isFull(cls);
            return (
              <div key={cls.id} style={{ ...C.card, borderLeft: cls.bookedByMe ? "3px solid #2563eb" : "3px solid transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: cls.color, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{cls.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{cls.time} | {cls.duration} min</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {cls.bookedByMe && <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", background: "#dbeafe", padding: "2px 9px", borderRadius: 20 }}>Booked</span>}
                    <span style={C.badge(full)}>{full ? "Full" : `${spotsLeft(cls)} left`}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={C.meta}>Instructor: {cls.instructor}</span>
                  <span style={C.meta}>Room: {cls.room}</span>
                  <span style={C.meta}>Booked: {cls.booked}/{cls.capacity}</span>
                </div>
                <div style={C.progress}>
                  <div style={{ height: "100%", borderRadius: 3, background: full ? "#ef4444" : pct > 0.75 ? "#f59e0b" : "#2563eb", width: `${Math.min(100, pct * 100)}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={C.meta}>{full ? "Class is full" : `${spotsLeft(cls)} spot${spotsLeft(cls) !== 1 ? "s" : ""} available`}</span>
                  <button style={C.bookBtn(cls.bookedByMe, full)} onClick={() => !cls.bookedByMe && !full && handleBook(cls.id)}>
                    {cls.bookedByMe ? "Booked" : full ? "Full" : "Book Now"}
                  </button>
                </div>
              </div>
            );
          })}
          {myBookings.length > 0 && (
            <>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "24px 0 10px" }}>My Booked Classes</div>
              {myBookings.map((cls) => (
                <div key={cls.id} style={{ ...C.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${cls.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: cls.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{cls.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{DAYS[cls.day]} | {cls.time} | {cls.instructor}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 600 }}>Confirmed</span>
                    <button onClick={() => handleCancel(cls.id)} style={{ padding: "5px 11px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {activeTab === "tickets" && (
        <TicketPurchaseModule
          pageTitle="Buy Tickets"
          subtitle="Purchase gym passes and review your recent ticket history"
          purchases={ticketPurchases}
          onAddPurchase={onAddPurchase}
          initialCustomerName={currentMemberName}
          lockCustomer
          recordsTitle="My Purchase History"
          emptyText="You have not purchased any tickets yet."
        />
      )}
    </AppShell>
  );
}

function StaffApp({ onLogout, ticketPurchases, onAddPurchase }) {
  const [activeTab, setActiveTab] = useState("memberships");
  const [classes, setClasses] = useState(initialClasses);
  const [selectedDay, setSelectedDay] = useState(0);
  const [members, setMembers] = useState(initialMembers);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);
  const [newMember, setNewMember] = useState({ firstName: "", lastName: "", email: "", phone: "", membership: "Standard", status: "Active", joined: "", expiry: "", emergencyContact: "", emergencyPhone: "", notes: "", avatar: "#2563eb" });
  const [editingClass, setEditingClass] = useState(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showConfirmClass, setShowConfirmClass] = useState(null);
  const [newClass, setNewClass] = useState({ name: "", day: 0, time: "08:00", duration: 60, instructor: "", room: "", capacity: 15, color: "#2563eb" });

  const filtered = classes.filter((c) => c.day === selectedDay);
  const isFull = (c) => c.booked >= c.capacity;
  const spotsLeft = (c) => c.capacity - c.booked;

  const handleDeleteClass = (id) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setShowConfirmClass(null);
  };
  const handleAddClass = () => {
    const id = classes.length ? Math.max(...classes.map((c) => c.id)) + 1 : 1;
    setClasses((prev) => [...prev, { ...newClass, id, booked: 0, bookedByMe: false }]);
    setShowAddClass(false);
    setNewClass({ name: "", day: 0, time: "08:00", duration: 60, instructor: "", room: "", capacity: 15, color: "#2563eb" });
  };
  const handleSaveClass = () => {
    setClasses((prev) => prev.map((c) => c.id === editingClass.id ? editingClass : c));
    setEditingClass(null);
  };
  const handleSaveMember = (updatedMember) => {
    setMembers((prev) => prev.map((member) => member.id === updatedMember.id ? updatedMember : member));
    setEditingMember(null);
    if (viewingMember && viewingMember.id === updatedMember.id) setViewingMember(updatedMember);
  };
  const handleDeleteMember = (id) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
    setConfirmDeleteMember(null);
    if (viewingMember && viewingMember.id === id) setViewingMember(null);
  };
  const handleAddMember = () => {
    const id = members.length ? Math.max(...members.map((member) => member.id)) + 1 : 1;
    setMembers((prev) => [...prev, { ...newMember, id, bookedClasses: [] }]);
    setShowAddMember(false);
    setNewMember({ firstName: "", lastName: "", email: "", phone: "", membership: "Standard", status: "Active", joined: "", expiry: "", emergencyContact: "", emergencyPhone: "", notes: "", avatar: "#2563eb" });
  };

  const filteredMembers = members.filter((member) => {
    const query = memberSearch.toLowerCase();
    return (!query || `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase().includes(query)) && (memberFilter === "All" || member.status === memberFilter);
  });

  const totalBookings = classes.reduce((sum, c) => sum + c.booked, 0);
  const avgFill = Math.round((totalBookings / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100);

  const C = {
    pageTitle: { fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
    subtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
    card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, marginBottom: 10 },
    badge: (full) => ({ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: full ? "#fee2e2" : "#dcfce7", color: full ? "#b91c1c" : "#15803d" }),
    dayBtn: (active) => ({ minWidth: 54, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`, cursor: "pointer", fontSize: 11, fontWeight: 600, background: active ? "#eff6ff" : "#fff", color: active ? "#2563eb" : "#94a3b8", textAlign: "center" }),
    progress: { height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden", margin: "4px 0" },
    addBtn: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
    editBtn: { padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer", fontSize: 12 },
    deleteBtn: { padding: "5px 12px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 },
    meta: { fontSize: 12, color: "#94a3b8" },
    statCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px" },
    modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    modalBox: { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24, width: 440, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" },
    label: { fontSize: 12, color: "#64748b", marginBottom: 5, display: "block" },
    input: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#1e293b", fontSize: 13, boxSizing: "border-box" },
    select: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#1e293b", fontSize: 13 },
    textarea: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#1e293b", fontSize: 13, resize: "vertical", minHeight: 60, boxSizing: "border-box" },
    cancelBtn: { padding: "7px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer", fontSize: 13 },
    saveBtn: { padding: "7px 16px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },
    dangerBtn: { padding: "7px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 },
    divider: { fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", margin: "16px 0 10px", paddingBottom: 6, borderBottom: "1px solid #f1f5f9" },
    memberRow: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, cursor: "pointer" },
    avatar: (color) => ({ width: 38, height: 38, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color, flexShrink: 0 }),
    avatarLg: (color) => ({ width: 54, height: 54, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color }),
    pill: (bg, text) => ({ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: text }),
    detailField: { background: "#f8fafc", borderRadius: 8, padding: "10px 14px" },
  };

  return (
    <AppShell role="staff" onLogout={onLogout} activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setViewingMember(null); }}>
      {activeTab === "memberships" && (
        <>
          <div style={C.pageTitle}>Memberships</div>
          <div style={C.subtitle}>Overview of all membership plans and active members</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Members", value: members.length, sub: "registered", color: "#2563eb" },
              { label: "Active", value: members.filter((member) => member.status === "Active").length, sub: "members", color: "#15803d" },
              { label: "Expired", value: members.filter((member) => member.status === "Expired").length, sub: "need renewal", color: "#a16207" },
              { label: "Suspended", value: members.filter((member) => member.status === "Suspended").length, sub: "accounts", color: "#b91c1c" },
              { label: "Premium Plans", value: members.filter((member) => member.membership === "Premium").length, sub: "members", color: "#6d28d9" },
            ].map((stat) => (
              <div key={stat.label} style={C.statCard}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{stat.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 10 }}>Membership Breakdown</div>
          {["Premium", "Standard", "Basic"].map((plan) => {
            const count = members.filter((member) => member.membership === plan).length;
            const percent = Math.round((count / members.length) * 100);
            const colors = membershipColor(plan);
            return (
              <div key={plan} style={{ ...C.card, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={C.pill(colors.bg, colors.text)}>{plan}</span>
                    <span style={{ fontSize: 13, color: "#64748b" }}>{count} member{count !== 1 ? "s" : ""}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{percent}%</span>
                </div>
                <div style={C.progress}><div style={{ height: "100%", background: colors.text, borderRadius: 3, width: `${percent}%` }} /></div>
              </div>
            );
          })}
        </>
      )}

      {activeTab === "person" && !viewingMember && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={C.pageTitle}>Person</div>
            <button style={C.addBtn} onClick={() => setShowAddMember(true)}>+ Add Member</button>
          </div>
          <div style={C.subtitle}>{members.length} total | {members.filter((member) => member.status === "Active").length} active</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input style={{ flex: 1, minWidth: 180, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", color: "#1e293b", fontSize: 13 }} placeholder="Search name or email..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
            <div style={{ display: "flex", gap: 4 }}>
              {["All", "Active", "Expired", "Suspended"].map((filter) => (
                <button key={filter} style={{ padding: "7px 12px", borderRadius: 7, border: `1px solid ${memberFilter === filter ? "#2563eb" : "#e2e8f0"}`, background: memberFilter === filter ? "#eff6ff" : "#fff", color: memberFilter === filter ? "#2563eb" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: memberFilter === filter ? 600 : 400 }} onClick={() => setMemberFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>
          </div>
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}><div style={{ fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>No members found</div></div>
          ) : filteredMembers.map((member) => {
            const status = statusColor(member.status);
            const membership = membershipColor(member.membership);
            return (
              <div key={member.id} style={C.memberRow} onClick={() => setViewingMember(member)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={C.avatar(member.avatar)}>{avatarInitials(member)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{member.firstName} {member.lastName}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{member.email} | {member.phone}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={C.pill(membership.bg, membership.text)}>{member.membership}</span>
                  <span style={C.pill(status.bg, status.text)}>{member.status}</span>
                  <button style={C.editBtn} onClick={(e) => { e.stopPropagation(); setEditingMember({ ...member }); }}>Edit</button>
                  <button style={C.deleteBtn} onClick={(e) => { e.stopPropagation(); setConfirmDeleteMember(member.id); }}>Delete</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {activeTab === "person" && viewingMember && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button style={C.cancelBtn} onClick={() => setViewingMember(null)}>Back</button>
              <div style={C.pageTitle}>Member Profile</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={C.editBtn} onClick={() => setEditingMember({ ...viewingMember })}>Edit Profile</button>
              <button style={C.deleteBtn} onClick={() => setConfirmDeleteMember(viewingMember.id)}>Delete</button>
            </div>
          </div>
          <div style={C.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 4 }}>
              <div style={C.avatarLg(viewingMember.avatar)}>{avatarInitials(viewingMember)}</div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, color: "#1e293b" }}>{viewingMember.firstName} {viewingMember.lastName}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{viewingMember.email}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span style={C.pill(membershipColor(viewingMember.membership).bg, membershipColor(viewingMember.membership).text)}>{viewingMember.membership}</span>
                  <span style={C.pill(statusColor(viewingMember.status).bg, statusColor(viewingMember.status).text)}>{viewingMember.status}</span>
                </div>
              </div>
            </div>
            <div style={C.divider}>Contact</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
              {[["Phone", viewingMember.phone], ["Email", viewingMember.email], ["Emergency Contact", viewingMember.emergencyContact || "-"], ["Emergency Phone", viewingMember.emergencyPhone || "-"]].map(([label, value]) => (
                <div key={label} style={C.detailField}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={C.divider}>Membership</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
              {[["Plan", viewingMember.membership], ["Status", viewingMember.status], ["Member Since", viewingMember.joined || "-"], ["Expiry", viewingMember.expiry || "-"]].map(([label, value]) => (
                <div key={label} style={C.detailField}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={C.divider}>Booked Classes</div>
            {viewingMember.bookedClasses.length === 0 ? <div style={{ fontSize: 13, color: "#94a3b8" }}>No classes booked.</div> : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {viewingMember.bookedClasses.map((classId) => {
                  const cls = classes.find((item) => item.id === classId);
                  return cls ? (
                    <span key={classId} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#475569" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: cls.color, display: "inline-block" }} />
                      {cls.name} | {DAYS[cls.day]} {cls.time}
                    </span>
                  ) : null;
                })}
              </div>
            )}
            {viewingMember.notes && (<><div style={C.divider}>Staff Notes</div><div style={{ fontSize: 13, color: "#64748b", background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>{viewingMember.notes}</div></>)}
          </div>
        </>
      )}

      {activeTab === "classes" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={C.pageTitle}>Classes</div>
            <button style={C.addBtn} onClick={() => setShowAddClass(true)}>+ Add Class</button>
          </div>
          <div style={C.subtitle}>Manage all scheduled classes | Week of Mar 24-30</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
            {[{ label: "Total Classes", value: classes.length, color: "#2563eb" }, { label: "Total Bookings", value: totalBookings, color: "#15803d" }, { label: "Avg. Fill Rate", value: `${avgFill}%`, color: "#a16207" }, { label: "Full Classes", value: classes.filter(isFull).length, color: "#b91c1c" }].map((stat) => (
              <div key={stat.label} style={C.statCard}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
            {DAYS.map((day, index) => {
              const count = classes.filter((cls) => cls.day === index).length;
              return (
                <button key={index} style={C.dayBtn(selectedDay === index)} onClick={() => setSelectedDay(index)}>
                  <span style={{ fontSize: 15, fontWeight: 700, display: "block" }}>{index + 24}</span>
                  <span>{day}</span>
                  {count > 0 && <span style={{ display: "block", fontSize: 10, color: selectedDay === index ? "#2563eb" : "#cbd5e1" }}>{count}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>{FULL_DAYS[selectedDay]} | {filtered.length} class{filtered.length !== 1 ? "es" : ""}</div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}><div style={{ fontWeight: 600 }}>No classes | click "Add Class" to create one</div></div>
          ) : filtered.sort((a, b) => a.time.localeCompare(b.time)).map((cls) => {
            const pct = cls.booked / cls.capacity;
            const full = isFull(cls);
            return (
              <div key={cls.id} style={{ ...C.card, borderLeft: `3px solid ${cls.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{cls.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{cls.time} | {cls.duration} min | {cls.instructor} | {cls.room}</div>
                  </div>
                  <span style={C.badge(full)}>{full ? "Full" : `${spotsLeft(cls)} left`}</span>
                </div>
                <div style={C.progress}><div style={{ height: "100%", borderRadius: 3, background: full ? "#ef4444" : pct > 0.75 ? "#f59e0b" : "#2563eb", width: `${Math.min(100, pct * 100)}%` }} /></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={C.meta}>Booked: {cls.booked}/{cls.capacity}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={C.editBtn} onClick={() => setEditingClass({ ...cls })}>Edit</button>
                    <button style={C.deleteBtn} onClick={() => setShowConfirmClass(cls.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {activeTab === "tickets" && (
        <>
          <TicketPurchaseModule pageTitle="Ticket Purchase" subtitle="Sell passes, calculate totals automatically, and keep purchase records up to date" purchases={ticketPurchases} onAddPurchase={onAddPurchase} members={members} showAllRecords recordsTitle="All Purchase Records" emptyText="No ticket purchases have been recorded yet." />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "24px 0 10px" }}>Support Tickets</div>
          {SUPPORT_TICKETS.map((ticket) => {
            const priority = ticket.priority === "High" ? { bg: "#fee2e2", text: "#b91c1c" } : ticket.priority === "Medium" ? { bg: "#fef9c3", text: "#a16207" } : { bg: "#f1f5f9", text: "#475569" };
            const status = ticket.status === "Resolved" ? { bg: "#dcfce7", text: "#15803d" } : ticket.status === "In Progress" ? { bg: "#dbeafe", text: "#1d4ed8" } : { bg: "#fef9c3", text: "#a16207" };
            return (
              <div key={ticket.id} style={C.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{ticket.id} | {ticket.date}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{ticket.title}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span style={C.pill(priority.bg, priority.text)}>{ticket.priority}</span>
                    <span style={C.pill(status.bg, status.text)}>{ticket.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {activeTab === "history" && (
        <>
          <div style={C.pageTitle}>Facility History</div>
          <div style={C.subtitle}>Recent activity and system logs</div>
          {HISTORY_EVENTS.map((event, index) => (
            <div key={index} style={{ ...C.card, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: event.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#334155", flexShrink: 0 }}>{event.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{event.action}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{event.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{event.time}</div>
            </div>
          ))}
        </>
      )}

      {editingMember && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Edit Member Profile</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" }}>Personal Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["First Name", "firstName"], ["Last Name", "lastName"], ["Email", "email"], ["Phone", "phone"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 10 }}><label style={C.label}>{label}</label><input style={C.input} value={editingMember[key]} onChange={(e) => setEditingMember((prev) => ({ ...prev, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" }}>Emergency Contact</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Name", "emergencyContact"], ["Phone", "emergencyPhone"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 10 }}><label style={C.label}>{label}</label><input style={C.input} value={editingMember[key]} onChange={(e) => setEditingMember((prev) => ({ ...prev, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" }}>Membership</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Plan</label><select style={C.select} value={editingMember.membership} onChange={(e) => setEditingMember((prev) => ({ ...prev, membership: e.target.value }))}>{MEMBERSHIP_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Status</label><select style={C.select} value={editingMember.status} onChange={(e) => setEditingMember((prev) => ({ ...prev, status: e.target.value }))}>{MEMBER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Member Since</label><input style={C.input} value={editingMember.joined} placeholder="Jan 12, 2024" onChange={(e) => setEditingMember((prev) => ({ ...prev, joined: e.target.value }))} /></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Expiry Date</label><input style={C.input} value={editingMember.expiry} placeholder="Jan 12, 2026" onChange={(e) => setEditingMember((prev) => ({ ...prev, expiry: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={C.label}>Staff Notes</label><textarea style={C.textarea} value={editingMember.notes} placeholder="Internal notes..." onChange={(e) => setEditingMember((prev) => ({ ...prev, notes: e.target.value }))} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={C.cancelBtn} onClick={() => setEditingMember(null)}>Cancel</button>
              <button style={C.saveBtn} onClick={() => handleSaveMember(editingMember)}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Add New Member</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["First Name", "firstName"], ["Last Name", "lastName"], ["Email", "email"], ["Phone", "phone"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 10 }}><label style={C.label}>{label}</label><input style={C.input} value={newMember[key]} onChange={(e) => setNewMember((prev) => ({ ...prev, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Plan</label><select style={C.select} value={newMember.membership} onChange={(e) => setNewMember((prev) => ({ ...prev, membership: e.target.value }))}>{MEMBERSHIP_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Status</label><select style={C.select} value={newMember.status} onChange={(e) => setNewMember((prev) => ({ ...prev, status: e.target.value }))}>{MEMBER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={C.cancelBtn} onClick={() => setShowAddMember(false)}>Cancel</button>
              <button style={C.saveBtn} onClick={handleAddMember} disabled={!newMember.firstName || !newMember.email}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {(showAddClass || editingClass) && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>{showAddClass ? "Add New Class" : "Edit Class"}</div>
            {[["Class Name", "name", "text"], ["Instructor", "instructor", "text"], ["Room", "room", "text"], ["Time", "time", "time"], ["Duration (min)", "duration", "number"], ["Capacity", "capacity", "number"]].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={C.label}>{label}</label>
                <input type={type} style={C.input} value={showAddClass ? newClass[key] : editingClass[key]} onChange={(e) => { const value = type === "number" ? Number(e.target.value) : e.target.value; if (showAddClass) setNewClass((prev) => ({ ...prev, [key]: value })); else setEditingClass((prev) => ({ ...prev, [key]: value })); }} />
              </div>
            ))}
            {showAddClass && (
              <div style={{ marginBottom: 12 }}>
                <label style={C.label}>Day</label>
                <select style={C.select} value={newClass.day} onChange={(e) => setNewClass((prev) => ({ ...prev, day: Number(e.target.value) }))}>
                  {FULL_DAYS.map((day, index) => <option key={index} value={index}>{day}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={C.cancelBtn} onClick={() => { setShowAddClass(false); setEditingClass(null); }}>Cancel</button>
              <button style={C.saveBtn} onClick={showAddClass ? handleAddClass : handleSaveClass}>{showAddClass ? "Add Class" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmClass && (
        <div style={C.modal}>
          <div style={{ ...C.modalBox, width: 320, textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>Delete</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Delete this class?</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>This will remove the class and all bookings. This cannot be undone.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button style={C.cancelBtn} onClick={() => setShowConfirmClass(null)}>Cancel</button>
              <button style={C.dangerBtn} onClick={() => handleDeleteClass(showConfirmClass)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteMember && (
        <div style={C.modal}>
          <div style={{ ...C.modalBox, width: 320, textAlign: "center" }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>Warning</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 6 }}>Remove this member?</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>All data will be permanently removed.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button style={C.cancelBtn} onClick={() => setConfirmDeleteMember(null)}>Cancel</button>
              <button style={C.dangerBtn} onClick={() => handleDeleteMember(confirmDeleteMember)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function App() {
  const [role, setRole] = useState(null);
  const [ticketPurchases, setTicketPurchases] = useState(initialTicketPurchases);

  const handleAddPurchase = (purchase) => {
    setTicketPurchases((prev) => [{
      purchaseId: nextPurchaseId(prev),
      customerName: purchase.customerName,
      ticketType: purchase.ticketType,
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalPrice: purchase.totalPrice,
      purchaseDate: formatPurchaseDate(),
      paymentStatus: purchase.paymentStatus || "Paid",
    }, ...prev]);
  };

  if (!role) return <LoginScreen onLogin={setRole} />;
  if (role === "member") return <MemberApp onLogout={() => setRole(null)} ticketPurchases={ticketPurchases} onAddPurchase={handleAddPurchase} />;
  return <StaffApp onLogout={() => setRole(null)} ticketPurchases={ticketPurchases} onAddPurchase={handleAddPurchase} />;
}
