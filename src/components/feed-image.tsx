"use client";
import {useState} from "react";
export function FeedImage({src,alt,video=false}:{src:string|null;alt:string;video?:boolean}){
 const[failed,setFailed]=useState(false);
 return <div className={"story-image mb-4 block "+(video?"aspect-video":"aspect-[16/10]")+" overflow-hidden"}>
  {src&&!failed?<img src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)} className="h-full w-full object-cover"/>:<div role="img" aria-label={"OPEN TAB image unavailable: "+alt} className="grid h-full w-full place-items-center bg-[#171717] text-center text-white"><div><div className="text-4xl font-black tracking-tight">OPEN TAB<span className="text-[#f04438]">.</span></div><div className="mt-2 text-[9px] font-bold uppercase tracking-[.2em] text-neutral-400">STORY IMAGE UNAVAILABLE</div></div></div>}
 </div>
}
