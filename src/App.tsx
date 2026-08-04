import { useState, useEffect, useRef, useCallback } from "react"

const DISTRICTS = [
  "All Districts",
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
]

interface Fest {
  id: number
  name: string
  college: string
  district: string
  date: string
  tags: string[]
  img: string
  aspectRatio: "tall" | "square" | "wide"
}

const FESTS: Fest[] = [
  {
    id: 1,
    name: "Dhwani 2025",
    college: "Govt. Engineering College, Thrissur",
    district: "Thrissur",
    date: "Feb 14–16",
    tags: ["Music", "Tech"],
    img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=900&fit=crop&auto=format",
    aspectRatio: "tall",
  },
  {
    id: 2,
    name: "Kalolsavam",
    college: "Mar Ivanios College",
    district: "Thiruvananthapuram",
    date: "Jan 20–22",
    tags: ["Arts", "Dance"],
    img: "https://images.unsplash.com/photo-1463592177119-bab2a00f3ccb?w=600&h=600&fit=crop&auto=format",
    aspectRatio: "square",
  },
  {
    id: 3,
    name: "Thejus Fest",
    college: "NIT Calicut",
    district: "Kozhikode",
    date: "Mar 5–7",
    tags: ["Tech", "Hackathon"],
    img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&h=480&fit=crop&auto=format",
    aspectRatio: "wide",
  },
  {
    id: 4,
    name: "Revelations",
    college: "College of Engineering, Pune (Kerala Chapter)",
    district: "Ernakulam",
    date: "Feb 28",
    tags: ["Culture", "Fashion"],
    img: "https://images.unsplash.com/photo-1652111132299-ff1056c87b35?w=600&h=900&fit=crop&auto=format",
    aspectRatio: "tall",
  },
  {
    id: 5,
    name: "Spectrum",
    college: "MG University",
    district: "Kottayam",
    date: "Mar 12–13",
    tags: ["Music", "Dance"],
    img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop&auto=format",
    aspectRatio: "wide",
  },
  {
    id: 6,
    name: "Nrityananda",
    college: "Sree Sankara College",
    district: "Ernakulam",
    date: "Apr 2",
    tags: ["Classical Dance"],
    img: "https://images.unsplash.com/photo-1764014792668-bc484714744f?w=600&h=900&fit=crop&auto=format",
    aspectRatio: "tall",
  },
  {
    id: 7,
    name: "Tathva",
    college: "NIT Calicut",
    district: "Kozhikode",
    date: "Oct 10–12",
    tags: ["Tech", "Science"],
    img: "https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=600&h=600&fit=crop&auto=format",
    aspectRatio: "square",
  },
  {
    id: 8,
    name: "Colours of Kerala",
    college: "Calicut University",
    district: "Malappuram",
    date: "Nov 3–5",
    tags: ["Culture", "Arts"],
    img: "https://images.unsplash.com/photo-1756382616831-998e8baf9675?w=600&h=400&fit=crop&auto=format",
    aspectRatio: "wide",
  },
  {
    id: 9,
    name: "Apogee",
    college: "BITS Pilani (KL Connect)",
    district: "Thrissur",
    date: "Mar 18–20",
    tags: ["Tech", "Robotics"],
    img: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&h=900&fit=crop&auto=format",
    aspectRatio: "tall",
  },
  {
    id: 10,
    name: "Soorya Festival",
    college: "KSICTA",
    district: "Thiruvananthapuram",
    date: "Dec 20–Jan 5",
    tags: ["Classical", "Music"],
    img: "https://images.unsplash.com/photo-1711804224670-82814a88be82?w=600&h=600&fit=crop&auto=format",
    aspectRatio: "square",
  },
  {
    id: 11,
    name: "Mavericks",
    college: "CUSAT",
    district: "Ernakulam",
    date: "Feb 7–8",
    tags: ["Business", "Debate"],
    img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=700&h=460&fit=crop&auto=format",
    aspectRatio: "wide",
  },
  {
    id: 12,
    name: "Prathibha",
    college: "Kerala University",
    district: "Thiruvananthapuram",
    date: "Jan 30–Feb 1",
    tags: ["Arts", "Literature"],
    img: "https://images.unsplash.com/photo-1712192682756-ae5b3a8e7508?w=600&h=900&fit=crop&auto=format",
    aspectRatio: "tall",
  },
]

const TAG_COLORS: Record<string, string> = {
  // Fixed category system
  Tech:             "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  Music:            "bg-violet-500/20 text-violet-300 border-violet-500/40",
  Arts:             "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Culture:          "bg-rose-500/20 text-rose-300 border-rose-500/40",
  Dance:            "bg-pink-500/20 text-pink-300 border-pink-500/40",
  Business:         "bg-green-500/20 text-green-300 border-green-500/40",
  // Subcategories mapped to their parent
  Hackathon:        "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  Robotics:         "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  Science:          "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  Classical:        "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Literature:       "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Fashion:          "bg-rose-500/20 text-rose-300 border-rose-500/40",
  "Classical Dance":"bg-pink-500/20 text-pink-300 border-pink-500/40",
  Debate:           "bg-green-500/20 text-green-300 border-green-500/40",
}

function getTagClass(tag: string) {
  return TAG_COLORS[tag] ?? "bg-zinc-700/40 text-zinc-300 border-zinc-600/40"
}

function aspectClass(ratio: Fest["aspectRatio"]) {
  if (ratio === "tall") return "aspect-[2/3]"
  if (ratio === "square") return "aspect-square"
  return "aspect-[16/9]"
}

function FestCard({ fest }: { fest: Fest }) {
  const [loaded, setLoaded] = useState(false)


  return (
    <div className="masonry-item">
      <div
        className="card-hover relative overflow-hidden rounded-xl bg-zinc-900 cursor-pointer group"
        style={{ border: "1px solid #27272a" }}
      >
        <div className={`relative ${aspectClass(fest.aspectRatio)} bg-zinc-800`}>
          <img
            src={fest.img}
            alt={`${fest.name} at ${fest.college}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
          {/* Gradient overlay — bottom 50%, black 0→85% */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0) 50%)",
            }}
          />

          {/* Tags top-right */}
          <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end">
            {fest.tags.map((tag) => (
              <span
                key={tag}
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border backdrop-blur-sm ${getTagClass(tag)}`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p
              className="text-[11px] text-zinc-400 mb-1 truncate"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {fest.district} · {fest.date}
            </p>
            <h3
              className="text-white text-xl leading-tight mb-0.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {fest.name}
            </h3>
            <p className="text-zinc-400 text-xs truncate">{fest.college}</p>
          </div>
        </div>

        {/* Hover overlay CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span
            className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-full shadow-xl"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            View Fest →
          </span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [district, setDistrict] = useState("All Districts")
  const [navSolid, setNavSolid] = useState(false)
  const [visibleCount, setVisibleCount] = useState(12)
  const [cursor, setCursor] = useState({ x: -999, y: -999 })
  const [overContent, setOverContent] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursor({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  const filtered =
    district === "All Districts"
      ? FESTS
      : FESTS.filter((f) => f.district === district)

  const visible = filtered.slice(0, visibleCount)

  // Solidify nav on scroll
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + 6)
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ backgroundColor: "#0a0a0b", minHeight: "100vh" }}>
      {/* Background cursor glow — only visible outside card content */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{ opacity: overContent ? 0 : 1 }}
      >
        <div
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            width: 520,
            height: 520,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(168,85,247,0.09) 0%, rgba(232,121,249,0.04) 40%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
            transition: "left 0.12s ease-out, top 0.12s ease-out",
          }}
        />
      </div>
      {/* NAV */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 transition-all duration-300"
        style={{
          backgroundColor: navSolid ? "rgba(10,10,11,0.9)" : "transparent",
          backdropFilter: navSolid ? "blur(12px)" : "none",
          borderBottom: navSolid ? "1px solid #27272a" : "1px solid transparent",
        }}
      >
        <a href="#" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #e879f9)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1.5L11.5 4.25V9.75L7 12.5L2.5 9.75V4.25L7 1.5Z"
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="7" r="1.5" fill="white" />
            </svg>
          </div>
          <span
            className="text-white text-xl tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FestKerala
          </span>
        </a>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-xs hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>
            {FESTS.length} fests listed
          </span>
          <button
            className="text-xs font-medium px-4 py-2 rounded-full transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #a855f7, #e879f9)",
              color: "white",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = "0.85"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = "1"
            }}
          >
            Submit Fest
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="pt-32 pb-10 px-6 text-center">
        <p
          className="text-[11px] tracking-[0.2em] uppercase text-zinc-500 mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Kerala · College Fests · 2025
        </p>
        <h1
          className="text-6xl md:text-8xl text-white leading-none mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Discover the{" "}
          <em className="not-italic" style={{ color: "#e879f9" }}>
            Fests
          </em>
        </h1>
        <p className="text-zinc-400 text-base max-w-md mx-auto" style={{ fontFamily: "var(--font-sans)" }}>
          Every cultural, technical, and artistic fest happening across Kerala's college campuses.
        </p>
      </div>

      {/* FILTER BAR */}
      <div
        className="sticky z-40 px-6 py-3 flex items-center gap-3"
        style={{
          top: "56px",
          backgroundColor: "rgba(10,10,11,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #27272a",
        }}
      >
        <div className="relative">
          <select
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value)
              setVisibleCount(12)
            }}
            className="appearance-none text-sm pl-4 pr-9 py-2 rounded-full cursor-pointer outline-none focus:ring-1 transition-colors"
            style={{
              backgroundColor: "#18181b",
              color: "#fafafa",
              border: "1px solid #3f3f46",
              fontFamily: "var(--font-sans)",
            }}
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <span className="text-zinc-600 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
          {filtered.length} fest{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* MASONRY GRID */}
      <div
        className="px-4 py-6 max-w-7xl mx-auto"
        onMouseEnter={() => setOverContent(true)}
        onMouseLeave={() => setOverContent(false)}
      >
        {filtered.length === 0 ? (
          <div className="text-center py-32 text-zinc-600" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
            No fests found in {district}.
          </div>
        ) : (
          <div className="masonry-grid">
            {visible.map((fest) => (
              <FestCard key={fest.id} fest={fest} />
            ))}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {visibleCount < filtered.length && (
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {visibleCount >= filtered.length && filtered.length > 0 && (
          <p
            className="text-center text-zinc-700 text-xs py-10"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            — all {filtered.length} fests shown —
          </p>
        )}
      </div>
    </div>
  )
}
