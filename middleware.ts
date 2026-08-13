import { next } from "@vercel/functions";

/**
 * Edge middleware: serve simple OG HTML for known crawler User-Agents.
 * Non-crawler requests are forwarded to the SPA via `next()`.
 */

declare const process: {
  env: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
};

export const config = {
  matcher: "/fest/:id*",
};

const CRAWLER_USER_AGENTS = [
  "facebookexternalhit",
  "whatsapp",
  "twitterbot",
  "telegrambot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "pinterest",
  "redditbot",
  "vkshare",
  "skypeuripreview",
];

const SITE_NAME = "FestKerala";
const SITE_URL = "https://fest-kerala.vercel.app";
const FALLBACK_OG_IMAGE = `${SITE_URL}/og-fallback.png`;

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((pattern) => ua.includes(pattern));
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (start === end) {
    return s.toLocaleDateString("en-IN", { ...opts, year: "numeric" });
  }
  return `${s.toLocaleDateString("en-IN", opts)} – ${e.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

function renderHtml(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const url = escapeHtml(meta.url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:url" content="${url}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />

<meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
<p>${title}</p>
</body>
</html>`;
}

function fallbackResponse(url: string): Response {
  const html = renderHtml({
    title: `${SITE_NAME} — Discover Kerala's College Fests`,
    description:
      "Every cultural, tech & arts fest across Kerala's colleges — one place.",
    image: FALLBACK_OG_IMAGE,
    url,
  });
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default async function middleware(request: Request) {
  const userAgent = request.headers.get("user-agent");

  if (!isCrawler(userAgent)) return next();

  const pathname = new URL(request.url).pathname;
  const id = pathname.split("/fest/")[1]?.split("/")[0];
  const pageUrl = `${SITE_URL}${pathname}`;

  if (!id) {
    console.log("[OG] no id parsed from pathname:", pathname);
    return fallbackResponse(pageUrl);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log(
      "[OG] missing env vars — SUPABASE_URL present:",
      !!supabaseUrl,
      "SUPABASE_ANON_KEY present:",
      !!supabaseAnonKey,
    );
    return fallbackResponse(pageUrl);
  }

  try {
    const query = new URLSearchParams({
      id: `eq.${id}`,
      status: "eq.approved",
      select:
        "fest_name,college_name,district,start_date,end_date,poster_image_url",
    });
    const res = await fetch(`${supabaseUrl}/rest/v1/fests?${query}`, {
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        "Accept-Profile": "public",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.log(
        "[OG] supabase fetch not ok — status:",
        res.status,
        "body:",
        body,
      );
      return fallbackResponse(pageUrl);
    }

    const rows = (await res.json()) as Array<{
      fest_name: string;
      college_name: string;
      district: string;
      start_date: string;
      end_date: string;
      poster_image_url: string;
    }>;
    const fest = rows[0];

    if (!fest) {
      console.log(
        "[OG] no matching approved fest for id:",
        id,
        "rows returned:",
        rows.length,
      );
      return fallbackResponse(pageUrl);
    }

    console.log("[OG] serving real OG tags for fest:", fest.fest_name);

    const html = renderHtml({
      title: `${fest.fest_name} — ${SITE_NAME}`,
      description: `${fest.college_name} · ${fest.district} · ${formatDateRange(
        fest.start_date,
        fest.end_date,
      )}`,
      image: fest.poster_image_url,
      url: pageUrl,
    });

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("[OG] middleware threw:", err);
    return fallbackResponse(pageUrl);
  }
}
