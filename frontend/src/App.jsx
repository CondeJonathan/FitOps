import LoginPage from "./pages/login/login.jsx";
import RegisterPage from "./pages/register/register.jsx";
import { useEffect, useState } from "react";
import MemberDashboard from "./pages/member-dashboard/member-dashboard.jsx";
import StaffDashboard from "./pages/staff-dashboard/staff-dashboard.jsx";
import { API_BASE } from "./api/config.js";

const STAFF_EMAIL_DOMAIN = "fitops.com";

const resolveRoleFromEmail = (email, fallbackRole = "member") => {
  const normalized = (email || "").trim().toLowerCase();
  if (normalized.endsWith(`@${STAFF_EMAIL_DOMAIN}`)) return "staff";
  return fallbackRole === "staff" ? "staff" : "member";
};

const readSavedUser = () => {
  const savedUser = localStorage.getItem("fitops_user");
  if (!savedUser) return null;

  try {
    const parsed = JSON.parse(savedUser);
    if (!parsed?.role) return null;

    return {
      ...parsed,
      role: resolveRoleFromEmail(parsed.email, parsed.role),
    };
  } catch {
    localStorage.removeItem("fitops_user");
    return null;
  }
};

export default function App() {
  const initialUser = readSavedUser();

  const [user, setUser] = useState(initialUser);
  const [view, setView] = useState(() => {
    if (!initialUser) return "login";
    return initialUser.role === "staff" ? "staff" : "member";
  });

  const [memberClasses, setMemberClasses] = useState([]);
  const [memberDashboardData, setMemberDashboardData] = useState({
    memberStatus: "Active",
    perks: [],
    upcomingCharge: null,
    previousCharges: [],
  });

  const goToDashboardForRole = (role) => {
    setView(role === "staff" ? "staff" : "member");
  };

  const handleAuthSuccess = (data) => {
    if (!data?.success) return;

    const normalizedEmail = (data.email || "").trim().toLowerCase();
    const resolvedRole = resolveRoleFromEmail(normalizedEmail, data.role || "member");

    const authUser = {
      name: data.name || "User",
      email: normalizedEmail,
      role: resolvedRole,
      position: data.position || null,
    };

    setUser(authUser);
    localStorage.setItem("fitops_user", JSON.stringify(authUser));
    goToDashboardForRole(resolvedRole);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("fitops_user");
    setView("login");
  };

  const refreshClassesForUser = async (email) => {
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE}/api/classes?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data?.success && Array.isArray(data.classes)) {
        setMemberClasses(data.classes);
      }
    } catch {}
  };

  const refreshMemberDashboard = async (email) => {
    if (!email) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/member/dashboard?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      if (!data?.success) return;

      setMemberDashboardData({
        memberStatus: data.memberStatus || "Active",
        perks: Array.isArray(data.perks) ? data.perks : [],
        upcomingCharge: data.upcomingCharge || null,
        previousCharges: Array.isArray(data.previousCharges)
          ? data.previousCharges
          : [],
      });
    } catch {}
  };

  const handleToggleClassEnrollment = async (classId) => {
    if (!user?.email) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/classes/${classId}/toggle-booking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        }
      );

      const data = await res.json();
      if (data?.success) {
        refreshClassesForUser(user.email);
      }
    } catch {}
  };

  useEffect(() => {
    if ((view === "login" || view === "register") && user?.role) {
      goToDashboardForRole(user.role);
    }
  }, [user, view]);

  useEffect(() => {
    if (user?.email) {
      refreshClassesForUser(user.email);
      refreshMemberDashboard(user.email);
    }
  }, [user?.email]);

  if (view === "member") {
    return (
      <MemberDashboard
        user={user}
        onLogout={handleLogout}
        onOpenAllClasses={() => refreshClassesForUser(user?.email)}
        classes={memberClasses}
        onToggleClass={handleToggleClassEnrollment}
        memberStatus={memberDashboardData.memberStatus}
        perks={memberDashboardData.perks}
        upcomingCharge={memberDashboardData.upcomingCharge}
        previousCharges={memberDashboardData.previousCharges}
      />
    );
  }

  if (view === "staff") {
    return <StaffDashboard user={user} onLogout={handleLogout} />;
  }

  if (view === "register") {
    return (
      <RegisterPage
        onGoToLogin={() => setView("login")}
        onRegisterSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <LoginPage
      onGoToRegister={() => setView("register")}
      onLoginSuccess={handleAuthSuccess}
    />
  );
}