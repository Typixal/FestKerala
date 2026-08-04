export type Category = "Tech" | "Music" | "Arts" | "Culture" | "Dance" | "Business"

export interface Fest {
  id: string
  fest_name: string
  college_name: string
  district: string
  start_date: string  // ISO date "YYYY-MM-DD"
  end_date: string
  poster_image_url: string
  registration_link: string
  status: "approved" | "pending"
  tags: Category[]
}

export const DISTRICTS = [
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
] as const

export const TAG_STYLES: Record<Category, string> = {
  Tech:     "bg-cyan-500/15 text-cyan-300 border-cyan-500/35",
  Music:    "bg-violet-500/15 text-violet-300 border-violet-500/35",
  Arts:     "bg-amber-500/15 text-amber-300 border-amber-500/35",
  Culture:  "bg-rose-500/15 text-rose-300 border-rose-500/35",
  Dance:    "bg-pink-500/15 text-pink-300 border-pink-500/35",
  Business: "bg-green-500/15 text-green-300 border-green-500/35",
}
