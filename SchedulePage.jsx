import React, { useEffect, useState } from "react";

import LoginPage from "./frontend/pages/login/login";

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
const nameInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GX";
const SESSION_STORAGE_KEY = "fitops-schedule-session";
const CLASS_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#ef4444"];

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const titleize = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatShortDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const mondayDayIndex = (value) => {
  if (!value) return 0;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return (parsed.getDay() + 6) % 7;
};

const classAccent = (key = "") => {
  const value = String(key);
  const score = [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
  return CLASS_COLORS[score % CLASS_COLORS.length];
};

const splitMemberName = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Member", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const parseDurationMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 60;
  const [startHour = 0, startMinute = 0] = String(startTime).split(":").map(Number);
  const [endHour = 0, endMinute = 0] = String(endTime).split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  return end > start ? end - start : 60;
};

const endTimeFromDuration = (startTime, durationMinutes) => {
  const [startHour = 0, startMinute = 0] = String(startTime || "08:00").split(":").map(Number);
  const totalMinutes = startHour * 60 + startMinute + Number(durationMinutes || 60);
  const hour = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
};

const weekDateForDay = (dayIndex) => {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + Number(dayIndex || 0));
  return monday.toISOString().slice(0, 10);
};

const daysFromTodayIso = (days) => {
  const next = new Date();
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + Number(days || 0));
  return next.toISOString().slice(0, 10);
};

const mapApiSessionToUi = (item) => ({
  id: item.id,
  name: item.title,
  title: item.title,
  day: mondayDayIndex(item.date),
  date: item.date,
  time: item.start_time,
  startTime: item.start_time,
  endTime: item.end_time,
  duration: parseDurationMinutes(item.start_time, item.end_time),
  instructor: item.trainer_name,
  trainerId: item.trainer_id,
  room: item.room,
  capacity: item.capacity,
  booked: item.booked_count,
  color: classAccent(`${item.title}-${item.trainer_name}`),
  bookedByMe: Boolean(item.booked_by_me),
  description: item.description || "",
});

const mapApiMemberToUi = (item) => {
  const names = splitMemberName(item.name);
  return {
    id: item.id,
    firstName: names.firstName,
    lastName: names.lastName,
    name: item.name,
    email: item.email,
    phone: item.phone || "-",
    membership: item.membership_label || titleize(item.membership_type),
    status: item.status_label || titleize(item.status),
    joined: formatShortDate(item.join_date),
    expiry: formatShortDate(item.expiry_date),
    joinDateValue: item.join_date,
    expiryDateValue: item.expiry_date,
    emergencyContact: item.emergency_contact || "",
    emergencyPhone: item.emergency_phone || "",
    notes: item.notes || "",
    avatar: classAccent(item.name || item.email || item.id),
    bookedClasses: item.booked_class_ids || [],
    bookingCount: item.booking_count || 0,
  };
};

const mapApiTicketToUi = (item) => ({
  id: `T-${String(item.id).padStart(3, "0")}`,
  title: item.subject,
  priority: item.urgency_label || titleize(item.urgency),
  status: item.status_label || titleize(item.status),
  date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
  staffName: item.staff_name,
  description: item.description || "",
});

const mapApiMaintenanceToEvent = (item) => ({
  time: formatShortDate(item.log_date),
  action: `${item.area} maintenance`,
  detail: item.description,
  icon: "MT",
  color: item.status === "completed" ? "#dcfce7" : item.status === "in_progress" ? "#dbeafe" : "#fee2e2",
});

const mapApiTicketToEvent = (item) => ({
  time: item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-",
  action: `Ticket ${item.status_label || titleize(item.status)}`,
  detail: item.subject,
  icon: "TK",
  color: item.status === "closed" ? "#dcfce7" : "#fef3c7",
});

const toMembershipValue = (value = "") => String(value).trim().toLowerCase();
const toStatusValue = (value = "") => String(value).trim().toLowerCase();

async function apiRequest(session, path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(path, { ...options, headers, body });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}.`);
  }
  return payload;
}

async function loadMemberView(session) {
  const memberId = session?.profile?.id;
  const [dashboard, sessions, bookings, payments] = await Promise.all([
    apiRequest(session, `/api/dashboard/member/${memberId}`),
    apiRequest(session, "/api/sessions?page_size=100"),
    apiRequest(session, "/api/bookings?page_size=100"),
    apiRequest(session, "/api/payments?page_size=100"),
  ]);

  return {
    member: mapApiMemberToUi(dashboard.member),
    stats: dashboard.stats || {},
    upcomingBookings: dashboard.upcoming_bookings || [],
    bookings: bookings.items || [],
    classes: (sessions.items || []).map(mapApiSessionToUi),
    payments: payments.items || [],
  };
}

async function loadStaffView(session) {
  const [dashboard, members, sessions, tickets, maintenance, staff] = await Promise.all([
    apiRequest(session, "/api/dashboard/staff"),
    apiRequest(session, "/api/members?page_size=100"),
    apiRequest(session, "/api/sessions?page_size=100"),
    apiRequest(session, "/api/tickets?page_size=100"),
    apiRequest(session, "/api/maintenance?page_size=100"),
    apiRequest(session, "/api/staff?page_size=100"),
  ]);

  return {
    stats: dashboard.stats || {},
    members: (members.items || []).map(mapApiMemberToUi),
    classes: (sessions.items || []).map(mapApiSessionToUi),
    tickets: tickets.items || [],
    supportTickets: (tickets.items || []).map(mapApiTicketToUi),
    maintenance: maintenance.items || [],
    historyEvents: [...(maintenance.items || []).map(mapApiMaintenanceToEvent), ...(tickets.items || []).map(mapApiTicketToEvent)]
      .sort((left, right) => String(right.time).localeCompare(String(left.time))),
    trainers: staff.items || [],
  };
}

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
  return <LoginPage onLoginSuccess={onLogin} />;
}

function AppShell({ role, session, onLogout, activeTab, setActiveTab, children }) {
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
  const displayName = session?.name || (role === "staff" ? "Staff User" : "John Doe");
  const profileLabel = role === "staff"
    ? session?.profile?.position_label || "Administrator"
    : session?.profile?.membership_label
      ? `${session.profile.membership_label} Member`
      : "Premium Member";
  const avatarLabel = nameInitials(displayName);

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
              {avatarLabel}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", lineHeight: 1 }}>{displayName}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{profileLabel}</div>
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

function MemberApp({ session, onLogout, ticketPurchases, onAddPurchase }) {
  const [activeTab, setActiveTab] = useState("memberships");
  const [classes, setClasses] = useState(initialClasses);
  const [selectedDay, setSelectedDay] = useState(0);
  const [member, setMember] = useState(mapApiMemberToUi(session.profile || {}));
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busySessionId, setBusySessionId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const nextData = await loadMemberView(session);
      setMember(nextData.member);
      setClasses(nextData.classes);
      setBookings(nextData.bookings);
      setPayments(nextData.payments);
      setStats(nextData.stats);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const filtered = classes.filter((item) => item.day === selectedDay);
  const myBookings = classes.filter((item) => item.bookedByMe);
  const unpaidPayments = payments.filter((item) => item.status !== "paid");
  const currentMemberName = member?.name || session.name;
  const spotsLeft = (item) => item.capacity - item.booked;
  const isFull = (item) => item.booked >= item.capacity;

  const handleBook = async (id) => {
    setBusySessionId(id);
    try {
      await apiRequest(session, `/api/sessions/${id}/book`, { method: "POST", body: {} });
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusySessionId(null);
    }
  };

  const handleCancel = async (id) => {
    const booking = bookings.find((item) => item.session_id === id && item.status === "booked");
    if (!booking) {
      setError("Could not find the booking to cancel.");
      return;
    }

    setBusySessionId(id);
    try {
      await apiRequest(session, `/api/bookings/${booking.id}/cancel`, { method: "POST", body: {} });
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusySessionId(null);
    }
  };

  const C = {
    pageTitle: { fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
    subtitle: { fontSize: 13, color: "#64748b", marginBottom: 20 },
    card: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16, marginBottom: 10 },
    badge: (full) => ({ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: full ? "#fee2e2" : "#dcfce7", color: full ? "#b91c1c" : "#15803d" }),
    dayBtn: (active) => ({ minWidth: 54, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`, cursor: "pointer", fontSize: 11, fontWeight: 600, background: active ? "#eff6ff" : "#fff", color: active ? "#2563eb" : "#94a3b8", textAlign: "center" }),
    progress: { height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden", margin: "4px 0" },
    bookBtn: (booked, full, disabled) => ({ padding: "6px 18px", borderRadius: 7, border: "none", cursor: booked || full || disabled ? "default" : "pointer", fontSize: 12, fontWeight: 600, background: booked ? "#dcfce7" : full ? "#f1f5f9" : disabled ? "#bfdbfe" : "#2563eb", color: booked ? "#15803d" : full ? "#94a3b8" : "#fff" }),
    meta: { fontSize: 12, color: "#94a3b8" },
    statCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px", flex: 1 },
    alert: { background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 },
    loading: { color: "#64748b", fontSize: 13, marginBottom: 12 },
  };

  return (
    <AppShell role="member" session={session} onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {error && <div style={C.alert}>{error}</div>}
      {loading && <div style={C.loading}>Syncing your latest membership and booking data…</div>}

      {activeTab === "memberships" && (
        <>
          <div style={C.pageTitle}>My Membership</div>
          <div style={C.subtitle}>Live status from your member dashboard</div>
          <div style={{ ...C.card, borderLeft: "4px solid #2563eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>{member.membership}</div>
              <span style={{ ...membershipColor(member.membership), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{member.status}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Valid Until</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>{member.expiry}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Member since {member.joined}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            {[
              ["Booked Classes", stats.booked_classes ?? myBookings.length, "#2563eb"],
              ["Payments Due", stats.payments_due ?? unpaidPayments.length, "#a16207"],
              ["Open Sessions", classes.filter((item) => item.available && !item.bookedByMe).length, "#15803d"],
            ].map(([label, value, color]) => (
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
          <div style={C.subtitle}>Your personal information from the backend profile record</div>
          <div style={C.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#2563eb" }}>{nameInitials(member.name)}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{member.name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{member.email}</div>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#ede9fe", color: "#6d28d9", display: "inline-block", marginTop: 4 }}>{member.membership} Member</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Phone", member.phone], ["Email", member.email], ["Emergency Contact", member.emergencyContact || "-"], ["Emergency Phone", member.emergencyPhone || "-"]].map(([label, value]) => (
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
          <div style={C.subtitle}>Available sessions and your active bookings from the API</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
            {DAYS.map((day, index) => {
              const count = classes.filter((item) => item.day === index).length;
              return (
                <button key={index} style={C.dayBtn(selectedDay === index)} onClick={() => setSelectedDay(index)}>
                  <span style={{ fontSize: 15, fontWeight: 700, display: "block" }}>{count}</span>
                  <span>{day}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>{FULL_DAYS[selectedDay]} | {filtered.length} class{filtered.length !== 1 ? "es" : ""}</div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No classes on this day</div>
            </div>
          ) : filtered.sort((left, right) => left.time.localeCompare(right.time)).map((cls) => {
            const pct = cls.booked / cls.capacity;
            const full = isFull(cls);
            const busy = busySessionId === cls.id;
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
                  <span style={C.meta}>Date: {formatShortDate(cls.date)}</span>
                </div>
                <div style={C.progress}>
                  <div style={{ height: "100%", borderRadius: 3, background: full ? "#ef4444" : pct > 0.75 ? "#f59e0b" : "#2563eb", width: `${Math.min(100, pct * 100)}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={C.meta}>{full ? "Class is full" : `${spotsLeft(cls)} spot${spotsLeft(cls) !== 1 ? "s" : ""} available`}</span>
                  <button
                    style={C.bookBtn(cls.bookedByMe, full, busy)}
                    onClick={() => {
                      if (busy) return;
                      if (cls.bookedByMe) handleCancel(cls.id);
                      else if (!full) handleBook(cls.id);
                    }}
                  >
                    {busy ? "Working..." : cls.bookedByMe ? "Cancel Booking" : full ? "Full" : "Book Now"}
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
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatShortDate(cls.date)} | {cls.time} | {cls.instructor}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 600 }}>Confirmed</span>
                    <button onClick={() => handleCancel(cls.id)} style={{ padding: "5px 11px", borderRadius: 6, border: "1px solid #fecaca", background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 12 }} disabled={busySessionId === cls.id}>Cancel</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {activeTab === "tickets" && (
        <>
          <TicketPurchaseModule
            pageTitle="Buy Tickets"
            subtitle="Purchase gym passes locally and review your backend payment history below"
            purchases={ticketPurchases}
            onAddPurchase={onAddPurchase}
            initialCustomerName={currentMemberName}
            lockCustomer
            recordsTitle="My Purchase History"
            emptyText="You have not purchased any tickets yet."
          />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "24px 0 10px" }}>Membership Payments</div>
          {payments.length === 0 ? (
            <div style={C.card}>No payment records found.</div>
          ) : payments.map((payment) => {
            const paid = payment.status === "paid";
            return (
              <div key={payment.id} style={C.card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Payment #{payment.id}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>${Number(payment.amount).toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Due {formatShortDate(payment.due_date)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: paid ? "#dcfce7" : "#fef3c7", color: paid ? "#15803d" : "#a16207" }}>
                      {payment.status_label || titleize(payment.status)}
                    </span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>{payment.note || "Membership billing record"}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </AppShell>
  );
}

function StaffApp({ session, onLogout, ticketPurchases, onAddPurchase }) {
  const [activeTab, setActiveTab] = useState("memberships");
  const [classes, setClasses] = useState(initialClasses);
  const [selectedDay, setSelectedDay] = useState(0);
  const [members, setMembers] = useState(initialMembers);
  const [supportTickets, setSupportTickets] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [stats, setStats] = useState({});
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(null);
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "demo123",
    membership: "Standard",
    status: "Active",
    joinDateValue: daysFromTodayIso(0),
    expiryDateValue: daysFromTodayIso(365),
    emergencyContact: "",
    emergencyPhone: "",
    notes: "",
    avatar: "#2563eb",
  });
  const [editingClass, setEditingClass] = useState(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showConfirmClass, setShowConfirmClass] = useState(null);
  const [newClass, setNewClass] = useState({
    name: "",
    date: weekDateForDay(0),
    day: 0,
    time: "08:00",
    duration: 60,
    trainerId: "",
    instructor: "",
    room: "",
    capacity: 15,
    color: "#2563eb",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const nextData = await loadStaffView(session);
      setStats(nextData.stats);
      setMembers(nextData.members);
      setClasses(nextData.classes);
      setSupportTickets(nextData.supportTickets);
      setHistoryEvents(nextData.historyEvents);
      setTrainers(nextData.trainers);
      if (viewingMember) {
        const refreshedMember = nextData.members.find((item) => item.id === viewingMember.id);
        setViewingMember(refreshedMember || null);
      }
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  useEffect(() => {
    if (trainers.length > 0 && !newClass.trainerId) {
      const defaultTrainer = trainers[0];
      setNewClass((prev) => ({
        ...prev,
        trainerId: defaultTrainer.id,
        instructor: defaultTrainer.name,
      }));
    }
  }, [trainers]);

  const filtered = classes.filter((item) => item.day === selectedDay);
  const isFull = (item) => item.booked >= item.capacity;
  const spotsLeft = (item) => item.capacity - item.booked;

  const handleDeleteClass = async (id) => {
    try {
      await apiRequest(session, `/api/sessions/${id}`, { method: "DELETE" });
      setShowConfirmClass(null);
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleAddClass = async () => {
    try {
      const trainerId = Number(newClass.trainerId);
      if (!newClass.name || !newClass.room || !trainerId) {
        throw new Error("Class name, trainer, and room are required.");
      }
      await apiRequest(session, "/api/sessions", {
        method: "POST",
        body: {
          title: newClass.name,
          trainer_id: trainerId,
          date: newClass.date || weekDateForDay(newClass.day),
          start_time: newClass.time,
          end_time: endTimeFromDuration(newClass.time, newClass.duration),
          room: newClass.room,
          capacity: Number(newClass.capacity),
          description: newClass.description || "",
        },
      });
      setShowAddClass(false);
      setNewClass({
        name: "",
        date: weekDateForDay(0),
        day: 0,
        time: "08:00",
        duration: 60,
        trainerId: trainers[0]?.id || "",
        instructor: trainers[0]?.name || "",
        room: "",
        capacity: 15,
        color: "#2563eb",
        description: "",
      });
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleSaveClass = async () => {
    try {
      await apiRequest(session, `/api/sessions/${editingClass.id}`, {
        method: "PATCH",
        body: {
          title: editingClass.name,
          trainer_id: Number(editingClass.trainerId),
          date: editingClass.date || weekDateForDay(editingClass.day),
          start_time: editingClass.time,
          end_time: endTimeFromDuration(editingClass.time, editingClass.duration),
          room: editingClass.room,
          capacity: Number(editingClass.capacity),
          description: editingClass.description || "",
        },
      });
      setEditingClass(null);
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleSaveMember = async (updatedMember) => {
    try {
      await apiRequest(session, `/api/members/${updatedMember.id}`, {
        method: "PATCH",
        body: {
          name: `${updatedMember.firstName} ${updatedMember.lastName}`.trim(),
          email: updatedMember.email,
          phone: updatedMember.phone,
          membership_type: toMembershipValue(updatedMember.membership),
          status: toStatusValue(updatedMember.status),
          join_date: updatedMember.joinDateValue,
          expiry_date: updatedMember.expiryDateValue,
          emergency_contact: updatedMember.emergencyContact,
          emergency_phone: updatedMember.emergencyPhone,
          notes: updatedMember.notes,
        },
      });
      setEditingMember(null);
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await apiRequest(session, `/api/members/${id}`, { method: "DELETE" });
      setConfirmDeleteMember(null);
      setViewingMember(null);
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const handleAddMember = async () => {
    try {
      if (!newMember.firstName || !newMember.email || !newMember.password) {
        throw new Error("First name, email, and password are required.");
      }
      await apiRequest(session, "/api/members", {
        method: "POST",
        body: {
          name: `${newMember.firstName} ${newMember.lastName}`.trim(),
          email: newMember.email,
          password: newMember.password,
          phone: newMember.phone,
          membership_type: toMembershipValue(newMember.membership),
          status: toStatusValue(newMember.status),
          join_date: newMember.joinDateValue,
          expiry_date: newMember.expiryDateValue,
          emergency_contact: newMember.emergencyContact,
          emergency_phone: newMember.emergencyPhone,
          notes: newMember.notes,
        },
      });
      setShowAddMember(false);
      setNewMember({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "demo123",
        membership: "Standard",
        status: "Active",
        joinDateValue: daysFromTodayIso(0),
        expiryDateValue: daysFromTodayIso(365),
        emergencyContact: "",
        emergencyPhone: "",
        notes: "",
        avatar: "#2563eb",
      });
      await loadData();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = memberSearch.toLowerCase();
    return (!query || `${member.firstName} ${member.lastName} ${member.email}`.toLowerCase().includes(query)) && (memberFilter === "All" || member.status === memberFilter);
  });

  const totalBookings = classes.reduce((sum, item) => sum + item.booked, 0);
  const totalCapacity = classes.reduce((sum, item) => sum + item.capacity, 0);
  const avgFill = totalCapacity ? Math.round((totalBookings / totalCapacity) * 100) : 0;

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
    select: { width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", color: "#1e293b", fontSize: 13, boxSizing: "border-box" },
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
    alert: { background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13 },
    loading: { color: "#64748b", fontSize: 13, marginBottom: 12 },
  };

  return (
    <AppShell role="staff" session={session} onLogout={onLogout} activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setViewingMember(null); }}>
      {error && <div style={C.alert}>{error}</div>}
      {loading && <div style={C.loading}>Refreshing members, classes, tickets, and facility logs…</div>}

      {activeTab === "memberships" && (
        <>
          <div style={C.pageTitle}>Memberships</div>
          <div style={C.subtitle}>Overview of all membership plans and active members</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Members", value: stats.total_members ?? members.length, sub: "registered", color: "#2563eb" },
              { label: "Active", value: stats.active_members ?? members.filter((member) => member.status === "Active").length, sub: "members", color: "#15803d" },
              { label: "Expired", value: stats.expired_members ?? members.filter((member) => member.status === "Expired").length, sub: "need renewal", color: "#a16207" },
              { label: "Sessions", value: stats.total_sessions ?? classes.length, sub: "scheduled", color: "#6d28d9" },
              { label: "Bookings", value: stats.total_bookings ?? totalBookings, sub: "active", color: "#0f766e" },
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
            const percent = members.length ? Math.round((count / members.length) * 100) : 0;
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
                      {cls.name} | {formatShortDate(cls.date)} {cls.time}
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
          <div style={C.subtitle}>Manage all scheduled classes from the backend API</div>
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
                  <span style={{ fontSize: 15, fontWeight: 700, display: "block" }}>{count}</span>
                  <span>{day}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>{FULL_DAYS[selectedDay]} | {filtered.length} class{filtered.length !== 1 ? "es" : ""}</div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}><div style={{ fontWeight: 600 }}>No classes on this day</div></div>
          ) : filtered.sort((left, right) => left.time.localeCompare(right.time)).map((cls) => {
            const pct = cls.booked / cls.capacity;
            const full = isFull(cls);
            return (
              <div key={cls.id} style={{ ...C.card, borderLeft: `3px solid ${cls.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{cls.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatShortDate(cls.date)} | {cls.time} | {cls.duration} min | {cls.instructor} | {cls.room}</div>
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
          {supportTickets.length === 0 ? (
            <div style={C.card}>No support tickets available.</div>
          ) : supportTickets.map((ticket) => {
            const priority = ticket.priority === "High" ? { bg: "#fee2e2", text: "#b91c1c" } : ticket.priority === "Medium" ? { bg: "#fef9c3", text: "#a16207" } : { bg: "#f1f5f9", text: "#475569" };
            const status = ticket.status === "Closed" ? { bg: "#dcfce7", text: "#15803d" } : ticket.status === "In Progress" ? { bg: "#dbeafe", text: "#1d4ed8" } : { bg: "#fef9c3", text: "#a16207" };
            return (
              <div key={ticket.id} style={C.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>{ticket.id} | {ticket.date}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{ticket.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{ticket.description}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
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
          <div style={C.subtitle}>Recent maintenance and support activity</div>
          {historyEvents.length === 0 ? (
            <div style={C.card}>No facility history entries yet.</div>
          ) : historyEvents.map((event, index) => (
            <div key={`${event.action}-${index}`} style={{ ...C.card, display: "flex", alignItems: "center", gap: 14 }}>
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
              <div style={{ marginBottom: 10 }}><label style={C.label}>Member Since</label><input type="date" style={C.input} value={editingMember.joinDateValue || ""} onChange={(e) => setEditingMember((prev) => ({ ...prev, joinDateValue: e.target.value, joined: formatShortDate(e.target.value) }))} /></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Expiry Date</label><input type="date" style={C.input} value={editingMember.expiryDateValue || ""} onChange={(e) => setEditingMember((prev) => ({ ...prev, expiryDateValue: e.target.value, expiry: formatShortDate(e.target.value) }))} /></div>
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
            <div style={{ marginBottom: 10 }}>
              <label style={C.label}>Initial Password</label>
              <input style={C.input} value={newMember.password} onChange={(e) => setNewMember((prev) => ({ ...prev, password: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Plan</label><select style={C.select} value={newMember.membership} onChange={(e) => setNewMember((prev) => ({ ...prev, membership: e.target.value }))}>{MEMBERSHIP_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Status</label><select style={C.select} value={newMember.status} onChange={(e) => setNewMember((prev) => ({ ...prev, status: e.target.value }))}>{MEMBER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Member Since</label><input type="date" style={C.input} value={newMember.joinDateValue} onChange={(e) => setNewMember((prev) => ({ ...prev, joinDateValue: e.target.value }))} /></div>
              <div style={{ marginBottom: 10 }}><label style={C.label}>Expiry Date</label><input type="date" style={C.input} value={newMember.expiryDateValue} onChange={(e) => setNewMember((prev) => ({ ...prev, expiryDateValue: e.target.value }))} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Emergency Contact", "emergencyContact"], ["Emergency Phone", "emergencyPhone"]].map(([label, key]) => (
                <div key={key} style={{ marginBottom: 10 }}><label style={C.label}>{label}</label><input style={C.input} value={newMember[key]} onChange={(e) => setNewMember((prev) => ({ ...prev, [key]: e.target.value }))} /></div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}><label style={C.label}>Staff Notes</label><textarea style={C.textarea} value={newMember.notes} onChange={(e) => setNewMember((prev) => ({ ...prev, notes: e.target.value }))} /></div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={C.cancelBtn} onClick={() => setShowAddMember(false)}>Cancel</button>
              <button style={C.saveBtn} onClick={handleAddMember} disabled={!newMember.firstName || !newMember.email || !newMember.password}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {(showAddClass || editingClass) && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>{showAddClass ? "Add New Class" : "Edit Class"}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={C.label}>Class Name</label>
              <input style={C.input} value={showAddClass ? newClass.name : editingClass.name} onChange={(e) => { const value = e.target.value; if (showAddClass) setNewClass((prev) => ({ ...prev, name: value })); else setEditingClass((prev) => ({ ...prev, name: value })); }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={C.label}>Trainer</label>
              <select style={C.select} value={showAddClass ? newClass.trainerId : editingClass.trainerId} onChange={(e) => {
                const selectedTrainer = trainers.find((trainer) => String(trainer.id) === String(e.target.value));
                if (showAddClass) {
                  setNewClass((prev) => ({ ...prev, trainerId: Number(e.target.value), instructor: selectedTrainer?.name || "" }));
                } else {
                  setEditingClass((prev) => ({ ...prev, trainerId: Number(e.target.value), instructor: selectedTrainer?.name || "" }));
                }
              }}>
                <option value="">Select trainer</option>
                {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={C.label}>Date</label>
                <input type="date" style={C.input} value={showAddClass ? newClass.date : editingClass.date} onChange={(e) => {
                  const value = e.target.value;
                  if (showAddClass) setNewClass((prev) => ({ ...prev, date: value, day: mondayDayIndex(value) }));
                  else setEditingClass((prev) => ({ ...prev, date: value, day: mondayDayIndex(value) }));
                }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={C.label}>Start Time</label>
                <input type="time" style={C.input} value={showAddClass ? newClass.time : editingClass.time} onChange={(e) => {
                  const value = e.target.value;
                  if (showAddClass) setNewClass((prev) => ({ ...prev, time: value }));
                  else setEditingClass((prev) => ({ ...prev, time: value }));
                }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={C.label}>Duration (min)</label>
                <input type="number" style={C.input} value={showAddClass ? newClass.duration : editingClass.duration} onChange={(e) => {
                  const value = Number(e.target.value);
                  if (showAddClass) setNewClass((prev) => ({ ...prev, duration: value }));
                  else setEditingClass((prev) => ({ ...prev, duration: value }));
                }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={C.label}>Capacity</label>
                <input type="number" style={C.input} value={showAddClass ? newClass.capacity : editingClass.capacity} onChange={(e) => {
                  const value = Number(e.target.value);
                  if (showAddClass) setNewClass((prev) => ({ ...prev, capacity: value }));
                  else setEditingClass((prev) => ({ ...prev, capacity: value }));
                }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={C.label}>Room</label>
              <input style={C.input} value={showAddClass ? newClass.room : editingClass.room} onChange={(e) => {
                const value = e.target.value;
                if (showAddClass) setNewClass((prev) => ({ ...prev, room: value }));
                else setEditingClass((prev) => ({ ...prev, room: value }));
              }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={C.label}>Description</label>
              <textarea style={C.textarea} value={showAddClass ? newClass.description : editingClass.description || ""} onChange={(e) => {
                const value = e.target.value;
                if (showAddClass) setNewClass((prev) => ({ ...prev, description: value }));
                else setEditingClass((prev) => ({ ...prev, description: value }));
              }} />
            </div>
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
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>The backend may block this if the member still has active bookings or unpaid balances.</div>
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
  const [session, setSession] = useState(() => {
    if (typeof window === "undefined") return null;
    return safeJsonParse(window.localStorage.getItem(SESSION_STORAGE_KEY), null);
  });
  const [ticketPurchases, setTicketPurchases] = useState(initialTicketPurchases);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

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

  if (!session) return <LoginScreen onLogin={setSession} />;
  if (session.role === "member") {
    return <MemberApp session={session} onLogout={() => setSession(null)} ticketPurchases={ticketPurchases} onAddPurchase={handleAddPurchase} />;
  }
  return <StaffApp session={session} onLogout={() => setSession(null)} ticketPurchases={ticketPurchases} onAddPurchase={handleAddPurchase} />;
}
