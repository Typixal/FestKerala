import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#111", border: "1px solid #2a2a2a" }}
      >
        <h1
          className="text-white font-bold text-xl mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FestKerala Admin
        </h1>
        <p
          className="text-xs mb-6"
          style={{ color: "#666", fontFamily: "var(--font-mono)" }}
        >
          Sign in to review fest submissions.
        </p>

        <label className="field-label">Email</label>
        <input
          type="email"
          className="field mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <label className="field-label">Password</label>
        <input
          type="password"
          className="field mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p
            className="text-red-400 text-xs mb-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-glow w-full"
          style={{
            padding: "12px",
            borderRadius: 12,
            fontSize: 14,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
