import type {Metadata} from "next";
export const revalidate = 300;
export const metadata:Metadata = {
  title:"Latest World News",
  description:"The latest international headlines from trusted newsrooms around the world, with links to original reporting."
};
type FeedSource={name:string;url:string;region:string};
type NewsItem={title:string;url:string;description:string;date:string;source:string;region:string;image:string|null};
const SOURCES:FeedSource[]=[
  {name:"BBC News",url:"https://feeds.bbci.co.uk/news/world/rss.xml",region:"United Kingdom · Global"},
  {name:"NPR",url:"https://feeds.npr.org/1004/rss.xml",region:"United States · World"},
  {name:"Al Jazeera",url:"https://www.aljazeera.com/xml/rss/all.xml",region:"Qatar · Global"},
  {name:"DW",url:"https://rss.dw.com/rdf/rss-en-world",region:"Germany · World"},
  {name:"France 24",url:"https://www.france24.com/en/rss",region:"France · Global"},
  {name:"The Guardian",url:"https://www.theguardian.com/world/rss",region:"United Kingdom · World"},
  {name:"Africanews",url:"https://www.africanews.com/feed/rss",region:"Pan-African · Africa"},
  {name:"BBC Africa",url:"https://feeds.bbci.co.uk/news/world/africa/rss.xml",region:"United Kingdom · Africa"},
  {name:"France 24 Africa",url:"https://www.france24.com/en/africa/rss",region:"France · Africa"},
  {name:"The Africa Report",url:"https://www.theafricareport.com/feed/",region:"Pan-African · Africa"},
  {name:"AllAfrica",url:"https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf",region:"Pan-African · Africa"},
  {name:"Daily Nation",url:"https://nation.africa/kenya/rss.xml",region:"Kenya · East Africa"},
  {name:"The EastAfrican",url:"https://www.theeastafrican.co.ke/tea/rss",region:"East Africa"},
  {name:"Premium Times",url:"https://www.premiumtimesng.com/feed",region:"Nigeria · West Africa"},
  {name:"Vanguard Nigeria",url:"https://www.vanguardngr.com/feed/",region:"Nigeria · West Africa"},
  {name:"Channels Television",url:"https://www.channelstv.com/feed/",region:"Nigeria · West Africa"},
  {name:"MyJoyOnline",url:"https://www.myjoyonline.com/feed/",region:"Ghana · West Africa"},
  {name:"News24",url:"https://feeds.news24.com/articles/news24/TopStories/rss",region:"South Africa · Southern Africa"},
  {name:"Daily Maverick",url:"https://www.dailymaverick.co.za/feed/",region:"South Africa · Southern Africa"},
  {name:"The New Times",url:"https://www.newtimes.co.rw/rss",region:"Rwanda · East Africa"},
  {name:"The Reporter Ethiopia",url:"https://www.thereporterethiopia.com/feed/",region:"Ethiopia · Horn of Africa"},
  {name:"Radio Okapi",url:"https://www.radiookapi.net/rss.xml",region:"DR Congo · Central Africa"},
  {name:"Sudan Tribune",url:"https://sudantribune.com/spip.php?page=backend",region:"Sudan · Northeast Africa"}
];
function decode(value:string){return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();}
function clean(value:string){return decode(value.replace(/<[^>]*>/g," ").replace(/\s+/g," "));}
function tag(block:string,name:string){const escaped=name.replace(":","\\:");const match=block.match(new RegExp("<"+escaped+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+escaped+">","i"));return match?.[1]?clean(match[1]):"";}
function linkOf(block:string){const atom=block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?\s*>/i);if(atom?.[1])return decode(atom[1]);const link=tag(block,"link");return link||tag(block,"guid");}
function imageOf(block:string){const match=block.match(/<(?:media:thumbnail|media:content|enclosure)[^>]+(?:url|href)=["']([^"']+)["']/i)||block.match(/<img[^>]+src=["']([^"']+)["']/i);return match?.[1]?decode(match[1]):null;}
async function readFeed(source:FeedSource):Promise<NewsItem[]>{
  try{
    const response=await fetch(source.url,{headers:{"user-agent":"OPEN TAB Newsroom/1.0 (+https://opentab-media.netlify.app)"},signal:AbortSignal.timeout(9000),next:{revalidate:300}});
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
function timeLabel(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?"Latest":new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(date)+" UTC";}
export default async function NewsPage(){
  const results=await Promise.all(SOURCES.map(readFeed));
  const seen=new Set<string>();
  const items=results.flat().filter(item=>{const key=item.url.split("?")[0];if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,60);
  return <main className="wrap min-h-[60vh] py-10 md:py-14">
    <div className="eyebrow">OPEN TAB · WORLD DESK · LIVE RSS ROUNDUP</div>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="headline text-6xl md:text-8xl">WORLD NEWS<span className="accent">.</span></h1><p className="muted mt-4 max-w-2xl text-sm leading-7">The latest headlines from trusted newsrooms across Africa and the world. Follow reporting from East, West, Central, North and Southern Africa alongside major international stories.</p></div><span className="border border-neutral-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest">{items.length} headlines · auto-refreshes</span></div>
    <div className="mt-8 flex flex-wrap gap-2">{SOURCES.map(s=><span key={s.name} className="pill">{s.name}</span>)}</div>
    <div className="section-rule mt-10 mb-6 flex items-center justify-between"><h2 className="text-2xl font-black">LATEST INTERNATIONAL HEADLINES</h2><span className="muted text-[10px] uppercase tracking-widest">Updated every 5 minutes</span></div>
    {items.length?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map((item,i)=><article key={item.url} className="overflow-hidden border border-neutral-300">
      {item.image?<a href={item.url} target="_blank" rel="noopener noreferrer" className="story-image block aspect-video"><img src={item.image} alt="" loading="lazy"/></a>:<div className="flex aspect-video items-center justify-center bg-[#171717] text-5xl font-black text-white">OT<span className="accent">.</span></div>}
      <div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="eyebrow">{item.source}</span><span className="muted text-[9px]">{timeLabel(item.date)}</span></div><h2 className="mt-3 text-xl font-black leading-tight">{item.title}</h2>{item.description&&<p className="muted mt-3 text-sm leading-6">{item.description}</p>}<p className="muted mt-4 text-[9px] font-bold uppercase tracking-widest">{item.region}</p><a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex text-[10px] font-black uppercase tracking-widest text-[#f04438]">Read original report ↗</a></div>
    </article>)}</div>:<div className="border border-dashed border-neutral-400 p-10 text-center"><h2 className="font-black">Live feeds are temporarily unavailable</h2><p className="muted mt-2 text-sm">Please try again shortly. OPEN TAB links readers to each publisher's original reporting.</p></div>}
    <p className="muted mt-10 border-t border-neutral-300 pt-5 text-xs leading-6">Headlines, short feed excerpts and images are supplied by the respective publishers' public RSS feeds. All reporting remains the property of its original publisher. OPEN TAB does not reproduce full articles; select a headline to read the complete report at its source.</p>
  </main>;
}
