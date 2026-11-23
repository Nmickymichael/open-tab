import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://opentab-media.netlify.app").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed = ["", "/about", "/contact", "/privacy", "/terms", "/editorial-policy", "/news", "/originals", "/watch", "/videos", "/search"].map((path) => ({
    url: SITE_URL + path,
    lastModified: now,
    changeFrequency: (path === "" ? "daily" : "weekly") as "daily" | "weekly",
    priority: path === "" ? 1 : path === "/news" || path === "/watch" || path === "/originals" ? 0.8 : 0.5,
  }));
  if (!supabase) return fixed;

  const [articles, categories, videos] = await Promise.all([
    supabase.from("articles").select("slug,updated_at,published_at").eq("status", "published").not("published_at", "is", null).lte("published_at", now.toISOString()),
    supabase.from("categories").select("slug").eq("is_active", true),
    supabase.from("videos").select("slug,created_at,published_at").eq("status", "published").not("published_at", "is", null).lte("published_at", now.toISOString()),
  ]);

  return [
    ...fixed,
    ...(categories.data || []).map((c) => ({ url: SITE_URL + "/category/" + c.slug, lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
    ...(articles.data || []).filter((a) => a.slug).map((a) => ({ url: SITE_URL + "/story/" + a.slug, lastModified: a.updated_at ? new Date(a.updated_at) : new Date(a.published_at!), changeFrequency: "monthly" as const, priority: 0.8 })),
    ...(videos.data || []).filter((v) => v.slug).map((v) => ({ url: SITE_URL + "/videos/" + v.slug, lastModified: v.created_at ? new Date(v.created_at) : new Date(v.published_at!), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
