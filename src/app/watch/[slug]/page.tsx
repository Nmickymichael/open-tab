import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {LocalSaveShare} from "@/components/local-save-share";
import {cleanVideoDescription} from "@/lib/video-description";
import {isEnglishVideo} from "@/lib/english-video";
export const revalidate=300;
type Props={params:Promise<{slug:string}>};
async function getReview(slug:string){if(!supabase)return null;const {data}=await supabase.from("videos").select("*,creator:creators(name,slug,channel_url)").eq("slug",slug).eq("is_watch_review",true).eq("status","published").lte("published_at",new Date().toISOString()).maybeSingle();return data&&isEnglishVideo(data)?data:null;}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const v=await getReview(slug);return{title:v?.title||"OPEN TAB WATCH",description:cleanVideoDescription(v?.description)||"Watch the video on OPEN TAB.",openGraph:{images:v?.thumbnail_url?[v.thumbnail_url]:[]}}}
export default async function WatchReviewPage({params}:Props){
 const {slug}=await params;const v=await getReview(slug);if(!v)return notFound();
 const creator=v.creator?.name||v.creator_display_name||"Original video creator";
 const teaser=cleanVideoDescription(v.description)||"Press play and enjoy this video, right here on OPEN TAB.";
 const shortTeaser=teaser.length>150?teaser.slice(0,147).replace(/\s+\S*$/,"")+"…":teaser;
 const videoOnly=(v.watch_category||"").toLowerCase()==="movies"||/trailer|teaser/i.test(v.title||"");
 const relatedQuery=supabase!.from("videos").select("id,title,slug,thumbnail_url,watch_category,creator_display_name,creator:creators(name)").eq("is_watch_review",true).eq("status","published").lte("published_at",new Date().toISOString()).neq("id",v.id).order("published_at",{ascending:false}).limit(20);
 const {data:relatedRows}=v.watch_category?await relatedQuery.eq("watch_category",v.watch_category):await relatedQuery;
 const related=(relatedRows??[]).filter((item:any)=>isEnglishVideo(item)).slice(0,4);
 return <main className="wrap max-w-5xl py-8 md:py-12">
  <Link href="/watch" className="pill inline-flex">← Back to OPEN TAB WATCH</Link>
  <div className="eyebrow mt-6">{videoOnly?"OPEN TAB TV":"OPEN TAB WATCH"}</div>
  <h1 className="headline mt-3 text-3xl md:text-5xl">{v.title}</h1>
  <div className="mt-6 aspect-video bg-black"><iframe className="h-full w-full" src={"https://www.youtube-nocookie.com/embed/"+encodeURIComponent(v.youtube_id)} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
  {shortTeaser?<p className="muted mt-4 max-w-3xl text-sm leading-6">{shortTeaser}</p>:null}
  <LocalSaveShare id={v.id} title={v.title} kind="video"/>
  <aside className="mt-5 border-y border-neutral-300 py-5"><p className="eyebrow">VIDEO SOURCE & CREATOR CREDIT</p><p className="muted mt-2 text-xs leading-6">Original video by <strong>{creator}</strong> · Presented in OPEN TAB WATCH.{v.creator?.slug?<><span> · </span><Link className="underline" href={"/creators/"+v.creator.slug}>Creator profile</Link></>:null}{v.creator?.channel_url?.startsWith("https://")?<><span> · </span><a className="underline" href={v.creator.channel_url} target="_blank" rel="noopener noreferrer">Creator channel</a></>:null}</p></aside>
  {related?.[0]?<Link href={"/watch/"+related[0].slug} className="mt-5 flex min-h-14 items-center justify-between gap-4 border-b border-neutral-300 py-4 group"><span><span className="eyebrow block">Next up</span><strong className="mt-1 block group-hover:text-[#f04438]">{related[0].title}</strong></span><span className="text-xl text-[#f04438]">→</span></Link>:null}
  {related?.length?<section className="mt-12"><div className="section-rule mb-5"><p className="eyebrow">Keep watching</p><h2 className="text-2xl font-black">RELATED · NEXT UP</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((item:any,i:number)=><Link key={item.id} href={"/watch/"+item.slug} className="group"><div className="story-image aspect-video">{item.thumbnail_url?<img src={item.thumbnail_url} alt={item.title}/>:<div className="grid h-full place-items-center bg-[#171717] text-3xl font-black text-white">▶</div>}</div><p className="eyebrow mt-3">UP NEXT · 0{i+1}</p><h3 className="mt-2 font-black leading-snug group-hover:text-[#f04438]">{item.title}</h3><p className="muted mt-2 text-xs">{item.creator?.name||item.creator_display_name||"Original creator"}</p></Link>)}</div></section>:null}
 </main>;
}
