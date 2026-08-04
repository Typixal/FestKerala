import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { DISTRICTS, CATEGORIES, TAG_STYLES, type Fest, type Category } from "../types";

function useAuthedUserEmail() {
  const [email, setEmail] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);
  return email;
}

function EditableFest({
  fest,
  selected,
  onToggleSelect,
  onSaved,
  onRemoved,
}: {
  fest: Fest;
  selected: boolean;
  onToggleSelect: () => void;
  onSaved: (updated: Fest) => void;
  onRemoved: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Fest>(fest);
  const [busy, setBusy] = useState<null | "approve" | "reject" | "save">(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: Category) => {
    setDraft((d) => ({
      ...d,
      tags: d.tags.includes(tag)
        ? d.tags.filter((t) => t !== tag)
        : [...d.tags, tag],
    }));
  };

  const save = async () => {
    setBusy("save");
    setError(null);
    const { error } = await supabase
      .from("fests")
      .update({
        fest_name: draft.fest_name,
        college_name: draft.college_name,
        district: draft.district,
        start_date: draft.start_date,
        end_date: draft.end_date,
        registration_link: draft.registration_link,
        tags: draft.tags,
      })
      .eq("id", fest.id);
    setBusy(null);
    if (error) {
      setError("Save failed. Try again.");
      return;
    }
    onSaved(draft);
    setEditing(false);
  };

  const approve = async () => {
    setBusy("approve");
    setError(null);
    const { error } = await supabase
      .from("fests")
      .update({ status: "approved" })
      .eq("id", fest.id);
    setBusy(null);
    if (error) {
      setError("Approve failed. Try again.");
      return;
    }
    onRemoved(fest.id);
  };

  const reject = async () => {
    if (!confirm(`Reject and delete "${fest.fest_name}"? This can't be undone.`))
      return;
    setBusy("reject");
    setError(null);
    const { error } = await supabase.from("fests").delete().eq("id", fest.id);
    setBusy(null);
    if (error) {
      setError("Reject failed. Try again.");
      return;
    }
    onRemoved(fest.id);
  };

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "#111", border: "1px solid #2a2a2a" }}
    >
      <div className="flex gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1.5 shrink-0"
        />
        <img
          src={fest.poster_image_url}
          alt={fest.fest_name}
          className="w-20 h-28 object-cover rounded-lg shrink-0"
          style={{ border: "1px solid #2a2a2a" }}
        />
        <div className="flex-1 min-w-0">
          {!editing ? (
            <>
              <p
                className="text-white font-bold text-base truncate"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {fest.fest_name}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "#888", fontFamily: "var(--font-mono)" }}
              >
                {fest.college_name} · {fest.district}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "#666", fontFamily: "var(--font-mono)" }}
              >
                {fest.start_date} → {fest.end_date}
              </p>
              <a
                href={fest.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs block truncate mt-0.5"
                style={{ color: "#a78bfa", fontFamily: "var(--font-mono)" }}
              >
                {fest.registration_link}
              </a>
              <div className="flex flex-wrap gap-1 mt-2">
                {fest.tags.map((t) => (
                  <span
                    key={t}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${TAG_STYLES[t]}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                className="field"
                value={draft.fest_name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, fest_name: e.target.value }))
                }
                placeholder="Fest name"
              />
              <input
                className="field"
                value={draft.college_name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, college_name: e.target.value }))
                }
                placeholder="College name"
              />
              <select
                className="field"
                value={draft.district}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, district: e.target.value }))
                }
              >
                {DISTRICTS.slice(1).map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="field"
                  value={draft.start_date}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, start_date: e.target.value }))
                  }
                  style={{ colorScheme: "dark" }}
                />
                <input
                  type="date"
                  className="field"
                  value={draft.end_date}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, end_date: e.target.value }))
                  }
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <input
                type="url"
                className="field"
                value={draft.registration_link}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    registration_link: e.target.value,
                  }))
                }
                placeholder="Registration link"
              />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((tag) => {
                  const active = draft.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                        active
                          ? TAG_STYLES[tag]
                          : "bg-transparent text-[#666] border-[#2a2a2a]"
                      }`}
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p
          className="text-red-400 text-xs"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end flex-wrap">
        {editing ? (
          <>
            <button
              onClick={() => {
                setDraft(fest);
                setEditing(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                color: "#999",
                border: "1px solid #2a2a2a",
                fontFamily: "var(--font-mono)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy === "save"}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: "rgba(124,58,237,0.15)",
                color: "#a78bfa",
                border: "1px solid rgba(124,58,237,0.4)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {busy === "save" ? "Saving…" : "Save Changes"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                color: "#999",
                border: "1px solid #2a2a2a",
                fontFamily: "var(--font-mono)",
              }}
            >
              Edit
            </button>
            <button
              onClick={reject}
              disabled={busy === "reject"}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.35)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
            <button
              onClick={approve}
              disabled={busy === "approve"}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: "rgba(34,197,94,0.12)",
                color: "#4ade80",
                border: "1px solid rgba(34,197,94,0.35)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const email = useAuthedUserEmail();
  const [pending, setPending] = useState<Fest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from("fests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setLoadError("Couldn't load pending fests.");
    } else {
      setPending((data ?? []) as Fest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeFromList = (id: string) => {
    setPending((p) => p.filter((f) => f.id !== id));
    setSelected((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  };

  const updateInList = (updated: Fest) => {
    setPending((p) => p.map((f) => (f.id === updated.id ? updated : f)));
  };

  const bulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const { error } = await supabase
      .from("fests")
      .update({ status: "approved" })
      .in("id", Array.from(selected));
    setBulkBusy(false);
    if (error) {
      alert("Bulk approve failed. Please try again.");
      return;
    }
    setPending((p) => p.filter((f) => !selected.has(f.id)));
    setSelected(new Set());
  };

  const bulkReject = async () => {
    if (selected.size === 0) return;
    if (
      !confirm(
        `Reject and delete ${selected.size} submission(s)? This can't be undone.`
      )
    )
      return;
    setBulkBusy(true);
    const { error } = await supabase
      .from("fests")
      .delete()
      .in("id", Array.from(selected));
    setBulkBusy(false);
    if (error) {
      alert("Bulk reject failed. Please try again.");
      return;
    }
    setPending((p) => p.filter((f) => !selected.has(f.id)));
    setSelected(new Set());
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh" }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5"
        style={{
          background: "rgba(10,10,10,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #1e1e1e",
        }}
      >
        <div>
          <h1
            className="text-white font-bold text-lg"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Moderation Queue
          </h1>
          <p
            className="text-xs"
            style={{ color: "#666", fontFamily: "var(--font-mono)" }}
          >
            {email && `Signed in as ${email}`}
          </p>
        </div>
        <button
          onClick={signOut}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{
            color: "#999",
            border: "1px solid #2a2a2a",
            fontFamily: "var(--font-mono)",
          }}
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {pending.length > 0 && (
          <div
            className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="text-xs" style={{ color: "#666" }}>
              {selected.size > 0
                ? `${selected.size} selected`
                : `${pending.length} pending fest${pending.length !== 1 ? "s" : ""}`}
            </span>
            {selected.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={bulkReject}
                  disabled={bulkBusy}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.35)",
                  }}
                >
                  Reject Selected
                </button>
                <button
                  onClick={bulkApprove}
                  disabled={bulkBusy}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: "#4ade80",
                    border: "1px solid rgba(34,197,94,0.35)",
                  }}
                >
                  Approve Selected
                </button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p
            className="text-center py-16 text-sm"
            style={{ color: "#444", fontFamily: "var(--font-mono)" }}
          >
            Loading…
          </p>
        ) : loadError ? (
          <p
            className="text-center py-16 text-sm"
            style={{ color: "#c96", fontFamily: "var(--font-mono)" }}
          >
            {loadError}
          </p>
        ) : pending.length === 0 ? (
          <p
            className="text-center py-16 text-sm"
            style={{ color: "#444", fontFamily: "var(--font-mono)" }}
          >
            No pending fests. All caught up.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((fest) => (
              <EditableFest
                key={fest.id}
                fest={fest}
                selected={selected.has(fest.id)}
                onToggleSelect={() => toggleSelect(fest.id)}
                onSaved={updateInList}
                onRemoved={removeFromList}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
