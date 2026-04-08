// components/ADMIN_SEGMENT/AdminLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAdminLoginMutation } from "../ADMIN_REDUX_MANAGEMENT/adminAuthApi";
import LOGO from "../../../assets/logo2.png";

const AdminLogin = () => {
    const navigate = useNavigate();
    //   const { isLoggedIn }        = useSelector((s) => s.adminAuth);
    const isLoggedIn = !!localStorage.getItem("accessToken");
    const [adminLogin, { isLoading: isPending, error, reset }] = useAdminLoginMutation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Already authenticated — skip login screen
    useEffect(() => {
        if (isLoggedIn) navigate("/admindash", { replace: true });
    }, [isLoggedIn]);

    // Clear React Query error when user starts retyping
    useEffect(() => { if (error) reset(); }, [email, password]);

    const validate = () => {
        const errs = {};
        if (!email.trim()) errs.email = "Email is required";
        if (!password.trim()) errs.password = "Password is required";
        return errs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }
        setFieldErrors({});

        adminLogin(
            { email: email.trim(), password },
            { onSuccess: () => navigate("/admindash", { replace: true }) }
        );
    };

    // Extract error message from React Query error
    const errorMsg = error?.response?.data?.message || error?.message || null;

    return (
        <>
            <style>{`
        @keyframes al-fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes al-fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes al-spin    { to   { transform: rotate(360deg); } }
        .al-card  { animation: al-fadeUp 0.38s cubic-bezier(0.32,0.72,0,1) both; }
        .al-fade  { animation: al-fadeIn 0.25s ease both; }
        .al-input {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 12px; padding: 14px 16px; color: #fff;
          font-size: 14px; outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .al-input:focus       { border-color: #f7a221; }
        .al-input.err         { border-color: #ef4444; }
        .al-input::placeholder{ color: #555; }
        .al-btn {
          width: 100%; background: #f7a221; color: #000;
          font-weight: 800; font-size: 13px; letter-spacing: 0.12em;
          border: none; border-radius: 12px; padding: 15px;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
        }
        .al-btn:hover:not(:disabled)  { opacity: 0.9; }
        .al-btn:active:not(:disabled) { transform: scale(0.98); }
        .al-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .al-spinner {
          width: 14px; height: 14px; border: 2px solid #00000055;
          border-top-color: #000; border-radius: 50%;
          display: inline-block; animation: al-spin 0.7s linear infinite;
        }
      `}</style>

            <div className="al-fade" style={{
                minHeight: "100vh", display: "flex", alignItems: "center",
                justifyContent: "center", background: "#000", padding: "24px 16px",
            }}>
                <div className="al-card" style={{ width: "100%", maxWidth: "420px" }}>

                    {/* ── Card ──────────────────────────────────────────────────────── */}
                    <div style={{
                        background: "#0d0d0d", borderRadius: "2.5rem",
                        border: "1px solid #1f1f1f", padding: "40px 36px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                    }}>

                        {/* Logo + heading */}
                        <div style={{ textAlign: "center", marginBottom: "32px" }}>
                            <img src={LOGO} alt="logo"
                                style={{ height: "36px", margin: "0 auto 20px", display: "block" }} />
                            <p style={{
                                fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em",
                                color: "#f7a221", marginBottom: "6px", margin: "0 0 6px",
                            }}>
                                ADMIN PORTAL
                            </p>
                            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                                Sign in to continue
                            </h1>
                            <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>
                                Restricted access — authorized personnel only
                            </p>
                        </div>

                        {/* Error banner — React Query error */}
                        {errorMsg && (
                            <div className="al-fade" style={{
                                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                                borderRadius: "10px", padding: "12px 14px", marginBottom: "20px",
                                display: "flex", alignItems: "center", gap: "10px",
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="#ef4444" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <p style={{ fontSize: "13px", color: "#ef4444", margin: 0 }}>{errorMsg}</p>
                            </div>
                        )}

                        {/* ── Form ──────────────────────────────────────────────────── */}
                        <form onSubmit={handleSubmit} noValidate>

                            {/* Email */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{
                                    display: "block", fontSize: "11px", fontWeight: 700,
                                    letterSpacing: "0.15em", color: "#888", marginBottom: "8px",
                                }}>
                                    EMAIL
                                </label>
                                <input
                                    type="email"
                                    className={`al-input${fieldErrors.email ? " err" : ""}`}
                                    placeholder="admin@example.com"
                                    value={email}
                                    autoComplete="email"
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: null }));
                                    }}
                                />
                                {fieldErrors.email && (
                                    <p style={{ fontSize: "12px", color: "#ef4444", margin: "5px 0 0" }}>
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{
                                    display: "block", fontSize: "11px", fontWeight: 700,
                                    letterSpacing: "0.15em", color: "#888", marginBottom: "8px",
                                }}>
                                    PASSWORD
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        className={`al-input${fieldErrors.password ? " err" : ""}`}
                                        placeholder="••••••••••"
                                        value={password}
                                        autoComplete="current-password"
                                        style={{ paddingRight: "48px" }}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: null }));
                                        }}
                                    />
                                    {/* Show / hide toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPass((p) => !p)}
                                        aria-label={showPass ? "Hide password" : "Show password"}
                                        style={{
                                            position: "absolute", right: "14px", top: "50%",
                                            transform: "translateY(-50%)", background: "none",
                                            border: "none", cursor: "pointer", padding: "4px", color: "#555",
                                        }}
                                    >
                                        {showPass ? (
                                            /* Eye-off */
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            /* Eye */
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {fieldErrors.password && (
                                    <p style={{ fontSize: "12px", color: "#ef4444", margin: "5px 0 0" }}>
                                        {fieldErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <button type="submit" className="al-btn" disabled={isPending}>
                                {isPending ? (
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                        <span className="al-spinner" />
                                        SIGNING IN...
                                    </span>
                                ) : "SIGN IN"}
                            </button>
                        </form>

                        {/* Footer note */}
                        <p style={{
                            fontSize: "11px", color: "#333", textAlign: "center",
                            marginTop: "24px", lineHeight: 1.6,
                        }}>
                            Not an admin?{" "}
                            <a href="/" style={{ color: "#f7a221", textDecoration: "none", fontWeight: 700 }}>
                                Go to storefront
                            </a>
                        </p>
                    </div>

                    {/* Version stamp */}
                    <p style={{
                        textAlign: "center", fontSize: "10px", color: "#333",
                        marginTop: "16px", letterSpacing: "0.15em", fontWeight: 700,
                    }}>
                        SYSTEM v1.0.4
                    </p>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;