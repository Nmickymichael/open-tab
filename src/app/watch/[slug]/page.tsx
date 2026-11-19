import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
export const revalidate=300;
type Props={params:Promise<{slug:string}>};
async function getReview(slug:string){if(!supabase)return null;const {data}=await supabase.from("videos").select("*,creator:creators(name,slug,channel_url)").eq("slug",slug).eq("is_watch_review",true).eq("status","published").lte("published_at",new Date().toISOString()).maybeSingle();return data;}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const v=await getReview(slug);return{title:v?.title||"Review",description:v?.description||"OPEN TAB WATCH review",openGraph:{images:v?.thumbnail_url?[v.thumbnail_url]:[]}}}
export default async function WatchReviewPage({params}:Props){
 const {slug}=await params;const v=await getReview(slug);if(!v)return notFound();
 const creator=v.creator?.name||v.creator_display_name||"Original YouTube creator";
 const original=v.source_url||"https://www.youtube.com/watch?v="+v.youtube_id;
 const videoOnly=(v.watch_category||"").toLowerCase()==="movies"||/trailer|teaser/i.test(v.title||"");
 return <main className="wrap max-w-5xl py-12 md:py-16">
  <Link href="/watch" className="pill inline-flex">← Back to OPEN TAB WATCH</Link>
  <div className="mt-7 eyebrow">{videoOnly?"OPEN TAB TV · MOVIE / TRAILER":"OPEN TAB WATCH · "+(v.watch_category||"Viral Culture")}</div>
  <h1 className="headline mt-4 text-4xl md:text-6xl">{v.title}</h1>
  {videoOnly?<><div className="mt-8 aspect-video bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube_id)}`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div><p className="muted mt-5 border-t border-neutral-300 pt-4 text-xs">Video by <strong>{creator}</strong> · Embedded from YouTube. Original video remains the property of its creator. <a className="accent underline" href={original} target="_blank" rel="noopener noreferrer">Watch source ↗</a></p></>:<>
   <p className="muted mt-4 text-sm">Original video by <strong>{creator}</strong>{v.published_at?" · Reviewed "+new Date(v.published_at).toLocaleDateString("en",{dateStyle:"medium"}):""}</p>
   <div className="mt-8 aspect-video bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube_id)}`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
   <section className="mt-10 max-w-3xl"><div className="eyebrow">The video</div><p className="mt-3 text-lg leading-8">{v.description}</p>{v.why_trending&&<div className="mt-9 border-t border-neutral-300 pt-6"><div className="eyebrow">Why it's trending</div><p className="mt-3 leading-7">{v.why_trending}</p></div>}{v.editorial_verdict&&<div className="mt-9 border-t-4 border-[#f04438] pt-6"><div className="eyebrow">The OPEN TAB verdict</div><p className="mt-3 leading-7">{v.editorial_verdict}</p></div>}<p className="muted mt-6 border-t border-neutral-300 pt-4 text-xs">Creator credit: {creator}. <a href={original} target="_blank" rel="noopener noreferrer" className="accent underline">Watch source ↗</a></p></section>
  </>}
 </main>;
}
