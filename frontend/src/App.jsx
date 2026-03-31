import LoginPage from "../pages/login/login.jsx";
import RegisterPage from "../pages/register/register.jsx";
import { useEffect, useState } from "react";
import MemberDashboard from "../pages/member-dashboard/member-dashboard.jsx";
import StaffDashboard from "../pages/staff-dashboard/staff-dashboard.jsx";
import MemberClassesPage from "../pages/member-classes/member-classes.jsx";

const STAFF_EMAIL_DOMAIN = "fitops.com";
const API_BASE = "http://127.0.0.1:5000";

const resolveRoleFromEmail = (email, fallbackRole = "member") => {
  const normalized = (email || "").trim().toLowerCase();
  if (normalized.endsWith(`@${STAFF_EMAIL_DOMAIN}`)) return "staff";
  return fallbackRole === "staff" ? "staff" : "member";
};

const readSavedUser = () => {
  const savedUser = localStorage.getItem("fitops_user");
  if (!savedUser) return null;
  try {
    const parsedUser = JSON.parse(savedUser);
    if (!parsedUser?.role) return null;
    return {
      ...parsedUser,
      role: resolveRoleFromEmail(parsedUser.email, parsedUser.role),
    };
  } catch {
    localStorage.removeItem("fitops_user");
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(readSavedUser);
  const [memberClasses, setMemberClasses] = useState([]);
  const [memberDashboardData, setMemberDashboardData] = useState({
    memberStatus: "Active",
    perks: [],
    upcomingCharge: null,
    previousCharges: [],
  });
  const [view, setView] = useState(() => {
    const savedUser = readSavedUser();
    if (!savedUser) return "login";
    return savedUser.role === "staff" ? "staff" : "member";
  });

  useEffect(() => {
    // Login/Register behave like route guards: authenticated users are always sent to dashboard.
    if ((view === "login" || view === "register") && user?.role) {
      goToDashboardForRole(user.role);
    }
  }, [user, view]);

  const goToDashboardForRole = (role) => {
    setView(role === "staff" ? "staff" : "member");
  };

  const handleAuthSuccess = (data) => {
    if (!data?.success) return;
    const normalizedEmail = (data?.email || "").trim().toLowerCase();
    const resolvedRole = resolveRoleFromEmail(normalizedEmail, data?.role || "member");
    const authUser = {
      name: data?.name || "User",
      email: normalizedEmail,
      role: resolvedRole,
      position: data?.position || null,
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

  const handleToggleClassEnrollment = (classId) => {
    if (!user?.email) return;
    fetch(`${API_BASE}/api/classes/${classId}/toggle-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;
        refreshClassesForUser(user.email);
      })
      .catch(() => {});
  };

  const refreshClassesForUser = (email) => {
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    fetch(`${API_BASE}/api/classes${qs}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success || !Array.isArray(data.classes)) return;
        setMemberClasses(data.classes);
      })
      .catch(() => {});
  };

  const refreshMemberDashboard = (email) => {
    if (!email) return;
    fetch(`${API_BASE}/api/member/dashboard?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) return;
        setMemberDashboardData({
          memberStatus: data.memberStatus || "Active",
          perks: Array.isArray(data.perks) ? data.perks : [],
          upcomingCharge: data.upcomingCharge || null,
          previousCharges: Array.isArray(data.previousCharges) ? data.previousCharges : [],
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshClassesForUser(user?.email || "");
    refreshMemberDashboard(user?.email || "");
  }, [user?.email]);

  if (view === "member") {
    return (
      <MemberDashboard
        user={user}
        onLogout={handleLogout}
        onOpenAllClasses={() => setView("member-classes")}
        classes={memberClasses}
        onToggleClass={handleToggleClassEnrollment}
        memberStatus={memberDashboardData.memberStatus}
        perks={memberDashboardData.perks}
        upcomingCharge={memberDashboardData.upcomingCharge}
        previousCharges={memberDashboardData.previousCharges}
      />
    );
  }

  if (view === "member-classes") {
    return (
      <MemberClassesPage
        user={user}
        onLogout={handleLogout}
        onBackToDashboard={() => setView("member")}
        classes={memberClasses}
        onToggleClass={handleToggleClassEnrollment}
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
        onRegisterSuccess={(data) => {
          console.log("Registered:", data);
          handleAuthSuccess(data);
        }}
      />
    );
  }

  return (
    <LoginPage
      onGoToRegister={() => setView("register")}
      onLoginSuccess={(data) => {
        console.log("Logged in:", data);
        handleAuthSuccess(data);
      }}
    />
  );
}

