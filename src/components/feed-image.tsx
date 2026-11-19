"use client";
import {useState} from "react";

const palettes=[
 {base:"#101827",glow:"#2563eb",accent:"#38bdf8"},
 {base:"#21121c",glow:"#be123c",accent:"#fb7185"},
 {base:"#14231f",glow:"#0f766e",accent:"#5eead4"},
 {base:"#211a12",glow:"#b45309",accent:"#fbbf24"},
 {base:"#1c1730",glow:"#7c3aed",accent:"#c4b5fd"},
 {base:"#17202a",glow:"#475569",accent:"#e2e8f0"},
];
function visualSeed(value:string){
 let hash=0;
 for(let i=0;i<value.length;i++)hash=(hash*31+value.charCodeAt(i))|0;
 return Math.abs(hash);
}
export function FeedImage({src,alt,video=false}:{src:string|null;alt:string;video?:boolean}){
 const[failed,setFailed]=useState(false);
 const seed=visualSeed(alt||"OPEN TAB");
 const palette=palettes[seed%palettes.length];
 const mark=(alt.trim()[0]||"O").toUpperCase();
 return <div className={"story-image mb-4 block "+(video?"aspect-video":"aspect-[16/10]")+" overflow-hidden"}>
  {src&&!failed?<img src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)} className="h-full w-full object-cover"/>:
   <div role="img" aria-label={"OPEN TAB illustrative editorial artwork for: "+alt} className="relative isolate grid h-full w-full overflow-hidden text-white" style={{background:"radial-gradient(ellipse at 78% 22%, "+palette.glow+" 0%, transparent 48%), linear-gradient(135deg, "+palette.base+" 0%, #080b12 100%)"}}>
    <div className="absolute inset-0 -z-10 opacity-25" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.16) 1px,transparent 1px)",backgroundSize:"34px 34px"}}/>
    <div className="absolute -right-8 -top-16 -z-10 h-64 w-64 rounded-full border-[1px] opacity-40" style={{borderColor:palette.accent,boxShadow:"0 0 0 22px "+palette.glow+"22,0 0 0 52px "+palette.glow+"18"}}/>
    <div className="absolute -bottom-20 -left-10 -z-10 h-52 w-52 rotate-45 border opacity-30" style={{borderColor:palette.accent}}/>
    <div className="flex h-full flex-col justify-between p-5 sm:p-7">
     <div className="flex items-center justify-between gap-3"><span className="text-[9px] font-black uppercase tracking-[.28em] text-white/75">OPEN TAB <span style={{color:palette.accent}}>●</span> VISUAL DESK</span><span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/55">OT / {String(seed%90+10).padStart(2,"0")}</span></div>
     <div className="relative">
      <div className="absolute -top-20 right-0 select-none text-[clamp(6rem,18vw,12rem)] font-black leading-none opacity-[.12]" aria-hidden="true">{mark}</div>
      <div className="mb-3 h-1 w-12" style={{background:palette.accent}}/>
      <p className="max-w-[92%] text-balance text-lg font-black leading-tight sm:text-2xl">{alt}</p>
     </div>
     <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-3"><span className="text-[8px] font-bold uppercase tracking-[.2em] text-white/65">THE WORLD IN FOCUS</span><span className="text-[8px] font-bold uppercase tracking-[.16em]" style={{color:palette.accent}}>ILLUSTRATIVE ARTWORK</span></div>
    </div>
   </div>}
 </div>
}
