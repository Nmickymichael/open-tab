import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
export const revalidate=300;
type Props={params:Promise<{slug:string}>};
async function getReview(slug:string){if(!supabase)return null;const {data}=await supabase.from("videos").select("*,creator:creators(name,slug,channel_url)").eq("slug",slug).eq("is_watch_review",true).eq("status","published").lte("published_at",new Date().toISOString()).maybeSingle();return data;}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const v=await getReview(slug);return{title:v?.title||"OPEN TAB WATCH",description:v?.description||"Watch the video on OPEN TAB.",openGraph:{images:v?.thumbnail_url?[v.thumbnail_url]:[]}}}
export default async function WatchReviewPage({params}:Props){
 const {slug}=await params;const v=await getReview(slug);if(!v)return notFound();
 const creator=v.creator?.name||v.creator_display_name||"Original video creator";
 const teaser=(v.description||"Press play and enjoy this video, right here on OPEN TAB.").replace(/\\s+/g," ").trim();
 const shortTeaser=teaser.length>180?teaser.slice(0,177).replace(/\\s+\\S*$/,"")+"…":teaser;
 const videoOnly=(v.watch_category||"").toLowerCase()==="movies"||/trailer|teaser/i.test(v.title||"");
 return <main className="wrap max-w-5xl py-8 md:py-12">
  <Link href="/watch" className="pill inline-flex">← Back to OPEN TAB WATCH</Link>
  <div className="mt-6 eyebrow">{videoOnly?"OPEN TAB TV":"OPEN TAB WATCH"}</div>
  <h1 className="headline mt-3 text-3xl md:text-5xl">{v.title}</h1>
  <div className="mt-6 aspect-video bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube_id)}`} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
  <p className="muted mt-4 max-w-3xl text-sm leading-6">{shortTeaser}</p>
  <p className="muted mt-3 border-t border-neutral-300 pt-3 text-xs">Video by <strong>{creator}</strong> · Watch right here on OPEN TAB.</p>
 </main>;
}
