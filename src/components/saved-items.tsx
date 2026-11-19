"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
type SavedItem={id:string;title:string;url:string;kind:"story"|"video";savedAt:string};
const KEY="open-tab-saved-items";
export function SavedItems(){const [items,setItems]=useState<SavedItem[]>([]);
 useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem(KEY)||"[]"))}catch{setItems([])}},[]);
 function remove(id:string,kind:string){const next=items.filter(x=>!(x.id===id&&x.kind===kind));setItems(next);localStorage.setItem(KEY,JSON.stringify(next))}
 return <div>{items.length?<div className="grid gap-4 sm:grid-cols-2">{items.map(item=>{let href="/";try{const u=new URL(item.url,window.location.origin);if(u.origin===window.location.origin)href=u.pathname+u.search}catch{}return <article key={item.kind+item.id} className="border-b border-neutral-300 py-5"><p className="eyebrow">{item.kind==="video"?"VIDEO":"STORY"} · SAVED ON THIS DEVICE</p><Link href={href} className="mt-2 block text-xl font-black hover:text-[#f04438]">{item.title}</Link><div className="mt-3 flex items-center gap-4"><span className="muted text-xs">{new Date(item.savedAt).toLocaleDateString()}</span><button className="text-xs underline" onClick={()=>remove(item.id,item.kind)}>Remove</button></div></article>})}</div>:<div className="border border-dashed border-neutral-300 p-8"><p className="font-black">Nothing saved yet.</p><p className="muted mt-2 text-sm">Use Save on any OPEN TAB story or video to keep it here on this device.</p><Link href="/" className="mt-4 inline-block text-sm font-bold text-[#f04438]">Explore OPEN TAB ↗</Link></div>}</div>
}
