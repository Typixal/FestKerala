import { useAuth } from "../lib/useAuth";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function Admin() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        <p style={{ color: "#444", fontFamily: "var(--font-mono)" }}>
          Loading…
        </p>
      </div>
    );
  }

  return isLoggedIn ? <AdminDashboard /> : <AdminLogin />;
}
