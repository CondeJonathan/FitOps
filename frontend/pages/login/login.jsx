import { useState } from "react";

/**
 * FitOps Login Page
 * Owner: Hanyi Yang
 * Folder: frontend/pages/login/
 *
 * Connects to POST /api/login
 * Expected request body:  { email, password, role }
 * Expected response:      { success, token, role, name, user, profile }
 *
 * Seed test accounts (run backend/scripts/seed.py first):
 *   member@test.com  / member123
 *   staff@test.com   / staff123
 */

const STYLES = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "24px 16px",
  },
  logo: {
    width: 56,
    height: 56,
    background: "linear-gradient(135deg,#2563eb,#06b6d4)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 22,
    color: "#fff",
    margin: "0 auto 16px",
    userSelect: "none",
  },
  title: { fontSize: 24, fontWeight: 700, color: "#1e293b", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 6, textAlign: "center" },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 16,
    padding: "28px 28px 24px",
    marginTop: 28,
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  fieldWrap: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "#f8fafc",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    color: "#1e293b",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  inputFocus: { borderColor: "#2563eb" },
  inputError: { borderColor: "#ef4444" },
  errorMsg: { fontSize: 12, color: "#ef4444", marginTop: 5 },
  forgotRow: { textAlign: "right", marginTop: 4 },
  forgotLink: {
    fontSize: 12,
    color: "#2563eb",
    textDecoration: "none",
    cursor: "pointer",
  },
  submitBtn: {
    width: "100%",
    padding: "11px 0",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 20,
    transition: "background 0.15s",
    letterSpacing: 0.3,
  },
  submitBtnHover: { background: "#1d4ed8" },
  submitBtnLoading: { background: "#93c5fd", cursor: "not-allowed" },
  generalError: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#b91c1c",
    marginTop: 14,
    textAlign: "center",
  },
  generalSuccess: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#15803d",
    marginTop: 14,
    textAlign: "center",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "20px 0 4px",
  },
  dividerLine: { flex: 1, height: 1, background: "#e2e8f0" },
  dividerText: { fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" },
  roleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginTop: 8,
  },
  roleBtn: (active) => ({
    padding: "9px 0",
    borderRadius: 8,
    border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`,
    background: active ? "#eff6ff" : "#fff",
    color: active ? "#2563eb" : "#64748b",
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  }),
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
};

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [role, setRole]             = useState("member");
  const [showPassword, setShowPw]   = useState(false);
  const [focused, setFocused]       = useState(null);
  const [hoverBtn, setHoverBtn]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [serverMsg, setServerMsg]   = useState(null);
  const [serverOk, setServerOk]     = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim())   e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address.";
    if (!password)       e.password = "Password is required.";
    return e;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setServerMsg(null);
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role }),
      });

      if (res.ok) {
        const data = await res.json();
        setServerOk(true);
        setServerMsg(`Welcome back, ${data.name || "User"}! Redirecting…`);
        setTimeout(() => {
          if (typeof onLoginSuccess === "function") onLoginSuccess(data);
        }, 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerOk(false);
        setServerMsg(data.message || "Invalid email or password. Please try again.");
      }
    } catch {
      // ── DEMO FALLBACK (remove once /api/login is live) ──────────────
      const DEMO = {
        "member@test.com": { password: "member123", role: "member", name: "Test Member User" },
        "staff@test.com":  { password: "staff123",  role: "staff",  name: "Test Staff User"  },
      };
      const match = DEMO[email.trim()];
      if (match && match.password === password) {
        setServerOk(true);
        setServerMsg(`Welcome back, ${match.name}! (demo mode) Redirecting…`);
        setTimeout(() => {
          if (typeof onLoginSuccess === "function") onLoginSuccess(match);
        }, 1000);
      } else {
        setServerOk(false);
        setServerMsg("Invalid email or password. (API not connected — use seed accounts for demo)");
      }
      // ── END DEMO FALLBACK ───────────────────────────────────────────
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...STYLES.input,
    ...(focused === field ? STYLES.inputFocus : {}),
    ...(errors[field]    ? STYLES.inputError  : {}),
  });

  const btnStyle = loading
    ? STYLES.submitBtnLoading
    : hoverBtn
    ? { ...STYLES.submitBtn, ...STYLES.submitBtnHover }
    : STYLES.submitBtn;

  return (
    <div style={STYLES.page}>
      {/* Logo + heading */}
      <div style={{ marginBottom: 4, textAlign: "center" }}>
        <div style={STYLES.logo}>GX</div>
        <div style={STYLES.title}>GymX Management</div>
        <div style={STYLES.subtitle}>Sign in to your account to continue</div>
      </div>

      {/* Login card */}
      <div style={STYLES.card}>
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={STYLES.fieldWrap}>
            <label style={STYLES.label} htmlFor="fitops-email">Email</label>
            <input
              id="fitops-email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null })); }}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              style={inputStyle("email")}
            />
            {errors.email && <div style={STYLES.errorMsg}>{errors.email}</div>}
          </div>

          {/* Password */}
          <div style={STYLES.fieldWrap}>
            <label style={STYLES.label} htmlFor="fitops-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="fitops-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: null })); }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                style={{ ...inputStyle("password"), paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, fontSize: 13 }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <div style={STYLES.errorMsg}>{errors.password}</div>}
            <div style={STYLES.forgotRow}>
              <span style={STYLES.forgotLink}>Forgot password?</span>
            </div>
          </div>

          {/* Role selector */}
          <div style={STYLES.divider}>
            <div style={STYLES.dividerLine} />
            <span style={STYLES.dividerText}>Login as</span>
            <div style={STYLES.dividerLine} />
          </div>
          <div style={STYLES.roleRow}>
            <button
              type="button"
              style={STYLES.roleBtn(role === "member")}
              onClick={() => setRole("member")}
            >
              👤 Member
            </button>
            <button
              type="button"
              style={STYLES.roleBtn(role === "staff")}
              onClick={() => setRole("staff")}
            >
              🔑 Staff
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={btnStyle}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          {/* Server feedback */}
          {serverMsg && (
            <div style={serverOk ? STYLES.generalSuccess : STYLES.generalError}>
              {serverMsg}
            </div>
          )}
        </form>
      </div>

      <div style={STYLES.footer}>
        Demo accounts: member@test.com / member123 · staff@test.com / staff123
      </div>
    </div>
  );
}
