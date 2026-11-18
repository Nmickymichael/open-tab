"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Draft = { headline: string; dek: string; excerpt: string; suggested_slug: string; article_markdown: string; key_claims_to_verify: string[]; suggested_sources: string[]; social_caption: string };
const field = "w-full border border-neutral-700 bg-[#171717] px-4 py-3 text-sm text-white outline-none focus:border-[#f04438]";
const label = "mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-neutral-400";

export default function AINewsroomPage() {
  const [topic,setTopic]=useState("");
  const [angle,setAngle]=useState("");
  const [format,setFormat]=useState("news analysis");
  const [audience,setAudience]=useState("International general audience");
  const [notes,setNotes]=useState("");
  const [draft,setDraft]=useState<Draft|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState("");

  async function generate() {
    setBusy(true);setError("");setDraft(null);
    try {
      if(!supabase) throw new Error("Supabase is not configured.");
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token) throw new Error("Please sign in to the editorial desk first.");
      const response=await fetch("/api/ai-newsroom",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({topic,angle,format,audience,notes})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Draft generation failed.");
      setDraft(result.draft);
    } catch(e) { setError(e instanceof Error?e.message:"Something went wrong."); }
    finally { setBusy(false); }
  }

  async function copy(text:string,labelText:string) {
    try { await navigator.clipboard.writeText(text);setCopied(labelText);setTimeout(()=>setCopied(""),1800); }
    catch { setError("Clipboard access was blocked by your browser. Select and copy the text manually."); }
  }

  return <main className="min-h-screen bg-[#0c0c0c] text-white">
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f04438]">OPEN TAB · Editorial intelligence</p><h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">AI NEWSROOM<span className="text-[#f04438]">.</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">Turn a reporting brief into a structured first draft. Your editors stay in control of facts, sources and publication.</p></div>
        <a href="/admin" className="border border-neutral-700 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:border-[#f04438]">← Editorial desk</a>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
        <section className="h-fit border border-neutral-800 bg-[#121212] p-5 md:p-7">
          <div className="mb-6 flex items-center justify-between"><h2 className="font-black">CREATE A BRIEF</h2><span className="text-[9px] font-bold uppercase tracking-widest text-[#f04438]">AI ASSIST</span></div>
          <label className={label}>Story topic *</label><textarea className={field+" min-h-28"} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="What is the story about? Be specific." maxLength={500}/>
          <label className={label+" mt-5"}>Editorial angle</label><input className={field} value={angle} onChange={e=>setAngle(e.target.value)} placeholder="What should readers understand?"/>
          <label className={label+" mt-5"}>Draft format</label><select className={field} value={format} onChange={e=>setFormat(e.target.value)}><option>news analysis</option><option>breaking news brief</option><option>feature story</option><option>explainer</option><option>interview questions</option><option>opinion draft</option><option>video script</option></select>
          <label className={label+" mt-5"}>Audience</label><input className={field} value={audience} onChange={e=>setAudience(e.target.value)}/>
          <label className={label+" mt-5"}>Reporting notes / verified facts</label><textarea className={field+" min-h-24"} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Paste your notes, confirmed details or interview context."/>
          {error&&<p role="alert" className="mt-4 border border-red-900 bg-red-950/40 p-3 text-xs text-red-200">{error}</p>}
          <button onClick={generate} disabled={busy||!topic.trim()} className="mt-6 w-full bg-[#f04438] px-5 py-4 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50">{busy?"Building your first draft…":"Generate newsroom draft ↗"}</button>
          <p className="mt-4 text-[10px] leading-5 text-neutral-500">AI output is unverified working material. It is not published automatically. Editors must verify every claim, quote, image and source.</p>
        </section>
        <section className="min-w-0">
          {!draft?<div className="flex min-h-[460px] flex-col items-center justify-center border border-dashed border-neutral-800 p-8 text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-neutral-700 text-2xl text-[#f04438]">✳</div><h2 className="text-xl font-black">YOUR EDITORIAL WORKSPACE</h2><p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">Your headline options, story draft, verification checklist and publishing copy will appear here.</p></div>:
          <div className="space-y-5">
            <div className="border border-neutral-800 bg-[#121212] p-5 md:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-widest text-[#f04438]">Generated · Needs editorial review</span><button onClick={()=>copy([draft.headline,draft.dek,draft.excerpt,draft.article_markdown].join("\n\n"),"Full draft")} className="border border-neutral-700 px-3 py-2 text-[9px] font-black uppercase tracking-widest">{copied==="Full draft"?"Copied ✓":"Copy full draft"}</button></div><h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl">{draft.headline}</h2><p className="mt-3 text-lg text-neutral-300">{draft.dek}</p><p className="mt-4 text-sm leading-6 text-neutral-400">{draft.excerpt}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>copy(draft.headline,"Headline")} className="pill">Copy headline</button><button onClick={()=>copy(draft.social_caption,"Social caption")} className="pill">Copy social caption</button><button onClick={()=>copy(draft.article_markdown,"Article")} className="pill">Copy article</button></div></div>
            <div className="border border-neutral-800 bg-[#121212] p-5 md:p-7"><div className="mb-4 flex items-center justify-between"><h3 className="font-black">FIRST DRAFT</h3><span className="text-[9px] uppercase tracking-widest text-neutral-500">Markdown</span></div><pre className="max-h-[680px] overflow-auto whitespace-pre-wrap font-sans text-sm leading-7 text-neutral-300">{draft.article_markdown}</pre></div>
            <div className="grid gap-5 md:grid-cols-2"><div className="border border-amber-900/60 bg-amber-950/20 p-5"><h3 className="text-xs font-black uppercase tracking-widest text-amber-300">Verify before publishing</h3><ul className="mt-4 space-y-3 text-sm text-neutral-300">{(draft.key_claims_to_verify||[]).map((item,i)=><li key={i}>□ {item}</li>)}</ul></div><div className="border border-neutral-800 bg-[#121212] p-5"><h3 className="text-xs font-black uppercase tracking-widest text-neutral-300">Suggested research</h3><ul className="mt-4 space-y-3 text-sm text-neutral-400">{(draft.suggested_sources||[]).map((item,i)=><li key={i}>↗ {item}</li>)}</ul></div></div>
            <div className="border border-neutral-800 bg-[#121212] p-5"><h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Social caption</h3><p className="mt-3 text-sm leading-6 text-neutral-300">{draft.social_caption}</p><p className="mt-4 text-[10px] text-neutral-600">Suggested slug: {draft.suggested_slug}</p></div>
          </div>}
        </section>
      </div>
    </div>
  </main>;
}
