"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeDollarSign, Building2, Megaphone, Plus, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Advertiser = { id: string; company_name: string; contact_email: string; status: string };
type Campaign = { id: string; name: string; headline: string; placement: string; status: string; budget_cents: number; starts_at: string | null; ends_at: string | null; advertiser: { company_name: string } | null };

const input = "w-full rounded-xl border border-white/10 bg-[#0d0f13] px-3 py-3 text-sm text-white outline-none focus:border-[#f04438]";

export default function MonetizationPage() {
  const [loading,setLoading]=useState(true);
  const [role,setRole]=useState("");
  const [advertisers,setAdvertisers]=useState<Advertiser[]>([]);
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [events,setEvents]=useState({impressions:0,clicks:0});
  const [showForm,setShowForm]=useState(false);
  const [message,setMessage]=useState("");
  const [company,setCompany]=useState("");
  const [contact,setContact]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [advertiserId,setAdvertiserId]=useState("");
  const [name,setName]=useState("");
  const [headline,setHeadline]=useState("");
  const [description,setDescription]=useState("");
  const [creativeUrl,setCreativeUrl]=useState("");
  const [destinationUrl,setDestinationUrl]=useState("");
  const [placement,setPlacement]=useState("homepage_leaderboard");
  const [budget,setBudget]=useState("0");
  const [startsAt,setStartsAt]=useState("");
  const [endsAt,setEndsAt]=useState("");
  const [busy,setBusy]=useState(false);

  const load=useCallback(async()=>{
    if(!supabase){setLoading(false);return}
    const {data:auth}=await supabase.auth.getUser();
    if(!auth.user){setLoading(false);return}
    const {data:profile}=await supabase.from("profiles").select("role").eq("id",auth.user.id).maybeSingle();
    setRole(profile?.role||"");
    if(profile?.role!=="admin"){setLoading(false);return}
    const [a,c,i,k]=await Promise.all([
      supabase.from("advertisers").select("id,company_name,contact_email,status").order("company_name"),
      supabase.from("ad_campaigns").select("id,name,headline,placement,status,budget_cents,starts_at,ends_at,advertiser:advertisers(company_name)").order("created_at",{ascending:false}).limit(100),
      supabase.from("ad_events").select("id",{count:"exact",head:true}).eq("event_type","impression"),
      supabase.from("ad_events").select("id",{count:"exact",head:true}).eq("event_type","click")
    ]);
    if(a.error||c.error){setMessage(a.error?.message||c.error?.message||"Could not load campaign data. Apply the advertising migration first.");}
    setAdvertisers((a.data||[]) as Advertiser[]);
    setCampaigns((c.data||[]) as Campaign[]);
    setEvents({impressions:i.count||0,clicks:k.count||0});
    setLoading(false);
  },[]);

  useEffect(()=>{void load()},[load]);

  async function addAdvertiser(){
    if(!supabase||!company.trim()||!contactEmail.trim())return;
    setBusy(true);
    const {data,error}=await supabase.from("advertisers").insert({company_name:company.trim(),contact_name:contact.trim()||null,contact_email:contactEmail.trim()}).select("id").single();
    setMessage(error?.message||"Advertiser added.");
    if(data){setAdvertiserId(data.id);setCompany("");setContact("");setContactEmail("");await load()}
    setBusy(false);
  }

  async function addCampaign(){
    if(!supabase||!advertiserId||!name.trim()||!headline.trim()||!destinationUrl.trim())return;
    setBusy(true);
    const {data:auth}=await supabase.auth.getUser();
    const {error}=await supabase.from("ad_campaigns").insert({
      advertiser_id:advertiserId,name:name.trim(),headline:headline.trim(),description:description.trim()||null,
      creative_url:creativeUrl.trim()||null,destination_url:destinationUrl.trim(),placement,
      budget_cents:Math.max(0,Math.round(Number(budget||0)*100)),starts_at:startsAt?new Date(startsAt).toISOString():null,
      ends_at:endsAt?new Date(endsAt).toISOString():null,created_by:auth.user?.id||null,status:"draft"
    });
    setMessage(error?.message||"Campaign saved as a draft. An administrator must approve it before delivery.");
    if(!error){setName("");setHeadline("");setDescription("");setCreativeUrl("");setDestinationUrl("");setBudget("0");setStartsAt("");setEndsAt("");setShowForm(false);await load()}
    setBusy(false);
  }

  async function setCampaignStatus(id:string,status:string){
    if(!supabase)return;
    const patch:any={status,updated_at:new Date().toISOString()};
    if(status==="approved"){const {data:auth}=await supabase.auth.getUser();patch.approved_by=auth.user?.id;patch.approved_at=new Date().toISOString()}
    const {error}=await supabase.from("ad_campaigns").update(patch).eq("id",id);
    setMessage(error?.message||"Campaign status updated.");
    await load();
  }

  if(loading)return <main className="grid min-h-screen place-items-center bg-[#0d0f13] text-slate-400">Loading advertising centre…</main>;
  if(!supabase)return <main className="min-h-screen bg-[#0d0f13] p-8 text-white">Supabase is not connected.</main>;
  if(role!=="admin")return <main className="grid min-h-screen place-items-center bg-[#0d0f13] px-5 text-white"><div className="max-w-md rounded-2xl border border-white/10 bg-[#15171c] p-8"><ShieldCheck size={32} className="text-[#f04438]"/><h1 className="mt-4 text-2xl font-bold">Administrator access required</h1><p className="mt-2 text-sm text-slate-400">Advertising contracts, budgets and approvals are restricted to administrators.</p><Link href="/admin/overview" className="mt-5 inline-flex text-sm text-[#ff766d]">Return to Global Admin ↗</Link></div></main>;

  return <main className="min-h-screen bg-[#0d0f13] px-5 py-8 text-slate-100 md:px-9">
    <div className="mx-auto max-w-[1400px]">
      <Link href="/admin/overview" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white"><ArrowLeft size={14}/> Global Admin</Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#f04438]">Business centre / Revenue operations</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Advertising & sponsorships</h1><p className="mt-2 text-sm text-slate-400">Manage advertisers, campaigns, placements and delivery reporting.</p></div><button onClick={()=>setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-xl bg-[#f04438] px-4 py-3 text-xs font-bold"><Plus size={15}/> New campaign</button></div>
      <div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-white/[.07] bg-[#15171c] p-5"><Building2 className="text-[#f04438]"/><p className="mt-4 text-xs text-slate-500">Advertisers</p><strong className="mt-1 block text-3xl">{advertisers.length}</strong></div><div className="rounded-2xl border border-white/[.07] bg-[#15171c] p-5"><Megaphone className="text-[#f04438]"/><p className="mt-4 text-xs text-slate-500">Campaigns</p><strong className="mt-1 block text-3xl">{campaigns.length}</strong></div><div className="rounded-2xl border border-white/[.07] bg-[#15171c] p-5"><BadgeDollarSign className="text-[#f04438]"/><p className="mt-4 text-xs text-slate-500">Impressions / clicks</p><strong className="mt-1 block text-3xl">{events.impressions.toLocaleString()} <span className="text-base text-slate-500">/ {events.clicks.toLocaleString()}</span></strong></div></div>
      {showForm&&<section className="mt-6 grid gap-6 rounded-2xl border border-white/[.08] bg-[#15171c] p-5 lg:grid-cols-2 md:p-7">
        <div><h2 className="text-lg font-semibold">Add advertiser</h2><p className="mt-1 text-xs text-slate-500">Create the business record before creating its campaign.</p><input className={input+" mt-4"} placeholder="Company name" value={company} onChange={e=>setCompany(e.target.value)}/><input className={input+" mt-3"} placeholder="Contact name" value={contact} onChange={e=>setContact(e.target.value)}/><input className={input+" mt-3"} type="email" placeholder="Contact email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)}/><button disabled={busy||!company.trim()||!contactEmail.trim()} onClick={addAdvertiser} className="mt-3 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold disabled:opacity-40">Save advertiser</button></div>
        <div><h2 className="text-lg font-semibold">Create campaign</h2><p className="mt-1 text-xs text-slate-500">New campaigns start as drafts and are not shown publicly until approved and active.</p><select className={input+" mt-4"} value={advertiserId} onChange={e=>setAdvertiserId(e.target.value)}><option value="">Choose advertiser</option>{advertisers.map(a=><option key={a.id} value={a.id}>{a.company_name}</option>)}</select><input className={input+" mt-3"} placeholder="Internal campaign name" value={name} onChange={e=>setName(e.target.value)}/><input className={input+" mt-3"} placeholder="Public headline" value={headline} onChange={e=>setHeadline(e.target.value)}/><textarea className={input+" mt-3"} rows={2} placeholder="Short description" value={description} onChange={e=>setDescription(e.target.value)}/><input className={input+" mt-3"} placeholder="Creative image URL (optional)" value={creativeUrl} onChange={e=>setCreativeUrl(e.target.value)}/><input className={input+" mt-3"} placeholder="Destination URL" value={destinationUrl} onChange={e=>setDestinationUrl(e.target.value)}/><select className={input+" mt-3"} value={placement} onChange={e=>setPlacement(e.target.value)}><option value="homepage_leaderboard">Homepage leaderboard</option><option value="homepage_feature">Homepage feature</option><option value="article_inline">Article inline</option><option value="sidebar">Sidebar</option><option value="video_sponsorship">Video sponsorship</option><option value="newsletter">Newsletter</option></select><input className={input+" mt-3"} type="number" min="0" step="0.01" placeholder="Budget (KES)" value={budget} onChange={e=>setBudget(e.target.value)}/><div className="mt-3 grid grid-cols-2 gap-3"><input className={input} type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}/><input className={input} type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></div><button disabled={busy||!advertiserId||!name.trim()||!headline.trim()||!destinationUrl.trim()} onClick={addCampaign} className="mt-4 rounded-xl bg-[#f04438] px-4 py-3 text-xs font-bold disabled:opacity-40">Save campaign draft</button></div>
      </section>}
      {message&&<p role="status" className="mt-5 rounded-xl border border-white/10 bg-[#15171c] p-3 text-sm text-slate-300">{message}</p>}
      <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.07] bg-[#15171c]"><div className="border-b border-white/[.07] p-5"><h2 className="font-semibold">Campaign manager</h2><p className="mt-1 text-xs text-slate-500">Review and control every paid placement.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-white/[.07] text-[10px] uppercase tracking-wider text-slate-500"><th className="p-4">Campaign</th><th className="p-4">Placement</th><th className="p-4">Budget</th><th className="p-4">Dates</th><th className="p-4">Status</th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id} className="border-b border-white/[.05] last:border-0"><td className="p-4"><p className="text-sm font-semibold">{c.name}</p><p className="mt-1 text-[10px] text-slate-500">{c.advertiser?.company_name||"Advertiser"}</p></td><td className="p-4 text-xs text-slate-400">{c.placement.replaceAll("_"," ")}</td><td className="p-4 text-xs">KES {(c.budget_cents/100).toLocaleString()}</td><td className="p-4 text-xs text-slate-500">{c.starts_at?new Date(c.starts_at).toLocaleDateString():"Open"} – {c.ends_at?new Date(c.ends_at).toLocaleDateString():"No end"}</td><td className="p-4"><select aria-label={"Campaign status for "+c.name} className="rounded-lg border border-white/10 bg-[#0d0f13] px-2 py-2 text-xs" value={c.status} onChange={e=>setCampaignStatus(c.id,e.target.value)}>{["draft","pending_review","approved","active","paused","completed","rejected"].map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></td></tr>)}{!campaigns.length&&<tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No campaigns yet. Add an advertiser and create your first campaign.</td></tr>}</tbody></table></div></section>
      <p className="mt-6 text-[10px] leading-5 text-slate-600">Campaigns are not activated automatically. An administrator controls approval and delivery. Payment collection, invoicing and advertiser self-service are separate integrations and are not enabled by this module.</p>
    </div>
  </main>;
}
