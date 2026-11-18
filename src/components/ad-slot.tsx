"use client";

import { useEffect } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type AdCreative = {
  id: string;
  headline: string;
  description: string | null;
  creative_url: string | null;
  destination_url: string;
  placement: string;
};

export function AdSlot({ ad }: { ad: AdCreative }) {
  useEffect(() => {
    if (!supabase) return;
    void supabase.from("ad_events").insert({ campaign_id: ad.id, event_type: "impression" });
  }, [ad.id]);

  function trackClick() {
    if (supabase) void supabase.from("ad_events").insert({ campaign_id: ad.id, event_type: "click" });
  }

  return <aside aria-label="Sponsored content" className="wrap my-5">
    <a href={ad.destination_url} target="_blank" rel="sponsored noopener noreferrer" onClick={trackClick} className="group grid overflow-hidden rounded-2xl border border-neutral-300 bg-white transition hover:border-[#f04438] md:grid-cols-[minmax(0,1fr)_240px]">
      <div className="flex flex-col justify-center p-5 md:p-7">
        <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f04438]"><Megaphone size={13}/> Sponsored</span>
        <h2 className="mt-3 text-xl font-black tracking-tight md:text-2xl">{ad.headline}</h2>
        {ad.description&&<p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{ad.description}</p>}
        <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">Learn more <ExternalLink size={13}/></span>
      </div>
      {ad.creative_url?<div className="min-h-[150px] bg-neutral-100"><img src={ad.creative_url} alt="" className="h-full w-full object-cover"/></div>:<div className="hidden items-center justify-center bg-[#101010] text-5xl font-black text-white md:flex">OPEN<span className="text-[#f04438]">TAB.</span></div>}
    </a>
  </aside>;
}
