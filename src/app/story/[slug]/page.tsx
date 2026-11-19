import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { CommentForm } from "@/components/comment-form";
import { ArticleView } from "@/components/article-view";
import { ReaderActions } from "@/components/reader-actions";
import { ReaderControls } from "@/components/reader-controls";
import { readingTime } from "@/components/reading-time";
import { MovieRating } from "@/components/movie-rating";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const revalidate = 60;

type StoryParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StoryParams): Promise<Metadata> {
  const { slug } = await params;
  if (!supabase) return { title: "Story | OPEN TAB" };

  // Publication status is the editorial source of truth. Avoid comparing
  // timestamps from different server clocks here; scheduled stories should
  // remain in "scheduled" status until the publishing job releases them.
  const { data } = await supabase
    .from("articles")
    .select("title,excerpt,seo_title,seo_description,cover_image,published_at,updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const title = data?.seo_title || data?.title || "Story";
  const description = data?.seo_description || data?.excerpt || "Read the latest from OPEN TAB.";
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://opentab-media.netlify.app";

  return {
    title,
    description,
    alternates: { canonical: base + "/story/" + slug },
    openGraph: {
      type: "article",
      title,
      description,
      images: data?.cover_image ? [data.cover_image] : [],
      publishedTime: data?.published_at || undefined,
      modifiedTime: data?.updated_at || undefined,
    },
  };
}

export default async function StoryPage({ params }: StoryParams) {
  const { slug } = await params;
  if (!supabase) return notFound();

  // Do not apply a second timestamp gate to already-published content.
  // The previous lte(published_at, new Date()) check could hide valid
  // published stories when the hosting and database clocks differed.
  const { data: story, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) console.error("OPEN TAB story lookup failed:", error.message);
  if (!story) return notFound();

  const [{ data: category }, { data: author }, { data: comments }, { data: related }, { data: corrections }] =
    await Promise.all([
      story.category_id
        ? supabase.from("categories").select("name,slug").eq("id", story.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      story.author_id
        ? supabase.from("profiles").select("id,display_name").eq("id", story.author_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("comments").select("id,display_name,body,created_at")
        .eq("article_id", story.id).eq("status", "approved")
        .order("created_at", { ascending: false }).limit(100),
      story.category_id
        ? supabase.from("articles").select("id,title,slug,excerpt,cover_image,cover_image_alt,published_at")
            .eq("category_id", story.category_id).eq("status", "published")
            .neq("id", story.id).order("published_at", { ascending: false }).limit(3)
        : Promise.resolve({ data: [] }),
      supabase.from("content_corrections").select("id,correction,corrected_at")
        .eq("article_id", story.id).order("corrected_at", { ascending: false }),
    ]);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://opentab-media.netlify.app";
  const minutes = readingTime(story.content || "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.seo_description || story.excerpt || "",
    image: story.cover_image ? [{ "@type": "ImageObject", url: story.cover_image, creditText: story.cover_image_credit || undefined, license: story.cover_image_license_url || story.cover_image_license || undefined, acquireLicensePage: story.cover_image_source || undefined }] : undefined,
    datePublished: story.published_at,
    dateModified: story.updated_at,
    author: { "@type": "Person", name: story.author_display_name || author?.display_name || "OPEN TAB Editorial" },
    publisher: { "@type": "Organization", name: "OPEN TAB" },
    mainEntityOfPage: base + "/story/" + story.slug,
  };

  return (
    <article className="wrap max-w-4xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <ArticleView articleId={story.id} />
      <div className="eyebrow">{category?.name || "OPEN TAB"} · {story.published_at ? new Date(story.published_at).toLocaleDateString("en", { dateStyle: "long" }) : ""}</div>
      <h1 className="headline text-4xl md:text-7xl mt-5">{story.title}</h1>
      {story.excerpt && <p className="text-xl md:text-2xl muted leading-relaxed mt-6">{story.excerpt}</p>}
      <div className="text-xs muted mt-5">
        By {story.author_display_name ? story.author_display_name : author?.id ? <Link className="accent font-bold" href={"/contributors/" + author.id}>{author.display_name || "OPEN TAB Contributor"}</Link> : author?.display_name || "OPEN TAB Editorial"}
        {" · "}{minutes} min read · A Mickoryn Media publication
      </div>
      <ReaderActions articleId={story.id} title={story.title} />
      <ReaderControls />
      {story.cover_image && (
        <figure className="mt-9">
          <img src={story.cover_image} alt={story.cover_image_alt || story.title} className="w-full max-h-[560px] object-cover" />
          {(story.cover_image_alt || story.cover_image_credit) && <figcaption className="muted mt-2 text-xs">{story.cover_image_alt}{story.cover_image_context ? <span>{story.cover_image_alt ? " · " : ""}{story.cover_image_context}</span> : null}{story.cover_image_credit ? <span>{story.cover_image_alt || story.cover_image_context ? " · " : ""}Photo: {story.cover_image_credit}</span> : null}{story.cover_image_source ? <span> · <a className="underline" href={story.cover_image_source} target="_blank" rel="noopener noreferrer">Image source</a></span> : null}{story.cover_image_license ? <span> · {story.cover_image_license_url ? <a className="underline" href={story.cover_image_license_url} target="_blank" rel="noopener noreferrer">{story.cover_image_license}</a> : story.cover_image_license}</span> : null}</figcaption>}
        </figure>
      )}
      {(story.source_url || story.source_platform) && <aside className="mt-8 border-y border-neutral-300 py-4"><div className="eyebrow">ORIGINAL SOURCE</div><p className="mt-2 text-sm">{story.source_platform || "Source"}{story.source_url ? <> · <a className="accent underline" href={story.source_url} target="_blank" rel="noopener noreferrer">View original reporting / post ↗</a></> : null}</p></aside>}
      <div className="article-content mt-10 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{story.content || ""}</ReactMarkdown>
      </div>
      {corrections?.length ? <aside className="correction-note mt-10">
        <div className="eyebrow">EDITORIAL CORRECTION</div>
        {corrections.map(c => <p key={c.id} className="text-sm mt-2">{c.correction}</p>)}
      </aside> : null}
      <section className="mt-12 border-t border-neutral-300 pt-7">
        <h2 className="headline text-3xl">READER COMMENTS</h2>
        {comments?.length ? comments.map(c => <div key={c.id} className="border-b border-neutral-300 py-4">
          <b className="text-sm">{c.display_name}</b>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{c.body}</p>
        </div>) : <p className="muted mt-3 text-sm">No comments yet. Start the conversation.</p>}
      </section>
      <CommentForm articleId={story.id} />
      {category?.slug === "movies" ? <MovieRating articleId={story.id} /> : null}
      {related?.length ? <section className="mt-14">
        <div className="section-rule mb-6"><h2 className="font-black text-2xl">MORE LIKE THIS</h2></div>
        <div className="grid sm:grid-cols-3 gap-6">
          {related.map(r => <Link key={r.id} href={"/story/" + r.slug} className="font-black text-lg hover:text-[#f04438]">
            {r.title}<span className="block muted text-xs font-normal mt-2">Read next ↗</span>
          </Link>)}
        </div>
      </section> : null}
    </article>
  );
}
