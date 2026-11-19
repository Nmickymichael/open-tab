"use client";

import {useState} from "react";
import Link from "next/link";

type StoryCardItem={id:string;title:string;href:string;image:string|null;label:string;kind:"story"|"video"};

function StoryVisual({item}:{item:StoryCardItem}){
 const [failed,setFailed]=useState(false);
 return <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#202020]">
  {item.image&&!failed?<img src={item.image} alt="" loading="lazy" onError={()=>setFailed(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/>:<div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#292929] via-[#171717] to-[#090909]"><span className="text-3xl font-black tracking-tight text-white">OPEN TAB<span className="text-[#f04438]">.</span></span></div>}
  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent"/>
  <span className="absolute left-2 top-2 rounded-full bg-[#f04438] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white">{item.kind==="video"?"▶ ":""}{item.label}</span>
  <div className="absolute inset-x-0 bottom-0 p-3"><h3 className="line-clamp-3 text-xs font-black leading-snug text-white sm:text-sm">{item.title}</h3></div>
 </div>;
}

export function HomeStoryStrip({items}:{items:StoryCardItem[]}){
 if(!items.length)return null;
 return <section aria-label="Featured stories and videos" className="border-b border-neutral-800 bg-[#101010] py-4 text-white sm:py-5">
  <div className="wrap">
   <div className="mb-3 flex items-end justify-between gap-3">
    <div><p className="eyebrow">A quick look at what’s happening</p><h2 className="mt-1 text-base font-black uppercase tracking-wide sm:text-lg">STORIES & HEADLINES<span className="text-[#f04438]">.</span></h2></div>
    <Link href="/news" className="shrink-0 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white">All stories ↗</Link>
   </div>
   <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
    {items.map(item=><Link key={item.id} href={item.href} aria-label={item.title} className="group w-[116px] shrink-0 snap-start sm:w-[138px] md:w-[150px]"><StoryVisual item={item}/></Link>)}
   </div>
  </div>
 </section>;
}
