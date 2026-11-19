import type {Metadata} from "next";
import Link from "next/link";
import {FeedImage} from "@/components/feed-image";
import {GLOBAL_NEWS_SOURCES} from "@/lib/global-news-sources";
export const revalidate = 600;
export const metadata:Metadata = {
  title:"Latest World News",
  description:"The latest international headlines from trusted newsrooms around the world, with links to original reporting."
};
type NewsItem={title:string;url:string;description:string;date:string;source:string;region:string;image:string|null};
const SOURCES=GLOBAL_NEWS_SOURCES;
const entities:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",ndash:"–",mdash:"—",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“",hellip:"…",copy:"©",reg:"®",trade:"™"};
function decode(value:string){return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,key:string)=>{if(key[0]==="#"){const hex=key[1]?.toLowerCase()==="x";const n=parseInt(key.slice(hex?2:1),hex?16:10);try{return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):" "}catch{return" "}}return entities[key.toLowerCase()]??entity})}
function clean(value:string){let out=value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1");for(let i=0;i<2;i++)out=decode(out);return out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function tag(block:string,name:string){const escaped=name.replace(":","\\:");const match=block.match(new RegExp("<"+escaped+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+escaped+">","i"));return match?.[1]?clean(match[1]):"";}
function linkOf(block:string){const atom=block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i);if(atom?.[1])return decode(atom[1]);const link=tag(block,"link");return link||tag(block,"guid");}
function imageOf(block:string){const match=block.match(/<(?:media:thumbnail|media:content|enclosure)[^>]+(?:url|href)=["']([^"']+)["']/i)||block.match(/<img[^>]+src=["']([^"']+)["']/i);return match?.[1]?decode(match[1]):null;}
async function readFeed(source:FeedSource):Promise<NewsItem[]>{
  try{
    const response=await fetch(source.url,{headers:{"user-agent":"OPEN TAB Newsroom/1.0 (+https://opentab-media.netlify.app)"},signal:AbortSignal.timeout(9000),next:{revalidate:600}});
    if(!response.ok)return [];
    const xml=await response.text();
    const blocks=[...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map(m=>m[0]);
    return blocks.slice(0,18).flatMap(block=>{
      const title=tag(block,"title");const url=linkOf(block);if(!title||!url||!/^https?:\/\//i.test(url))return [];
      const description=tag(block,"description")||tag(block,"summary")||tag(block,"content:encoded");
      const date=tag(block,"pubDate")||tag(block,"published")||tag(block,"updated");
      return [{title,url,description:clean(description).slice(0,260),date,source:source.name,region:source.region,image:imageOf(block)}];
    });
  }catch{return [];}
}
function readerUrl(item:NewsItem){const q=new URLSearchParams({url:item.url,title:item.title,summary:item.description.slice(0,1200),source:item.source,back:"/news"});if(item.image)q.set("image",item.image);return "/reader?"+q.toString()}
function timeLabel(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?"Latest":new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(date)+" UTC";}
export default async function NewsPage(){
  const results=await Promise.all(SOURCES.map(readFeed));
  const seen=new Set<string>();
  const items=results.flat().filter(item=>{const key=item.url.split("?")[0];if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,60);
  return <main className="wrap min-h-[60vh] py-10 md:py-14">
    <div className="eyebrow">OPEN TAB · WORLD DESK · LIVE RSS ROUNDUP</div>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="headline text-6xl md:text-8xl">WORLD NEWS<span className="accent">.</span></h1><p className="muted mt-4 max-w-2xl text-sm leading-7">The latest headlines from trusted newsrooms across Africa and the world. Follow reporting from East, West, Central, North and Southern Africa alongside major international stories.</p></div><span className="border border-neutral-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest">{items.length} headlines · auto-refreshes</span></div>
    <div className="mt-8 flex flex-wrap gap-2">{SOURCES.map(s=><span key={s.name} className="pill">{s.name}</span>)}</div>
    <div className="section-rule mt-10 mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">LATEST INTERNATIONAL HEADLINES</h2><span className="muted text-[10px] uppercase tracking-widest">Updated every 10 minutes</span></div>
    {items.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((item,i)=><article key={item.url} className="overflow-hidden border border-neutral-300">
      {item.image?<Link href={readerUrl(item)} className="block"><FeedImage src={item.image} alt={item.title}/></Link>:<Link href={readerUrl(item)} className="flex aspect-video items-center justify-center bg-[#171717] text-5xl font-black text-white">OT<span className="accent">.</span></Link>}
      <div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="eyebrow">{item.source}</span><span className="muted text-[9px]">{timeLabel(item.date)}</span></div><Link href={readerUrl(item)}><h2 className="mt-3 text-xl font-black leading-tight hover:text-[#f04438]">{item.title}</h2></Link>{item.description&&<p className="muted mt-3 text-sm leading-6">{item.description}</p>}<p className="muted mt-4 text-[9px] font-bold uppercase tracking-widest">{item.region}</p><div className="mt-5 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest"><Link href={readerUrl(item)} className="text-[#f04438]">Read in OPEN TAB ↗</Link><a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">Read original report ↗</a></div></div>
    </article>)}</div>:<div className="border border-dashed border-neutral-400 p-10 text-center"><h2 className="font-black">Live feeds are temporarily unavailable</h2><p className="muted mt-2 text-sm">Please try again shortly. OPEN TAB links readers to each publisher's original reporting.</p></div>}
    <p className="muted mt-10 border-t border-neutral-300 pt-5 text-xs leading-6">Headlines, short feed excerpts and images are supplied by the respective publishers' public RSS feeds. All reporting remains the property of its original publisher. OPEN TAB does not reproduce full articles; select a headline to read the complete report at its source.</p>
  </main>;
}
