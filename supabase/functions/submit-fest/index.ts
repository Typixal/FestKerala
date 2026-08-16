import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      turnstile_token,
      fest_name,
      college_name,
      district,
      start_date,
      end_date,
      poster_image_url,
      registration_link,
      tags,
    } = body;

    // 1. Verify Turnstile token
    const turnstileRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: Deno.env.get("TURNSTILE_SECRET_KEY"),
          response: turnstile_token,
        }),
      },
    );
    const turnstileData = await turnstileRes.json();

    if (!turnstileData.success) {
      return new Response(
        JSON.stringify({ error: "Captcha verification failed" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Server-side validation
    if (!fest_name || fest_name.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid fest name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!college_name || college_name.length > 200) {
      return new Response(JSON.stringify({ error: "Invalid college name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return new Response(
        JSON.stringify({ error: "End date before start date" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!registration_link || !/^https?:\/\//.test(registration_link)) {
      return new Response(
        JSON.stringify({ error: "Invalid registration link" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Insert using service role (bypasses RLS, forces pending)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("fests")
      .insert({
        fest_name,
        college_name,
        district,
        start_date,
        end_date,
        poster_image_url,
        registration_link,
        tags,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
