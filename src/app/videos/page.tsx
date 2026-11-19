import {supabase} from "@/lib/supabase";
import Link from "next/link";
import {FeedFreshness} from "@/components/feed-freshness";
import {SectionJump} from "@/components/section-jump";
import {VideoLibrary} from "@/components/video-library";
import {isEnglishVideo} from "@/lib/english-video";
export const revalidate=60;
export default async function Videos(){
 let items:any[]=[];let podcasts:any[]=[];
 if(supabase){
  const result=await supabase.from("videos").select("*,creator:creators(name,slug)").eq("status","published").lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(240);
  if(result.error){
   const fallback=await supabase.from("videos").select("*,creator:creators(name,slug)").eq("status","published").lte("published_at",new Date().toISOString()).order("published_at",{ascending:false}).limit(30);
   items=(fallback.data??[]).filter((v:any)=>v.video_type!=="podcast"&&isEnglishVideo(v));
   podcasts=(fallback.data??[]).filter((v:any)=>v.video_type==="podcast"&&isEnglishVideo(v));
  }else{
   items=(result.data??[]).filter((v:any)=>v.video_type!=="podcast"&&isEnglishVideo(v));
   podcasts=(result.data??[]).filter((v:any)=>v.video_type==="podcast"&&isEnglishVideo(v));
  }
 }
 return <main id="all-content" className="wrap py-12 min-h-[55vh]">
  <div className="eyebrow">Watch / Discover</div>
  <h1 className="headline text-6xl md:text-8xl mt-4">OPEN TAB TV<span className="accent">.</span></h1>
  <p className="muted mt-4 max-w-xl">Interviews, creator spotlights, sports moments and stories worth watching.</p>
  <div className="mt-3"><FeedFreshness label="OPEN TAB TV"/></div>
  <SectionJump items={[{label:"All",href:"#all-content",active:true},{label:"Videos",href:"#videos"},{label:"Podcasts",href:"#podcasts"},{label:"Browse all news",href:"/news"}]}/>
  <div className="flex flex-wrap gap-3 mt-5"><Link href="/watch" className="pill">OPEN TAB WATCH ↗</Link><Link href="/podcasts" className="pill">Podcast hub ↗</Link></div>
  {(items.length||podcasts.length)?<section id="videos" className="mt-10 scroll-mt-6">
   <div className="section-rule mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><p className="eyebrow">Watch now</p><h2 className="text-2xl font-black">LATEST VIDEOS</h2></div>
    <span className="muted text-[10px]">{items.length} videos loaded</span>
   </div>
   <VideoLibrary videos={[...items,...podcasts]}/>
  </section>:<p className="muted mt-12">Video programming is being prepared. Published videos will appear here.</p>}
  {podcasts.length>0&&<section id="podcasts" className="mt-16 scroll-mt-6">
   <div className="section-rule mb-6"><p className="eyebrow">Listen anywhere</p><h2 className="font-black text-2xl">LATEST PODCAST EPISODES</h2></div>
   <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{podcasts.map(v=><Link key={v.id} href={"/videos/"+v.slug} className="border border-neutral-300 p-5 hover:border-[#f04438]"><div className="eyebrow">Podcast episode</div><h3 className="mt-3 text-xl font-black">{v.title}</h3><p className="muted mt-2 text-xs">{v.creator?.name||"OPEN TAB"}</p></Link>)}</div>
  </section>}
 </main>;
}
