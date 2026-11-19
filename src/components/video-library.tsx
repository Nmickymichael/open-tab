"use client";

import {useMemo,useState} from "react";
import Link from "next/link";

type VideoItem={
 id:string;title:string;slug:string;description?:string|null;thumbnail_url?:string|null;
 creator?:{name?:string|null;slug?:string|null}|null;
 [key:string]:any;
};

function getViews(video:VideoItem):number|null{
 const candidates=[
  video.view_count,video.views,video.youtube_view_count,video.viewCount,video.views_count,
  video.statistics?.viewCount,video.statistics?.view_count,
  video.stats?.views,video.stats?.viewCount,
  video.youtube?.statistics?.viewCount,
  video.view_count_text,video.viewCountText,video.views_text
 ];
 for(const value of candidates){
  if(typeof value==="number"&&Number.isFinite(value)&&value>=0)return value;
  if(typeof value==="string"&&value.trim()!==""){
   const text=value.trim().replace(/,/g,"");
   const match=text.match(/^([\\d.]+)\\s*([KMB])?\\s*(?:views?)?$/i);
   if(match){
    const amount=Number(match[1]);
    const multiplier=({K:1e3,M:1e6,B:1e9} as Record<string,number>)[(match[2]||"").toUpperCase()]||1;
    if(Number.isFinite(amount)&&amount>=0)return Math.round(amount*multiplier);
   }
   const parsed=Number(text);
   if(Number.isFinite(parsed)&&parsed>=0)return parsed;
  }
 }
 return null;
}
function formatViews(value:number|null):string{
 return value===null?"":`${new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(value)} views`;
}

export function VideoLibrary({videos}:{videos:VideoItem[]}){
 const[query,setQuery]=useState("");
 const filtered=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase();
  if(!term)return videos;
  return videos.filter(video=>[
   video.title,video.description,video.creator?.name,video.creator?.slug
  ].some(value=>String(value??"").toLocaleLowerCase().includes(term)));
 },[videos,query]);

 return <div>
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
   <label className="sr-only" htmlFor="open-tab-video-search">Search videos</label>
   <div className="relative w-full sm:max-w-md">
    <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 muted">⌕</span>
    <input id="open-tab-video-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search videos, creators or artists…" className="w-full rounded-full border border-neutral-300 bg-transparent py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#f04438] focus:ring-2 focus:ring-[#f04438]/15" />
   </div>
   <p className="muted text-xs" aria-live="polite">{filtered.length} of {videos.length} videos</p>
  </div>
  {filtered.length>0?<div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
   {filtered.map(video=>{
    const views=getViews(video);
    return <Link href={`/videos/${video.slug}`} key={video.id} className="group min-w-0">
     <div className="story-image relative aspect-video overflow-hidden">
      {video.thumbnail_url?<img src={video.thumbnail_url} alt={video.title} loading="lazy"/>:<div className="grid h-full place-items-center bg-[#171717] text-4xl text-white">▶</div>}
      <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-5xl text-white">▶</span>
     </div>
     <h3 className="mt-3 text-xl font-black group-hover:text-[#f04438]">{video.title}</h3>
     <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <p className="muted text-xs">{video.creator?.slug?<span className="accent">{video.creator.name}</span>:video.creator?.name||"OPEN TAB"}</p>
      {views!==null&&<p className="muted text-xs" title={views.toLocaleString()+" views"}>◉ {formatViews(views)}</p>}
     </div>
    </Link>;
   })}
  </div>:<div className="rounded-2xl border border-dashed border-neutral-300 px-5 py-12 text-center">
   <p className="font-black">No videos found</p>
   <p className="muted mt-2 text-sm">Try another title, topic, creator or artist.</p>
   {query&&<button type="button" onClick={()=>setQuery("")} className="pill mt-4">Clear search</button>}
  </div>}
 </div>;
}
