import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type StatusResult = {
  fest_name: string;
  status: string; // "pending" | "approved" | "rejected" | "unlisted"
  college_name: string | null;
  start_date: string | null;
  end_date: string | null;
};

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (start === end) return s.toLocaleDateString("en-IN", opts);
  return `${s.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-IN", opts)}`;
}

const STATUS_COPY: Record<
  string,
  { title: string; body: string; tone: "pending" | "good" | "bad" }
> = {
  pending: {
    title: "Still pending review",
    body: "An admin hasn't reviewed this fest yet. Most submissions are reviewed within 24h.",
    tone: "pending",
  },
  approved: {
    title: "Approved and live",
    body: "This fest is live on FestKerala.",
    tone: "good",
  },
  rejected: {
    title: "Not approved",
    body: "This submission wasn't approved for listing.",
    tone: "bad",
  },
  unlisted: {
    title: "Unlisted",
    body: "This fest was live but has since been removed from the site.",
    tone: "bad",
  },
};

export default function StatusLookup() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    supabase.rpc("get_fest_status", { fest_id: id }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error(error);
        setError(true);
      } else {
        // RPC returns a table — zero rows means "not found".
        setResult((data && data[0]) ?? null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const copy = result ? STATUS_COPY[result.status] : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ background: "#111", border: "1px solid #2a2a2a" }}
      >
        <p
          className="text-[11px] tracking-[0.18em] uppercase mb-4"
          style={{ color: "#555", fontFamily: "var(--font-display)" }}
        >
          Submission Status
        </p>

        {loading && (
          <p
            style={{
              color: "#666",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
            }}
          >
            Checking…
          </p>
        )}

        {!loading && error && (
          <p
            style={{
              color: "#c96",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
            }}
          >
            Couldn't check status right now. Please try again.
          </p>
        )}

        {!loading && !error && !result && (
          <>
            <h1
              className="text-white font-bold text-xl mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Not found
            </h1>
            <p
              className="text-sm"
              style={{
                color: "#888",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.6,
              }}
            >
              No submission matches this link. Double-check the link you were
              given.
            </p>
          </>
        )}

        {!loading && !error && result && copy && (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  copy.tone === "good"
                    ? "rgba(34,197,94,0.12)"
                    : copy.tone === "bad"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(124,58,237,0.15)",
                border:
                  copy.tone === "good"
                    ? "1px solid rgba(34,197,94,0.35)"
                    : copy.tone === "bad"
                      ? "1px solid rgba(239,68,68,0.35)"
                      : "1px solid rgba(124,58,237,0.4)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 18,
                  color:
                    copy.tone === "good"
                      ? "#4ade80"
                      : copy.tone === "bad"
                        ? "#f87171"
                        : "#a78bfa",
                }}
              >
                {copy.tone === "good" ? "✓" : copy.tone === "bad" ? "✕" : "…"}
              </span>
            </div>

            <h1
              className="text-white font-bold text-xl mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {result.fest_name}
            </h1>

            <p
              className="text-xs mb-4"
              style={{ color: "#a78bfa", fontFamily: "var(--font-mono)" }}
            >
              {copy.title}
            </p>

            {result.college_name && (
              <p
                className="text-xs mb-1"
                style={{ color: "#888", fontFamily: "var(--font-mono)" }}
              >
                {result.college_name}
              </p>
            )}
            {result.start_date && result.end_date && (
              <p
                className="text-xs mb-4"
                style={{ color: "#666", fontFamily: "var(--font-mono)" }}
              >
                {formatDateRange(result.start_date, result.end_date)}
              </p>
            )}

            <p
              className="text-sm mb-6"
              style={{
                color: "#888",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.6,
              }}
            >
              {copy.body}
            </p>

            {result.status === "approved" ? (
              <Link
                to={`/fest/${id}`}
                className="btn-glow block text-center"
                style={{
                  display: "block",
                  textDecoration: "none",
                  padding: "12px 20px",
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                View Fest →
              </Link>
            ) : (
              <Link
                to="/"
                className="text-xs"
                style={{ color: "#999", fontFamily: "var(--font-mono)" }}
              >
                Back to Home
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
