import { next } from "@vercel/functions";

// process is a real global provided by Vercel's Edge Runtime at runtime,
// but its type isn't declared unless @types/node (or similar) is installed.
// This narrow declaration covers only what this file actually uses, so
// TypeScript type-checks cleanly without pulling in the full Node types.
// IMPORTANT: access process directly (not via globalThis.process) — Edge
// Runtime provides it as an injected global binding, which is not
// guaranteed to also appear as an enumerable property on globalThis.
declare const process: {
  env: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  };
};

// Vercel Routing Middleware — runs before the SPA is served.
//
// Purpose: WhatsApp/Instagram/Facebook/Twitter/Telegram link-preview
// crawlers don't execute JavaScript. They fetch the URL once and read
// whatever <meta property="og:..."> tags are present in that first HTML
// response. Since this is a client-rendered Vite SPA, index.html is
// identical for every route — so without this middleware, every shared
// fest link would show the same generic (or blank) preview.
//
// This middleware only intercepts requests to /fest/:id whose User-Agent
// matches a known crawler. For those, it fetches the fest from Supabase
// and returns a small standalone HTML document with fest-specific OG tags.
// Real browsers (i.e. anyone not matching the crawler patterns) are passed
// straight through to the normal SPA via next(), completely untouched.
//
// This project is NOT Next.js — Vercel's Routing Middleware is
// framework-agnostic here, so this uses the plain Request/Response Web
// APIs (both available in the global scope, no import needed) plus the
// small @vercel/functions helper package, rather than next/server (which
// is Next.js-only and would not work in this Vite project).
//
// Config note: this file runs on Vercel's Edge Runtime, NOT in the Vite
// build — it does not have access to import.meta.env. Set these two values
// separately in the Vercel dashboard under Project Settings → Environment
// Variables (same public anon-key values as VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY are fine to reuse — the anon key is public by
// design):
//   SUPABASE_URL
//   SUPABASE_ANON_KEY

export const config = {
  matcher: "/fest/:id*",
};

const CRAWLER_USER_AGENTS = [
  "facebookexternalhit", // Facebook + Instagram (shares FB's crawler)
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

  // Real users (and anything not recognized as a crawler) pass straight
  // through to the normal SPA — this middleware never touches their request.
  if (!isCrawler(userAgent)) {
    return next();
  }

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
