"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {FeedImage} from "@/components/feed-image";

type NewsItem={title:string;url:string;description:string;date:string;source:string;region:string;image:string|null;imageCredit:string|null;imageLicense:string|null;imageSource:string|null};
type FeedSource={name:string;url:string;region:string};

function timeLabel(value:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"Latest":new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(date)+" UTC";
}
function readerUrl(item:NewsItem,nextItems:NewsItem[]=[]){
  const q=new URLSearchParams({url:item.url,title:item.title,source:item.source,date:timeLabel(item.date),back:"/news"});
  const next=nextItems.filter(x=>x.url!==item.url).slice(0,3).map(x=>({url:x.url,title:x.title,source:x.source,image:x.image}));
  if(next.length)q.set("next",JSON.stringify(next));
  if(item.image){q.set("image",item.image);if(item.imageCredit)q.set("imageCredit",item.imageCredit);if(item.imageLicense)q.set("imageLicense",item.imageLicense);if(item.imageSource)q.set("imageSource",item.imageSource);}
  return "/reader?"+q.toString();
}
export function NewsroomBrowser({items,sources}:{items:NewsItem[];sources:FeedSource[]}){
  const [active,setActive]=useState<string|null>(null);
  const visible=useMemo(()=>active?items.filter(item=>item.source.toLocaleLowerCase()===active.toLocaleLowerCase()):items,[items,active]);
  function choose(name:string|null){
    setActive(name);
    requestAnimationFrame(()=>document.getElementById("latest-headlines")?.scrollIntoView({behavior:"smooth",block:"start"}));
  }
  const searchUrl=(name:string)=>"https://news.google.com/search?q="+encodeURIComponent(name+" latest headlines")+"&hl=en&gl=KE&ceid=KE:en";
  return <>
    <div className="mt-8 flex flex-wrap gap-2" aria-label="Filter headlines by newsroom">
      <button type="button" onClick={()=>choose(null)} aria-pressed={active===null} className={"pill transition-colors "+(active===null?"!border-[#f04438] !bg-[#f04438] !text-white":"hover:border-[#f04438]")}>ALL NEWSROOMS</button>
      {sources.map(source=><button key={source.name} type="button" onClick={()=>choose(source.name)} aria-pressed={active===source.name} className={"pill transition-colors "+(active===source.name?"!border-[#f04438] !bg-[#f04438] !text-white":"hover:border-[#f04438]")}>{source.name}</button>)}
    </div>
    <div id="latest-headlines" className="section-rule mt-10 mb-6 scroll-mt-24 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black">{active?active.toUpperCase()+" HEADLINES":"LATEST INTERNATIONAL HEADLINES"}</h2>{active&&<p className="muted mt-1 text-xs">Showing stories from {active} in the current 60-headline batch.</p>}</div>
      {active&&<button type="button" onClick={()=>choose(null)} className="border border-neutral-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:border-[#f04438]">Show all headlines ×</button>}
    </div>
    {visible.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map(item=><article key={item.url} className="overflow-hidden border border-neutral-300">
      {item.image?<Link href={readerUrl(item,items)} className="block"><FeedImage src={item.image} alt={item.title}/><p className="muted px-5 pt-2 text-[10px]">{item.imageCredit?"Photo: "+item.imageCredit:"Image supplied via "+item.source+" feed"}{item.imageLicense?" · "+item.imageLicense:""}</p></Link>:<Link href={readerUrl(item,items)} className="flex aspect-video items-center justify-center bg-[#171717] text-5xl font-black text-white">OT<span className="accent">.</span></Link>}
      <div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="eyebrow">{item.source}</span><span className="muted text-[9px]">{timeLabel(item.date)}</span></div><Link href={readerUrl(item,items)}><h2 className="mt-3 text-xl font-black leading-tight hover:text-[#f04438]">{item.title}</h2></Link><p className="muted mt-4 text-[9px] font-bold uppercase tracking-widest">{item.region}</p><div className="mt-5 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest"><Link href={readerUrl(item,items)} className="text-[#f04438]">Read in OPEN TAB ↗</Link></div></div>
    </article>)}</div>:active?<div className="border border-dashed border-neutral-400 p-8 text-center"><h3 className="font-black">No {active} headlines in this batch</h3><p className="muted mx-auto mt-2 max-w-xl text-sm leading-6">This newsroom has no stories among the 60 headlines currently loaded. You can show all loaded headlines or open a live newsroom search to find its latest coverage.</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={()=>choose(null)} className="bg-[#f04438] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Show all headlines</button><a href={searchUrl(active)} target="_blank" rel="noopener noreferrer" className="border border-neutral-400 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:border-[#f04438]">Find {active} headlines ↗</a></div></div>:<div className="border border-dashed border-neutral-400 p-10 text-center"><h2 className="font-black">Live feeds are temporarily unavailable</h2><p className="muted mt-2 text-sm">Please try again shortly. OPEN TAB links readers to each publisher's original reporting.</p></div>}
  </>;
}
