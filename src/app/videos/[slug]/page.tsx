import {notFound} from "next/navigation";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import type {Metadata} from "next";
import {VideoBackButton} from "@/components/video-back-button";
import {LocalSaveShare} from "@/components/local-save-share";
export const revalidate=300;
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;if(!supabase)return{title:"Video"};const {data}=await supabase.from("videos").select("title,description,thumbnail_url").eq("slug",slug).eq("status","published").lte("published_at",new Date().toISOString()).maybeSingle();return{title:data?.title||"Video",description:data?.description||"Watch on OPEN TAB TV.",openGraph:{type:"video.other",images:data?.thumbnail_url?[data.thumbnail_url]:[]}}}
export default async function VideoPage({params}:Props){
 const {slug}=await params;if(!supabase)return notFound();
 const {data:v}=await supabase.from("videos").select("*,creator:creators(name,slug,channel_url)").eq("slug",slug).eq("status","published").lte("published_at",new Date().toISOString()).maybeSingle();if(!v)return notFound();
 const relatedQuery=supabase.from("videos").select("id,title,slug,thumbnail_url,video_type,creator:creators(name)").eq("status","published").lte("published_at",new Date().toISOString()).neq("id",v.id).order("published_at",{ascending:false}).limit(4);
 const {data:related}=v.video_type?await relatedQuery.eq("video_type",v.video_type):await relatedQuery;
 return <main className="wrap max-w-5xl py-8 md:py-12">
  <VideoBackButton/>
  <div className="eyebrow">{v.video_type==="podcast"?"OPEN TAB AUDIO":"OPEN TAB TV"}</div>
  <h1 className="headline mt-4 text-3xl md:text-6xl">{v.title}</h1>
  <div className="mt-7 aspect-video bg-black"><iframe className="h-full w-full" src={"https://www.youtube-nocookie.com/embed/"+encodeURIComponent(v.youtube_id)} title={v.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div>
  {v.description?<p className="muted mt-5 max-w-3xl text-sm leading-7">{v.description}</p>:null}
  <LocalSaveShare id={v.id} title={v.title} kind="video"/>
  {v.transcript_text?<details className="mt-8 border-t border-neutral-300 pt-5"><summary className="cursor-pointer font-black">Read transcript</summary><div className="article-content mt-4 whitespace-pre-wrap">{v.transcript_text}</div></details>:null}
  <aside className="mt-8 border-y border-neutral-300 py-5"><p className="eyebrow">VIDEO SOURCE & CREATOR CREDIT</p><p className="muted mt-2 text-xs leading-6">Original video by <strong>{v.creator?.name||"Original YouTube creator"}</strong>. Presented in OPEN TAB TV.{v.creator?.slug?<><span> · </span><Link className="underline" href={"/creators/"+v.creator.slug}>Creator profile</Link></>:null}{v.creator?.channel_url?.startsWith("https://")?<><span> · </span><a className="underline" href={v.creator.channel_url} target="_blank" rel="noopener noreferrer">Creator channel</a></>:null}</p><a className="mt-3 inline-flex min-h-11 items-center text-xs font-black uppercase tracking-widest text-[#f04438] underline underline-offset-4" href={"https://www.youtube.com/watch?v="+encodeURIComponent(v.youtube_id)} target="_blank" rel="noopener noreferrer">View original on YouTube ↗</a></aside>
  {related?.[0]?<Link href={"/videos/"+related[0].slug} className="mt-5 flex min-h-14 items-center justify-between gap-4 border-b border-neutral-300 py-4 group"><span><span className="eyebrow block">Next up</span><strong className="mt-1 block group-hover:text-[#f04438]">{related[0].title}</strong></span><span className="text-xl text-[#f04438]">→</span></Link>:null}
  {related?.length?<section className="mt-12"><div className="section-rule mb-5"><p className="eyebrow">Keep watching</p><h2 className="text-2xl font-black">RELATED · NEXT UP</h2></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((item:any,i:number)=><Link key={item.id} href={"/videos/"+item.slug} className="group"><div className="story-image aspect-video">{item.thumbnail_url?<img src={item.thumbnail_url} alt={item.title}/>:<div className="grid h-full place-items-center bg-[#171717] text-3xl font-black text-white">▶</div>}</div><p className="eyebrow mt-3">UP NEXT · 0{i+1}</p><h3 className="mt-2 font-black leading-snug group-hover:text-[#f04438]">{item.title}</h3><p className="muted mt-2 text-xs">{item.creator?.name||"OPEN TAB"}</p></Link>)}</div></section>:null}
 </main>
}
