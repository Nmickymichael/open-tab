import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type Input = { topic?: string; angle?: string; format?: string; audience?: string; notes?: string };

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Sign in to use the AI Newsroom." }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return NextResponse.json({ error: "Supabase is not configured on the server." }, { status: 503 });

    const db = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await db.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });

    const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
    if (profileError || !profile || !["admin", "editor", "author"].includes(profile.role)) {
      return NextResponse.json({ error: "You do not have newsroom access." }, { status: 403 });
    }

    const input = (await request.json()) as Input;
    const topic = input.topic?.trim();
    if (!topic || topic.length > 500) return NextResponse.json({ error: "Enter a topic of up to 500 characters." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "AI is not configured yet. Add OPENAI_API_KEY to the deployment environment." }, { status: 503 });

    const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const prompt = `You are the editorial research and drafting assistant for OPEN TAB, an international digital publication. Produce a careful, original newsroom draft. Never invent facts, quotes, statistics, sources, dates or claims. If the brief lacks verifiable facts, clearly mark them as [FACT-CHECK]. Do not present speculation as fact. Avoid plagiarism and sensationalism. Return ONLY valid JSON with keys: headline, dek, excerpt, suggested_slug, article_markdown, key_claims_to_verify (array), suggested_sources (array of source types or reputable outlets to consult), social_caption. The article must be a useful first draft, not a finished verified report. Clearly distinguish known context from details requiring verification.\n\nFormat: ${input.format || "news analysis"}\nTopic: ${topic}\nAngle: ${input.angle || "Find a clear, reader-first angle"}\nAudience: ${input.audience || "International general audience"}\nAdditional notes: ${input.notes || "None"}`;
    const response = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.5, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You are a responsible editor. Return valid JSON only." }, { role: "user", content: prompt }] }),
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "The AI provider could not complete the draft." }, { status: 502 });
    const raw = payload?.choices?.[0]?.message?.content;
    if (!raw) return NextResponse.json({ error: "The AI provider returned an empty response." }, { status: 502 });
    let draft;
    try { draft = JSON.parse(raw); } catch { return NextResponse.json({ error: "The AI response was not valid JSON. Please try again." }, { status: 502 }); }
    return NextResponse.json({ draft, model });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected newsroom error." }, { status: 500 });
  }
}
