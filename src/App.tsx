import { useState, useEffect, useRef, useCallback, type DragEvent, type ChangeEvent } from "react"
import { MOCK_FESTS } from "./data"
import { DISTRICTS, TAG_STYLES, type Fest, type Category } from "./types"

// ─── Helpers ────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start + "T00:00:00")
  const e = new Date(end + "T00:00:00")
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  if (start === end) return s.toLocaleDateString("en-IN", { ...opts, year: "numeric" })
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
  }
  return `${s.toLocaleDateString("en-IN", opts)} – ${e.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`
}

// Balanced masonry: distribute cards into N columns by shortest-column-first
function buildColumns<T>(items: T[], cols: number): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => [])
  const heights = new Array(cols).fill(0)
  // We don't know actual pixel heights, so we approximate by aspect ratio proxy.
  // For a fair distribution without DOM access, assign round-robin but weight
  // by cycling shortest first — here we just use a simple greedy approach
  // by tracking logical "item count" per column (good enough without DOM).
  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights))
    columns[shortest].push(item)
    heights[shortest] += 1
  }
  return columns
}

function useColumns() {
  const getCount = () => {
    if (typeof window === "undefined") return 3
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 1024) return 2
    return 3
  }
  const [cols, setCols] = useState(getCount)
  useEffect(() => {
    const handler = () => setCols(getCount())
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])
  return cols
}

// ─── TagPill ────────────────────────────────────────────────────────────────

function TagPill({ tag }: { tag: Category }) {
  return (
    <span
      className={`inline-block text-[10.5px] font-medium px-2.5 py-0.5 rounded-full border ${TAG_STYLES[tag]}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {tag}
    </span>
  )
}

// ─── FestCard ───────────────────────────────────────────────────────────────

function FestCard({ fest, onClick }: { fest: Fest; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className="fest-card relative overflow-hidden rounded-xl cursor-pointer mb-3 bg-[#111]"
      style={{ border: "1px solid #1e1e1e" }}
      onClick={onClick}
    >
      <div className="relative w-full" style={{ minHeight: 180 }}>
        {/* Poster image */}
        <img
          src={fest.poster_image_url}
          alt={fest.fest_name}
          className={`w-full block object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ maxHeight: 480 }}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <div className="absolute inset-0 bg-[#1a1a1a] animate-pulse" />}

        {/* Fixed gradient overlay: transparent → 85% black, bottom 50% */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 28%, rgba(0,0,0,0) 50%)",
          }}
        />

        {/* Tag pills top-right */}
        <div className="absolute top-2.5 right-2.5 flex flex-wrap gap-1 justify-end max-w-[75%]">
          {fest.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>

        {/* Bottom metadata */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <p
            className="text-[10.5px] text-[#888] mb-1 truncate"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {fest.district} · {formatDateRange(fest.start_date, fest.end_date)}
          </p>
          <h3
            className="text-white font-bold text-[17px] leading-snug mb-0.5 truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {fest.fest_name}
          </h3>
          <p
            className="text-[11px] truncate"
            style={{ color: "#888", fontFamily: "var(--font-mono)" }}
          >
            {fest.college_name}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── MasonryGrid ────────────────────────────────────────────────────────────

function MasonryGrid({ fests, onCardClick }: { fests: Fest[]; onCardClick: (f: Fest) => void }) {
  const cols = useColumns()
  const columns = buildColumns(fests, cols)

  return (
    <div className="flex gap-3 items-start">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 min-w-0">
          {col.map((fest) => (
            <FestCard key={fest.id} fest={fest} onClick={() => onCardClick(fest)} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── DetailModal ────────────────────────────────────────────────────────────

function DetailModal({ fest, onClose }: { fest: Fest; onClose: () => void }) {
  // Close on backdrop click
  const backdropRef = useRef<HTMLDivElement>(null)
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div ref={backdropRef} className="modal-backdrop" onClick={handleBackdrop}>
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #2a2a2a", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.6)", color: "#aaa", border: "1px solid #333", cursor: "pointer" }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Poster */}
        <div className="relative" style={{ maxHeight: 360, overflow: "hidden" }}>
          <img
            src={fest.poster_image_url}
            alt={fest.fest_name}
            className="w-full object-cover block"
            style={{ maxHeight: 360 }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(17,17,17,1) 0%, rgba(17,17,17,0.3) 40%, transparent 70%)" }}
          />
        </div>

        {/* Content */}
        <div className="px-5 pb-6 pt-2">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {fest.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
          </div>

          <h2
            className="text-white font-bold text-2xl leading-tight mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {fest.fest_name}
          </h2>

          <p className="text-[13px] mb-4" style={{ color: "#999", fontFamily: "var(--font-mono)" }}>
            {fest.college_name}
          </p>

          <div className="flex flex-col gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span style={{ color: "#555", fontFamily: "var(--font-mono)", fontSize: 11, width: 60 }}>DATE</span>
              <span style={{ color: "#ccc", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                {formatDateRange(fest.start_date, fest.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: "#555", fontFamily: "var(--font-mono)", fontSize: 11, width: 60 }}>DISTRICT</span>
              <span style={{ color: "#ccc", fontFamily: "var(--font-mono)", fontSize: 13 }}>{fest.district}</span>
            </div>
          </div>

          <a
            href={fest.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow block text-center w-full"
            style={{ display: "block", textDecoration: "none", padding: "12px 20px", borderRadius: 12, fontSize: 14 }}
          >
            Register / Event Link →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── PostForm ───────────────────────────────────────────────────────────────

type FormState = {
  fest_name: string
  college_name: string
  district: string
  start_date: string
  end_date: string
  registration_link: string
  poster_file: File | null
  poster_preview: string
}

const EMPTY_FORM: FormState = {
  fest_name: "",
  college_name: "",
  district: "",
  start_date: "",
  end_date: "",
  registration_link: "",
  poster_file: null,
  poster_preview: "",
}

function PostForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof FormState, v: string | File | null) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const handleFile = (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith("image/")) { setErrors((e) => ({ ...e, poster_file: "Please upload an image file." })); return }
    if (file.size > 5 * 1024 * 1024) { setErrors((e) => ({ ...e, poster_file: "File must be under 5 MB." })); return }
    const url = URL.createObjectURL(file)
    setForm((f) => ({ ...f, poster_file: file, poster_preview: url }))
    setErrors((e) => ({ ...e, poster_file: undefined }))
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.fest_name.trim()) e.fest_name = "Required"
    if (!form.college_name.trim()) e.college_name = "Required"
    if (!form.district) e.district = "Select a district"
    if (!form.start_date) e.start_date = "Required"
    if (!form.end_date) e.end_date = "Required"
    if (form.start_date && form.end_date && form.end_date < form.start_date) e.end_date = "End date must be after start date"
    if (!form.registration_link.trim()) {
      e.registration_link = "Required"
    } else {
      try { new URL(form.registration_link) } catch { e.registration_link = "Enter a valid URL (e.g. https://…)" }
    }
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    // In production this would POST to Supabase; for now persist to localStorage
    const pending = JSON.parse(localStorage.getItem("fk_pending") || "[]")
    pending.push({ ...form, id: Date.now().toString(), status: "pending", created_at: new Date().toISOString() })
    localStorage.setItem("fk_pending", JSON.stringify(pending))
    setSubmitted(true)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  if (submitted) {
    return (
      <div className="modal-backdrop">
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ background: "#111", border: "1px solid #2a2a2a" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11L9 16L18 6" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "var(--font-display)" }}>Submitted!</h2>
          <p className="text-sm mb-6" style={{ color: "#888", fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
            Your fest is pending review —<br />we'll list it on FestKerala soon.
          </p>
          <button className="btn-glow" onClick={onClose}>Back to Home</button>
        </div>
      </div>
    )
  }

  const backdropRef = useRef<HTMLDivElement>(null)
  const handleBackdrop = (e: React.MouseEvent) => { if (e.target === backdropRef.current) onClose() }

  const Field = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1" style={{ fontFamily: "var(--font-mono)" }}>{error}</p>}
    </div>
  )

  return (
    <div ref={backdropRef} className="modal-backdrop" style={{ alignItems: "flex-start", paddingTop: 24, paddingBottom: 24, overflowY: "auto" }} onClick={handleBackdrop}>
      <div
        className="relative w-full max-w-lg rounded-2xl"
        style={{ background: "#111", border: "1px solid #2a2a2a" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1e1e1e" }}>
          <h2 className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>Post an Event</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a", cursor: "pointer" }}
            aria-label="Close"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-5">
          {/* Poster upload */}
          <div>
            <label className="field-label">Poster Image</label>
            <div
              className={`dropzone ${dragOver ? "active" : ""} flex flex-col items-center justify-center gap-2 py-7`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {form.poster_preview ? (
                <img src={form.poster_preview} alt="Preview" className="max-h-32 rounded-lg object-contain" />
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: "#555" }}>
                    <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="9.5" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 19l6-5 4 4 4-3 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-sm" style={{ color: "#666", fontFamily: "var(--font-mono)" }}>
                    Drag & drop or <span style={{ color: "#a78bfa" }}>browse</span>
                  </p>
                  <p className="text-xs" style={{ color: "#444", fontFamily: "var(--font-mono)" }}>JPG, PNG, WEBP · max 5 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])}
            />
            {errors.poster_file && <p className="text-red-400 text-xs mt-1" style={{ fontFamily: "var(--font-mono)" }}>{errors.poster_file}</p>}
          </div>

          {/* Text fields */}
          <Field id="fest_name" label="Fest Name *" error={errors.fest_name}>
            <input
              id="fest_name"
              className="field"
              placeholder="e.g. Dhwani 2025"
              value={form.fest_name}
              onChange={(e) => set("fest_name", e.target.value)}
            />
          </Field>

          <Field id="college_name" label="College Name *" error={errors.college_name}>
            <input
              id="college_name"
              className="field"
              placeholder="e.g. NIT Calicut"
              value={form.college_name}
              onChange={(e) => set("college_name", e.target.value)}
            />
          </Field>

          <Field id="district" label="District *" error={errors.district}>
            <select
              id="district"
              className="field"
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
            >
              <option value="" disabled>Select district…</option>
              {DISTRICTS.slice(1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="start_date" label="Start Date *" error={errors.start_date}>
              <input
                id="start_date"
                type="date"
                className="field"
                min={today()}
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </Field>
            <Field id="end_date" label="End Date *" error={errors.end_date}>
              <input
                id="end_date"
                type="date"
                className="field"
                min={form.start_date || today()}
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </Field>
          </div>

          <Field id="registration_link" label="Registration / Event Link *" error={errors.registration_link}>
            <input
              id="registration_link"
              type="url"
              className="field"
              placeholder="https://…"
              value={form.registration_link}
              onChange={(e) => set("registration_link", e.target.value)}
            />
          </Field>

          <button type="submit" className="btn-glow w-full mt-1" style={{ padding: "12px", borderRadius: 12, fontSize: 14 }}>
            Submit for Review
          </button>

          <p className="text-center text-xs" style={{ color: "#555", fontFamily: "var(--font-mono)" }}>
            No login required · reviewed within 24h
          </p>
        </form>
      </div>
    </div>
  )
}

// ─── Header ─────────────────────────────────────────────────────────────────

function Header({ onPostClick, festCount }: { onPostClick: () => void; festCount: number }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-[54px] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,10,10,0.92)" : "rgba(10,10,10,0.6)",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? "1px solid #1e1e1e" : "1px solid transparent",
      }}
    >
      {/* Wordmark */}
      <a href="#" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1L11 3.5V9L6.5 12L2 9V3.5L6.5 1Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
            <circle cx="6.5" cy="6.5" r="1.5" fill="white"/>
          </svg>
        </div>
        <span
          className="text-white font-bold text-[17px] tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          FestKerala
        </span>
      </a>

      {/* Right side — desktop only */}
      <div className="hidden sm:flex items-center gap-4">
        <span style={{ color: "#555", fontSize: 12, fontFamily: "var(--font-mono)" }}>
          {festCount} fests listed
        </span>
        <button className="btn-glow" onClick={onPostClick}>Post an Event</button>
      </div>
    </header>
  )
}

// ─── FilterBar ───────────────────────────────────────────────────────────────

function FilterBar({ district, onChange, total }: { district: string; onChange: (d: string) => void; total: number }) {
  return (
    <div
      className="sticky z-40 flex items-center gap-3 px-4 py-2.5"
      style={{
        top: 54,
        background: "rgba(10,10,10,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1e1e1e",
      }}
    >
      <div className="relative">
        <select
          value={district}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none text-[13px] pl-3.5 pr-8 py-1.5 rounded-full cursor-pointer outline-none"
          style={{
            background: "#1a1a1a",
            color: "#d4d4d4",
            border: "1px solid #2a2a2a",
            fontFamily: "var(--font-display)",
          }}
        >
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ color: "#666" }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span style={{ color: "#444", fontSize: 12, fontFamily: "var(--font-mono)" }}>
        {total} fest{total !== 1 ? "s" : ""}
      </span>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

type View = "home" | "post"

export default function App() {
  const [view, setView] = useState<View>("home")
  const [selectedFest, setSelectedFest] = useState<Fest | null>(null)
  const [district, setDistrict] = useState("All Districts")
  const savedScroll = useRef(0)

  const todayStr = today()
  const approved = MOCK_FESTS.filter(
    (f) => f.status === "approved" && f.end_date >= todayStr
  )
  const filtered = district === "All Districts"
    ? approved
    : approved.filter((f) => f.district === district)

  const openPost = () => {
    savedScroll.current = window.scrollY
    setView("post")
  }
  const closePost = () => {
    setView("home")
    requestAnimationFrame(() => window.scrollTo(0, savedScroll.current))
  }

  const openDetail = (fest: Fest) => {
    savedScroll.current = window.scrollY
    setSelectedFest(fest)
  }
  const closeDetail = useCallback(() => {
    setSelectedFest(null)
    requestAnimationFrame(() => window.scrollTo(0, savedScroll.current))
  }, [])

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = (selectedFest || view === "post") ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [selectedFest, view])

  return (
    <div style={{ backgroundColor: "#0a0a0a", minHeight: "100vh" }}>
      <Header onPostClick={openPost} festCount={approved.length} />

      {/* Hero */}
      <div className="pt-[100px] pb-6 px-4 text-center">
        <p
          className="text-[11px] tracking-[0.18em] uppercase mb-3"
          style={{ color: "#555", fontFamily: "var(--font-mono)" }}
        >
          Kerala · College Fests · 2025–26
        </p>
        <h1
          className="font-extrabold leading-none mb-3"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.6rem, 7vw, 5rem)",
            color: "#f2f2f2",
            letterSpacing: "-0.02em",
          }}
        >
          Discover the{" "}
          <span style={{ color: "#a78bfa" }}>Fests</span>
        </h1>
        <p
          className="text-sm max-w-sm mx-auto"
          style={{ color: "#666", fontFamily: "var(--font-mono)", lineHeight: 1.65 }}
        >
          Every cultural, tech &amp; arts fest across Kerala's colleges — one place.
        </p>
      </div>

      <FilterBar district={district} onChange={setDistrict} total={filtered.length} />

      {/* Grid */}
      <div className="px-3 pt-4 pb-24 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-24" style={{ color: "#444", fontFamily: "var(--font-mono)", fontSize: 14 }}>
            No approved fests in {district} right now.
          </div>
        ) : (
          <MasonryGrid fests={filtered} onCardClick={openDetail} />
        )}
      </div>

      {/* Mobile FAB — only on small screens */}
      <button
        className="btn-fab sm:hidden"
        onClick={openPost}
        aria-label="Post an event"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Detail modal */}
      {selectedFest && <DetailModal fest={selectedFest} onClose={closeDetail} />}

      {/* Post form modal */}
      {view === "post" && <PostForm onClose={closePost} />}
    </div>
  )
}
