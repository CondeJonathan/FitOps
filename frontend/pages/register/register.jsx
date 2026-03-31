import { useMemo, useState } from "react";

const STYLES = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    position: "fixed",
    inset: 0,
    background: "linear-gradient(160deg, #0b1120 0%, #111827 45%, #1f2937 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', 'Poppins', 'Segoe UI', system-ui, sans-serif",
    padding: "24px 16px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  shell: {
    width: "100%",
    maxWidth: 560,
    margin: "0 auto",
    position: "relative",
  },
  glowTop: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(56,189,248,0.32) 0%, rgba(56,189,248,0) 68%)",
    top: -90,
    left: -90,
    pointerEvents: "none",
  },
  glowBottom: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0) 68%)",
    bottom: -100,
    right: -90,
    pointerEvents: "none",
  },
  logo: {
    width: 56,
    height: 56,
    background: "linear-gradient(135deg,#22d3ee,#38bdf8)",
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
  title: { fontSize: 24, fontWeight: 700, color: "#e0f2fe", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#93c5fd", marginTop: 6, textAlign: "center" },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(15, 23, 42, 0.85)",
    border: "1.5px solid #334155",
    borderRadius: 16,
    padding: "28px 28px 24px",
    margin: "28px auto 0",
    boxShadow: "0 12px 28px rgba(2, 6, 23, 0.45)",
  },
  fieldWrap: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#bfdbfe",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "#0f172a",
    border: "1.5px solid #334155",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    color: "#e2e8f0",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  inputFocus: { borderColor: "#38bdf8" },
  inputError: { borderColor: "#ef4444" },
  errorMsg: { fontSize: 12, color: "#ef4444", marginTop: 5 },
  submitBtn: {
    width: "100%",
    padding: "11px 0",
    borderRadius: 8,
    border: "none",
    background: "#0891b2",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 18,
    transition: "background 0.15s",
    letterSpacing: 0.3,
  },
  submitBtnHover: { background: "#0e7490" },
  submitBtnLoading: { background: "#155e75", cursor: "not-allowed" },
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
  footer: {
    marginTop: 18,
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#67e8f9",
    cursor: "pointer",
    padding: 0,
    fontSize: 12,
    fontWeight: 600,
  },
  poweredBy: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 12,
    color: "#67e8f9",
    fontWeight: 700,
    letterSpacing: 0.2,
  },
};

export default function RegisterPage({ onGoToLogin, onRegisterSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPw] = useState(false);
  const [focused, setFocused] = useState(null);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState(null);
  const [serverOk, setServerOk] = useState(false);

  const API_BASE = "http://127.0.0.1:5000";
  const registerUrl = `${API_BASE}/api/register`;

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    return e;
  };

  const inputStyle = (field) => ({
    ...STYLES.input,
    ...(focused === field ? STYLES.inputFocus : {}),
    ...(errors[field] ? STYLES.inputError : {}),
  });

  const btnStyle = useMemo(() => {
    if (loading) return STYLES.submitBtnLoading;
    if (hoverBtn) return { ...STYLES.submitBtn, ...STYLES.submitBtnHover };
    return STYLES.submitBtn;
  }, [hoverBtn, loading]);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setServerMsg(null);

    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(registerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setServerOk(true);
        setServerMsg("Account created! Redirecting…");
        if (typeof onRegisterSuccess === "function") onRegisterSuccess(data);
        else if (typeof onGoToLogin === "function") onGoToLogin();
      } else {
        setServerOk(false);
        setServerMsg(data.message || "Could not create your account. Please try again.");
      }
    } catch {
      setServerOk(false);
      setServerMsg("Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={STYLES.page}>
      <div style={STYLES.shell}>
        <div style={STYLES.glowTop} />
        <div style={STYLES.glowBottom} />
        <div style={{ marginBottom: 4, textAlign: "center" }}>
          <div style={STYLES.logo}>FI</div>
          <div style={STYLES.title}>Create your account</div>
          <div style={STYLES.subtitle}>Register to access memberships, classes, and facility support tools</div>
        </div>

        <div style={STYLES.card}>
          <form onSubmit={handleSubmit} noValidate>
          <div style={STYLES.fieldWrap}>
            <label style={STYLES.label} htmlFor="fitops-name">Name</label>
            <input
              id="fitops-name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: null }));
              }}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              style={inputStyle("name")}
            />
            {errors.name && <div style={STYLES.errorMsg}>{errors.name}</div>}
          </div>

          <div style={STYLES.fieldWrap}>
            <label style={STYLES.label} htmlFor="fitops-email">Email</label>
            <input
              id="fitops-email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: null }));
              }}
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
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: null }));
                }}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                style={{ ...inputStyle("password"), paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 0,
                  fontSize: 13,
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <div style={STYLES.errorMsg}>{errors.password}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={btnStyle}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>

          {serverMsg && (
            <div style={serverOk ? STYLES.generalSuccess : STYLES.generalError}>
              {serverMsg}
            </div>
          )}

          <div style={STYLES.footer}>
            Already have an account?{" "}
            <button type="button" style={STYLES.linkBtn} onClick={onGoToLogin}>
              Sign in
            </button>
          </div>
          </form>
        </div>
        <div style={STYLES.poweredBy}>Powered by FitOps</div>
      </div>
    </div>
  );
}

