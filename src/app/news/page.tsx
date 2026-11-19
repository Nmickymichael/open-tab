import type {Metadata} from "next";
import {NewsroomBrowser} from "@/components/newsroom-browser";
import {FeedFreshness} from "@/components/feed-freshness";
import {GLOBAL_NEWS_SOURCES} from "@/lib/global-news-sources";
import {getLiveCategoryStories} from "@/lib/category-feeds";
export const revalidate=600;
export const metadata:Metadata={title:"Latest World News",description:"International headlines discovered across newsrooms around the world, with links to original reporting."};
export default async function NewsPage(){
 const discovered=await getLiveCategoryStories("news");
 const items=discovered.map(item=>({...item,region:item.sourceRegion||"International",corroboratingSources:item.corroboratingSources||[item.source]}));
 return <main className="wrap min-h-[60vh] py-10 md:py-14">
  <div className="eyebrow">OPEN TAB · WORLD DESK · INTERNATIONAL DISCOVERY</div>
  <div className="mt-4 flex flex-wrap items-end justify-between gap-4"><div><h1 className="headline text-6xl md:text-8xl">WORLD NEWS<span className="accent">.</span></h1><p className="muted mt-4 max-w-2xl text-sm leading-7">Headlines discovered across Africa, Europe, Asia-Pacific, South Asia, the Middle East, North America and Latin America. Follow the original newsroom for full reporting.</p></div><span className="border border-neutral-400 px-3 py-2 text-[10px] font-black uppercase tracking-widest">{items.length} headlines · refreshes every 10 minutes</span></div>
  <div className="section-rule mt-8 mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-col items-start gap-1"><FeedFreshness label="World news"/><span className="muted text-[9px] uppercase tracking-widest">Cached discovery: 10 minutes · RSS + GDELT · optional NewsData.io</span></div><span className="muted text-[10px] font-black uppercase tracking-widest">Select a newsroom to filter headlines</span></div>
  <NewsroomBrowser items={items} sources={GLOBAL_NEWS_SOURCES}/>
  <p className="muted mt-10 border-t border-neutral-300 pt-5 text-xs leading-6">OPEN TAB presents discovery leads and headline metadata, not republished publisher articles. Similar headlines may be grouped with publisher names shown as corroborating coverage; this is a research signal, not proof that a claim is verified. Editors must check original reporting, dates, primary evidence and independent confirmation before publication. Images are illustrative or supplied by publishers; usage rights must be confirmed before reuse.</p>
 </main>;
}
