import React, { useState } from "react";

const STYLES = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    background: "var(--page-bg)",
    fontFamily: "'Inter', 'SF Pro Display', ui-sans-serif, system-ui, sans-serif",
  },
  left: {
    width: "40%",
    minHeight: "100vh",
    background: "linear-gradient(160deg, #1A1A2E 0%, #2D2D44 60%, #E8400C 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "48px 40px",
    boxSizing: "border-box",
  },
  right: {
    width: "60%",
    minHeight: "100vh",
    background: "var(--page-bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
    boxSizing: "border-box",
  },
  brandRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: "linear-gradient(135deg, #E8400C, #F4875E)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 22,
    color: "#fff",
    userSelect: "none",
  },
  brandName: {
    fontSize: 32,
    fontWeight: 800,
    color: "rgba(255,255,255,0.98)",
    letterSpacing: "-1px",
    margin: 0,
    lineHeight: 1.1,
  },
  tagline: {
    marginTop: 10,
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    maxWidth: 420,
  },
  featureList: { marginTop: 18, display: "grid", gap: 10 },
  featureRow: { display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.75)", fontSize: 13 },
  featureDot: { width: 8, height: 8, borderRadius: 999, background: "var(--brand-mid)", flex: "0 0 auto" },
  poweredByLeft: { marginTop: 26, fontSize: 12, color: "rgba(255,255,255,0.3)" },

  card: {
    background: "var(--white)",
    borderRadius: "var(--radius-xl)",
    padding: 40,
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--gray-lighter)",
    width: "100%",
    maxWidth: 420,
    boxSizing: "border-box",
  },
  cardTitle: { fontSize: 22, fontWeight: 800, color: "var(--charcoal)", letterSpacing: "-0.4px", margin: 0 },
  cardSubtitle: { fontSize: 13, color: "var(--gray-mid)", marginTop: 6, marginBottom: 28 },
  fieldWrap: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--gray-dark)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "var(--white)",
    border: "1.5px solid var(--gray-light)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--charcoal)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color var(--fast) var(--ease), box-shadow var(--fast) var(--ease)",
  },
  inputFocus: { borderColor: "var(--brand)", boxShadow: "0 0 0 3px rgba(232,64,12,0.12)" },
  inputError: { borderColor: "var(--status-danger)", boxShadow: "0 0 0 3px rgba(217,45,32,0.10)" },
  errorMsg: { fontSize: 12, color: "var(--status-danger)", marginTop: 5 },
  forgotRow: { textAlign: "right", marginTop: 4 },
  forgotLink: {
    fontSize: 12,
    color: "var(--brand)",
    textDecoration: "none",
    cursor: "pointer",
  },
  submitBtn: {
    width: "100%",
    padding: "11px 20px",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: "var(--brand)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 20,
    transition: "all var(--fast) var(--ease)",
    letterSpacing: 0.1,
  },
  submitBtnHover: { background: "var(--brand-hover)", transform: "translateY(-1px)", boxShadow: "0 4px 14px rgba(232,64,12,0.35)" },
  submitBtnLoading: { background: "var(--brand-hover)", cursor: "not-allowed", opacity: 0.7 },
  generalError: {
    background: "var(--status-danger-bg)",
    border: "1px solid rgba(217,45,32,0.25)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--status-danger)",
    marginTop: 14,
    textAlign: "center",
  },
  generalSuccess: {
    background: "var(--status-active-bg)",
    border: "1px solid rgba(26,158,79,0.25)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--status-active)",
    marginTop: 14,
    textAlign: "center",
  },
  footer: {
    marginTop: 18,
    fontSize: 12,
    color: "var(--gray-mid)",
    textAlign: "center",
  },
  linkBtn: { background: "none", border: "none", color: "var(--brand)", cursor: "pointer", padding: 0, fontSize: 12, fontWeight: 600 },
};

export default function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPassword, setShowPw]   = useState(false);
  const [focused, setFocused]       = useState(null);
  const [hoverBtn, setHoverBtn]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [errors, setErrors]         = useState({});
  const [serverMsg, setServerMsg]   = useState(null);
  const [serverOk, setServerOk]     = useState(false);

  const API_BASE = "http://127.0.0.1:5000";
  const loginUrl = `${API_BASE}/api/login`;

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
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (!data?.success) {
          setServerOk(false);
          setServerMsg(data.message || "Login failed. Please try again.");
          return;
        }
        setServerOk(true);
        setServerMsg(`Welcome back, ${data.name || "User"}! Redirecting…`);
        if (typeof onLoginSuccess === "function") onLoginSuccess(data);
      } else {
        const data = await res.json().catch(() => ({}));
        setServerOk(false);
        setServerMsg(data.message || "Invalid email or password. Please try again.");
      }
    } catch {
      setServerOk(false);
      setServerMsg("Could not connect to the backend.");
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
    <div style={STYLES.page} className="authPage">
      <div style={STYLES.left} className="authLeft">
        <div style={STYLES.brandRow}>
          <div style={STYLES.brandMark}>FI</div>
          <h1 style={STYLES.brandName}>FitOps</h1>
        </div>
        <div style={STYLES.tagline}>Manage memberships, classes, and gym operations — all in one place.</div>
        <div style={STYLES.featureList}>
          <div style={STYLES.featureRow}>
            <span style={STYLES.featureDot} />
            <span>Member check-ins & class scheduling</span>
          </div>
          <div style={STYLES.featureRow}>
            <span style={STYLES.featureDot} />
            <span>Equipment tickets & maintenance logs</span>
          </div>
          <div style={STYLES.featureRow}>
            <span style={STYLES.featureDot} />
            <span>Staff shifts & billing management</span>
          </div>
        </div>
        <div style={STYLES.poweredByLeft}>Powered by FitOps</div>
      </div>

      <div style={STYLES.right} className="authRight">
        <div style={STYLES.card}>
          <div style={{ marginBottom: 24 }}>
            <div style={STYLES.cardTitle}>Sign in to your account</div>
            <div style={STYLES.cardSubtitle}>Welcome back. Enter your credentials below.</div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
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

          <button
            type="submit"
            disabled={loading}
            style={btnStyle}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          {serverMsg && (
            <div style={serverOk ? STYLES.generalSuccess : STYLES.generalError}>
              {serverMsg}
            </div>
          )}

          <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: "var(--gray-mid)" }}>
            New here?{" "}
            <button
              type="button"
              onClick={onGoToRegister}
              style={STYLES.linkBtn}
            >
              Create an account
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}

