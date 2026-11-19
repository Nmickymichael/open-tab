import type {Metadata} from "next";
import Link from "next/link";
import {NewsroomBrowser} from "@/components/newsroom-browser";
import {FeedFreshness} from "@/components/feed-freshness";
import {GLOBAL_NEWS_SOURCES} from "@/lib/global-news-sources";
export const revalidate = 600;
export const metadata:Metadata = {
  title:"Latest World News",
  description:"The latest international headlines from trusted newsrooms around the world, with links to original reporting."
};
type FeedSource={name:string;url:string;region:string};
type NewsItem={title:string;url:string;description:string;date:string;source:string;region:string;image:string|null;imageCredit:string|null;imageLicense:string|null;imageSource:string|null};
const SOURCES=GLOBAL_NEWS_SOURCES;
const entities:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",ndash:"–",mdash:"—",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“",hellip:"…",copy:"©",reg:"®",trade:"™"};
function decode(value:string){return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,key:string)=>{if(key[0]==="#"){const hex=key[1]?.toLowerCase()==="x";const n=parseInt(key.slice(hex?2:1),hex?16:10);try{return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):" "}catch{return" "}}return entities[key.toLowerCase()]??entity})}
function clean(value:string){let out=value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1");for(let i=0;i<2;i++)out=decode(out);return out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function tag(block:string,name:string){const escaped=name.replace(":","\\:");const match=block.match(new RegExp("<"+escaped+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+escaped+">","i"));return match?.[1]?clean(match[1]):"";}
function linkOf(block:string){const atom=block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i);if(atom?.[1])return decode(atom[1]);const link=tag(block,"link");return link||tag(block,"guid");}
function imageOf(block:string){const match=block.match(/<(?:media:thumbnail|media:content|enclosure)[^>]+(?:url|href)=["']([^"']+)["']/i)||block.match(/<img[^>]+src=["']([^"']+)["']/i);return match?.[1]?decode(match[1]):null;}
function imageCreditOf(block:string){return tag(block,"media:credit")||tag(block,"image:credit")||"";}
function imageLicenseOf(block:string){return tag(block,"media:license")||tag(block,"image:license")||"";}
function imageSourceOf(block:string){const match=block.match(/<(?:media:thumbnail|media:content)[^>]+(?:url|href)=["']([^"']+)["']/i);return match?.[1]?decode(match[1]):"";}
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
      return [{title,url,description:clean(description).slice(0,260),date,source:source.name,region:source.region,image:imageOf(block),imageCredit:imageCreditOf(block),imageLicense:imageLicenseOf(block),imageSource:imageSourceOf(block)}];
    });
  }catch{return [];}
}
export default async function NewsPage(){
  const results=await Promise.all(SOURCES.map(readFeed));
  const seen=new Set<string>();
  const items=results.flat().filter(item=>{const key=item.url.split("?")[0];if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,60);
  return <main className="wrap min-h-[60vh] py-10 md:py-14">
    <div className="eyebrow">OPEN TAB · WORLD DESK · LIVE RSS ROUNDUP</div>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="headline text-6xl md:text-8xl">WORLD NEWS<span className="accent">.</span></h1><p className="muted mt-4 max-w-2xl text-sm leading-7">The latest headlines from trusted newsrooms across Africa and the world. Follow reporting from East, West, Central, North and Southern Africa alongside major international stories.</p></div><span className="border border-neutral-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest">{items.length} headlines · auto-refreshes</span></div>
    <div className="section-rule mt-8 mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-col items-start gap-1"><FeedFreshness label="World news"/><span className="muted text-[9px] uppercase tracking-widest">Feed cache: 10 minutes</span></div><span className="muted text-[10px] font-black uppercase tracking-widest">Select a newsroom to filter headlines</span></div>
    <NewsroomBrowser items={items} sources={SOURCES}/>
    <p className="muted mt-10 border-t border-neutral-300 pt-5 text-xs leading-6">OPEN TAB uses clean headline metadata to introduce external reporting. Publisher leads and article text are not reproduced in the reader; supporting photos are shown when the publisher feed supplies an image URL; source attribution is displayed where available.</p>
  </main>;
}
