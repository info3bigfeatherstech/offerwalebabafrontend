// components/ADMIN_SEGMENT/AdminUnauthorized.jsx
import { useNavigate }     from "react-router-dom";
import { useAdminLogoutMutation } from "../ADMIN_REDUX_MANAGEMENT/adminAuthApi";
import LOGO from "../../../assets/logo2.png";

const AdminUnauthorized = () => {
  const navigate                  = useNavigate();
 const [adminLogout, { isLoading: isPending }] = useAdminLogoutMutation();
  const handleLogout = () => {
   adminLogout(undefined, {
  onSettled: () => navigate("/admin/login", { replace: true }),
});
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#000", padding: "24px",
    }}>
      <div style={{
        background: "#0d0d0d", borderRadius: "2rem", border: "1px solid #1f1f1f",
        padding: "48px 40px", textAlign: "center", maxWidth: "380px", width: "100%",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
      }}>
        <img src={LOGO} alt="logo"
          style={{ height: "30px", margin: "0 auto 24px", display: "block" }} />
        <p style={{
          fontSize: "11px", fontWeight: 800, letterSpacing: "0.2em",
          color: "#ef4444", marginBottom: "12px",
        }}>
          ACCESS DENIED
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>
          Unauthorized
        </h1>
        <p style={{ fontSize: "13px", color: "#555", marginBottom: "28px", lineHeight: 1.6 }}>
          Your account doesn't have permission to access this area.
          Contact your system administrator.
        </p>
        <button
          onClick={handleLogout}
          disabled={isPending}
          style={{
            background: "#f7a221", color: "#000", border: "none",
            borderRadius: "10px", padding: "12px 28px", fontWeight: 800,
            fontSize: "12px", letterSpacing: "0.12em", cursor: "pointer",
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? "SIGNING OUT..." : "SIGN OUT"}
        </button>
      </div>
    </div>
  );
};

export default AdminUnauthorized;