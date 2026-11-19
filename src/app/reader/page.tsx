import {FeedImage} from "@/components/feed-image";
import {LocalSaveShare} from "@/components/local-save-share";
import Link from "next/link";
import {notFound} from "next/navigation";
export const revalidate=300;
const entities:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" ",ndash:"–",mdash:"—",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“",hellip:"…",copy:"©",reg:"®",trade:"™"};
function text(value:string){let out=value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,key:string)=>{if(key[0]==="#"){const hex=key[1]?.toLowerCase()==="x";const n=parseInt(key.slice(hex?2:1),hex?16:10);try{return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):" "}catch{return" "}}return entities[key.toLowerCase()]??entity});for(let i=0;i<2;i++)out=out.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,key:string)=>entities[key.toLowerCase()]??entity);return out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function safeUrl(value:string){try{const u=new URL(value);return u.protocol==="https:"||u.protocol==="http:"?u.toString():null}catch{return null}}
type NextItem={title:string;url:string;source:string};
export default async function ReaderPage({searchParams}:{searchParams:Promise<{url?:string;title?:string;source?:string;image?:string;imageCredit?:string;imageLicense?:string;imageSource?:string;date?:string;back?:string;next?:string}>}){
 const p=await searchParams;const url=safeUrl(p.url||"");if(!url)return notFound();
 const title=text(p.title||"OPEN TAB Reader");const source=text(p.source||new URL(url).hostname);const date=text(p.date||"");
 const image=safeUrl(p.image||"");const imageCredit=text(p.imageCredit||"");const imageLicense=text(p.imageLicense||"");const imageSource=safeUrl(p.imageSource||"");
 const showImage=!!(image&&imageCredit&&imageLicense);const licenseUrl=safeUrl(imageLicense);
 const back=p.back&&(p.back==="/news"||p.back.startsWith("/category/"))?p.back:"/";
 let next:NextItem[]=[];try{const parsed=JSON.parse(p.next||"[]");if(Array.isArray(parsed))next=parsed.slice(0,3).flatMap((item:any)=>{const u=safeUrl(String(item?.url||""));const t=text(String(item?.title||""));const s=text(String(item?.source||""));return u&&t?[{url:u,title:t,source:s}]:[]})}catch{}
 const overview="This report from "+source+" focuses on the development identified in the headline. OPEN TAB keeps this page to an independent, high-level introduction rather than recreating the publisher’s lead or article; consult the original report for verified details, evidence, updates and full context.";
 return <main className="wrap max-w-4xl py-8 md:py-12">
  <Link href={back} className="pill inline-flex">← Back</Link>
  <div className="eyebrow mt-8">OPEN TAB READER · EXTERNAL REPORT</div>
  <h1 className="headline mt-4 text-4xl leading-tight md:text-6xl">{title}</h1>
  <div className="muted mt-3 text-xs">{source}{date?" · "+date:""}</div>
  {showImage?<figure className="mt-8"><FeedImage src={image} alt={title}/><figcaption className="muted mt-2 text-xs">Photo: {imageCredit} · {licenseUrl?<a className="underline" href={licenseUrl} target="_blank" rel="noopener noreferrer">Image licence</a>:imageLicense}{imageSource?<> · <a className="underline" href={imageSource} target="_blank" rel="noopener noreferrer">Image source</a></>:null}</figcaption></figure>:null}
  <section className="mt-8 border-l-2 border-[#f04438] pl-5"><div className="eyebrow">THE OPEN TAB OVERVIEW</div><p className="mt-3 text-base leading-7">{overview}</p></section>
  <LocalSaveShare id={url} title={title} kind="story"/>
  <aside className="mt-10 border-y border-neutral-300 py-6"><p className="eyebrow">PUBLISHER CREDIT</p><p className="mt-2 text-sm leading-6">Original reporting by <strong>{source}</strong>. OPEN TAB provides this independent overview; the original publisher retains the full report and its underlying work.</p><a className="btn-red mt-4 inline-flex" href={url} target="_blank" rel="noopener noreferrer">Read the original report ↗</a></aside>
  {next[0]?<Link href={"/reader?"+new URLSearchParams({url:next[0].url,title:next[0].title,source:next[0].source,back}).toString()} className="mt-5 flex min-h-14 items-center justify-between gap-4 border-b border-neutral-300 py-4 group"><span><span className="eyebrow block">Next story</span><strong className="mt-1 block group-hover:text-[#f04438]">{next[0].title}</strong></span><span className="text-xl text-[#f04438]">→</span></Link>:null}
  {next.length>0?<section className="mt-8"><div className="section-rule mb-5"><p className="eyebrow">Keep exploring</p><h2 className="text-2xl font-black">RELATED · NEXT UP</h2></div><div className="grid gap-4 sm:grid-cols-3">{next.map((item,i)=>{const q=new URLSearchParams({url:item.url,title:item.title,source:item.source,back});return <Link key={item.url} href={"/reader?"+q.toString()} className="border-b border-neutral-300 py-3 group"><p className="eyebrow">{item.source||"More to explore"} · 0{i+1}</p><h3 className="mt-2 font-black leading-snug group-hover:text-[#f04438]">{item.title}</h3><span className="mt-3 block text-[10px] font-black uppercase tracking-widest text-[#f04438]">Open story ↗</span></Link>})}</div></section>:null}
 </main>
}
