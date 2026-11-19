"use client";

import {useMemo,useState} from "react";
import Link from "next/link";

type VideoItem={
 id:string;title:string;slug:string;description?:string|null;thumbnail_url?:string|null;
 watch_category?:string|null;video_type?:string|null;creator_display_name?:string|null;
 creator?:{name?:string|null;slug?:string|null}|null;
 [key:string]:any;
};

const GENRES=[
 "Animation","Beauty","Comedy","Commentary","Reviews","DIY & Builds","Education & Science",
 "Fashion","Film & Video","Food","Gaming","Health & Fitness","Lifestyle","Maker",
 "Music","News","Sports","Technology","Vlogging","Art & Design","Podcasts","Viral Culture","Movies"
];

function genreFor(video:VideoItem):string{
 const stored=String(video.watch_category||"").trim();
 const aliases:Record<string,string>={"tech":"Technology","education":"Education & Science","creators":"Vlogging","creator":"Vlogging","food & cooking":"Food","filmmakers":"Film & Video","youtube artists":"Art & Design"};
 const normalized=aliases[stored.toLowerCase()]||stored;
 const known=GENRES.find(g=>g.toLowerCase()===normalized.toLowerCase());
 if(known)return known;
 const text=[video.title,video.description,video.creator?.name,video.creator_display_name].join(" ").toLowerCase();
 if(/\b(mrwhosetheboss|mkbhd|marques brownlee|unbox therapy|linus tech tips|dave2d|short circuit)\b/.test(text)||/\b(phone|smartphone|laptop|tech review|gadget|android|iphone|pc build)\b/.test(text))return "Technology";
 if(/\b(mrbeast|challenge|last to|24 hour challenge|hide and seek|survive)\b/.test(text))return "Viral Culture";
 if(/\b(gameplay|gaming|minecraft|fortnite|roblox|gta|playthrough|esports)\b/.test(text))return "Gaming";
 if(/\b(podcast|episode|interview|conversation)\b/.test(text))return "Podcasts";
 if(/\b(recipe|cook|cooking|food|baking|chef)\b/.test(text))return "Food";
 if(/\b(makeup|beauty|skincare|haircare)\b/.test(text))return "Beauty";
 if(/\b(fitness|workout|training|gym|health)\b/.test(text))return "Health & Fitness";
 if(/\b(music|official video|live performance|song|album|cover)\b/.test(text))return "Music";
 if(/\b(review|reviewed|vs\.|comparison|unboxing|first look)\b/.test(text))return "Reviews";
 if(/\b(diy|build|maker|woodworking|3d print|craft|restoration)\b/.test(text))return "DIY & Builds";
 if(/\b(science|experiment|explained|learn|education|documentary)\b/.test(text))return "Education & Science";
 if(/\b(news|election|breaking|report)\b/.test(text))return "News";
 if(/\b(soccer|football|basketball|tennis|nba|nfl|match highlights)\b/.test(text))return "Sports";
 if(/\b(animation|animated|animator|cartoon)\b/.test(text))return "Animation";
 if(/\b(film|short film|cinematography|movie|trailer)\b/.test(text))return "Movies";
 if(/\b(fashion|style|outfit|lookbook)\b/.test(text))return "Fashion";
 if(/\b(vlog|day in my life|travel diary)\b/.test(text))return "Vlogging";
 if(/\b(commentary|reaction|takes|opinion)\b/.test(text))return "Commentary";
 return stored||"Viral Culture";
}

function getViews(video:VideoItem):number|null{
 const candidates=[video.view_count,video.views,video.youtube_view_count,video.viewCount,video.views_count,video.statistics?.viewCount,video.statistics?.view_count,video.stats?.views,video.stats?.viewCount,video.youtube?.statistics?.viewCount,video.view_count_text,video.viewCountText,video.views_text];
 for(const value of candidates){
  if(typeof value==="number"&&Number.isFinite(value)&&value>=0)return value;
  if(typeof value==="string"&&value.trim()!==""){
   const text=value.trim().replace(/,/g,"");
   const match=text.match(/^([\d.]+)\s*([KMB])?\s*(?:views?)?$/i);
   if(match){const amount=Number(match[1]);const multiplier=({K:1e3,M:1e6,B:1e9} as Record<string,number>)[(match[2]||"").toUpperCase()]||1;if(Number.isFinite(amount)&&amount>=0)return Math.round(amount*multiplier);}
   const parsed=Number(text);if(Number.isFinite(parsed)&&parsed>=0)return parsed;
  }
 }
 return null;
}
function formatViews(value:number|null):string{
 return value===null?"":`${new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:1}).format(value)} views`;
}

export function VideoLibrary({videos}:{videos:VideoItem[]}){
 const[query,setQuery]=useState("");
 const[genre,setGenre]=useState("All");
 const availableGenres=useMemo(()=>GENRES.filter(item=>videos.some(video=>genreFor(video)===item)),[videos]);
 const filtered=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase();
  return videos.filter(video=>{
   const matchesGenre=genre==="All"||genreFor(video)===genre;
   const matchesQuery=!term||[video.title,video.description,video.creator?.name,video.creator?.slug,video.creator_display_name,genreFor(video)].some(value=>String(value??"").toLocaleLowerCase().includes(term));
   return matchesGenre&&matchesQuery;
  });
 },[videos,query,genre]);

 return <div>
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
   <label className="sr-only" htmlFor="open-tab-video-search">Search videos</label>
   <div className="relative w-full sm:max-w-md">
    <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 muted">⌕</span>
    <input id="open-tab-video-search" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search videos, creators, genres or artists…" className="w-full rounded-full border border-neutral-300 bg-transparent py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#f04438] focus:ring-2 focus:ring-[#f04438]/15" />
   </div>
   <p className="muted text-xs" aria-live="polite">{filtered.length} of {videos.length} videos</p>
  </div>
  <div className="mb-7 flex flex-wrap gap-2" aria-label="Filter videos by genre">
   {["All",...availableGenres].map(item=><button key={item} type="button" onClick={()=>setGenre(item)} aria-pressed={genre===item} className={`rounded-full border px-3 py-2 text-xs font-bold transition ${genre===item?"border-[#f04438] bg-[#f04438] text-white":"border-neutral-300 hover:border-[#f04438]"}`}>{item}</button>)}
  </div>
  {filtered.length>0?<div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
   {filtered.map(video=>{
    const views=getViews(video);const category=genreFor(video);
    return <Link href={`/videos/${video.slug}`} key={video.id} className="group min-w-0">
     <div className="story-image relative aspect-video overflow-hidden">
      {video.thumbnail_url?<img src={video.thumbnail_url} alt={video.title} loading="lazy"/>:<div className="grid h-full place-items-center bg-[#171717] text-4xl text-white">▶</div>}
      <span className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-5xl text-white">▶</span>
      <span className="absolute bottom-2 left-2 z-20 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">{category}</span>
     </div>
     <h3 className="mt-3 text-xl font-black group-hover:text-[#f04438]">{video.title}</h3>
     <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <p className="muted text-xs">{video.creator?.name||video.creator_display_name||"OPEN TAB"}</p>
      {views!==null&&<p className="muted text-xs" title={views.toLocaleString()+" views"}>◉ {formatViews(views)}</p>}
     </div>
    </Link>;
   })}
  </div>:<div className="rounded-2xl border border-dashed border-neutral-300 px-5 py-12 text-center">
   <p className="font-black">No videos found</p><p className="muted mt-2 text-sm">Try another genre, title, topic, creator or artist.</p>
   {(query||genre!=="All")&&<button type="button" onClick={()=>{setQuery("");setGenre("All");}} className="pill mt-4">Clear filters</button>}
  </div>}
 </div>;
}
