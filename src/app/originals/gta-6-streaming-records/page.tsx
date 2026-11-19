import type {Metadata} from "next";
import Link from "next/link";
import {FeedImage} from "@/components/feed-image";

export const revalidate=600;
const title="GTA 6 Turns Launch Day Into a Global Livestreaming Record";
const description="Grand Theft Auto VI has drawn a preliminary peak of more than 7.9 million simultaneous livestream viewers. OPEN TAB examines what the record says about gaming, creators and global audiences.";
const image="https://cdnr.escharts.com/uploads/public/6af/dc6/310/6afdc6310d1aa211792854.jpg";
const imageSource="https://streamscharts.com/news/gta-6-streaming-records";

export const metadata:Metadata={
 title,
 description,
 alternates:{canonical:"https://opentab-media.netlify.app/originals/gta-6-streaming-records"},
 openGraph:{type:"article",title,description,images:[image]},
};

export default function GtaSixOriginal(){
 return <main className="wrap max-w-4xl py-10 md:py-14">
  <div className="eyebrow">GAMING · GLOBAL CULTURE · OPEN TAB ORIGINAL</div>
  <h1 className="headline mt-5 text-4xl leading-[1.02] md:text-7xl">{title}</h1>
  <p className="muted mt-6 max-w-3xl text-lg leading-8 md:text-xl">{description}</p>
  <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
   <span className="font-bold text-[#f04438]">By Mickey Me</span><span>·</span><time dateTime="2026-11-19">19 November 2026</time><span>·</span><span>A Mickoryn Media Publication</span>
  </div>
  <figure className="mt-8">
   <FeedImage src={image} alt="Grand Theft Auto VI livestreaming record graphic featuring Vice City artwork"/>
   <figcaption className="muted -mt-1 text-[11px]">Supporting image: Streams Charts. <a className="underline" href={imageSource} target="_blank" rel="noopener noreferrer">Image and streaming-data source ↗</a></figcaption>
  </figure>
  <div className="article-content mt-9 max-w-none">
   <p>Grand Theft Auto VI has opened its release with an extraordinary audience well beyond the people holding a controller. Preliminary tracking from Streams Charts puts the game’s combined livestream peak at approximately 7.91 million people watching at the same time across Twitch, YouTube, Kick and additional streaming services. The tracker also recorded a peak of roughly 3.31 million viewers on Twitch, making GTA VI the most-watched individual game category in that platform’s history. These are third-party measurements and remain subject to revision; they are not official audience figures published by Rockstar Games.</p>
   <p>The scale becomes clearer when set beside earlier launches. Streams Charts lists the previous game-launch livestream benchmark as the 2020 closed beta for VALORANT, which reached about 1.74 million concurrent viewers. GTA VI’s early peak is more than four times that level. Its launch has also produced major platform-specific milestones: the tracker reports nearly 1.5 million concurrent viewers on Kick and a new high for the number of channels broadcasting one game simultaneously. The staggered regional release helped the audience build across time zones instead of arriving in one single moment.</p>
   <p>This is about more than a highly anticipated game attracting fans. Livestreaming has become a global entertainment event in its own right, where a release can bring together players, creators, commentators and viewers who may not yet own the title. A simultaneous-viewer peak measures how many people were watching at one moment; it does not tell us how many copies were sold, how many people played, or how many unique viewers tuned in over the full launch period. Keeping those measures separate is important when judging the commercial and cultural impact.</p>
   <p>For Rockstar, the next test is whether the attention translates into sustained conversation after the opening rush. Players will be watching performance and stability across PlayStation 5 and Xbox Series X|S, while creators will be looking for discoveries, memorable missions and moments that keep audiences returning. The final streaming totals may also move as analytics services complete their checks. Official sales updates, longer-term player engagement and any announcements about the game’s online future will provide a fuller picture than launch-day viewership alone.</p>
   <p>One thing is already clear: GTA VI’s arrival has become a major live-media moment, not simply a release-day event. Its opening audience shows how gaming launches now compete for attention across platforms and borders at a scale once associated with the biggest global broadcasts.</p>
  </div>
  <aside className="mt-10 border-y border-neutral-300 py-5">
   <div className="eyebrow">REPORTING & SOURCE NOTES</div>
   <p className="mt-3 text-sm leading-7">This is an original Mickoryn Media article written for OPEN TAB. Streaming figures are attributed to Streams Charts’ preliminary tracking and may change as its data is finalized. Rockstar Games confirms the worldwide release of Grand Theft Auto VI for PlayStation 5 and Xbox Series X|S.</p>
   <ul className="mt-3 space-y-2 text-sm">
    <li><a className="accent underline" href={imageSource} target="_blank" rel="noopener noreferrer">Streams Charts — GTA 6 launch records and platform statistics ↗</a></li>
    <li><a className="accent underline" href="https://www.rockstargames.com/newswire/article/39akk424a9oo53/grand-theft-auto-vi-now-available" target="_blank" rel="noopener noreferrer">Rockstar Games — Grand Theft Auto VI now available ↗</a></li>
   </ul>
   <p className="mt-5 text-xs font-bold uppercase tracking-wider">Mickey Me · A Mickoryn Media Publication · Published on OPEN TAB</p>
  </aside>
  <div className="mt-8 flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest"><Link href="/" className="text-[#f04438]">Back to OPEN TAB ↗</Link><Link href="/category/gaming" className="underline">More gaming stories ↗</Link></div>
 </main>;
}
