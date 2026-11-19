"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
type SavedItem={id:string;title:string;url:string;kind:"story"|"video";savedAt:string};
const KEY="open-tab-saved-items";
export function LocalSaveShare({id,title,kind}:{id:string;title:string;kind:"story"|"video"}){
 const [saved,setSaved]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{try{const rows:SavedItem[]=JSON.parse(localStorage.getItem(KEY)||"[]");setSaved(rows.some(x=>x.id===id&&x.kind===kind))}catch{setSaved(false)}},[id,kind]);
 function toggle(){try{const rows:SavedItem[]=JSON.parse(localStorage.getItem(KEY)||"[]");const exists=rows.some(x=>x.id===id&&x.kind===kind);const next=exists?rows.filter(x=>!(x.id===id&&x.kind===kind)):[{id,title,url:window.location.href,kind,savedAt:new Date().toISOString()},...rows];localStorage.setItem(KEY,JSON.stringify(next));setSaved(!exists);setMessage(exists?"Removed from saved items.":"Saved on this device.")}catch{setMessage("Could not save this item on this device.")}}
 async function share(){const url=window.location.href;try{if(navigator.share)await navigator.share({title,url});else{await navigator.clipboard.writeText(url);setMessage("Link copied.")}}catch{setMessage("Sharing was cancelled.")}}
 return <div className="reader-actions mt-5"><button type="button" className="pill" onClick={toggle}>{saved?"✓ Saved":"＋ Save"}</button><button type="button" className="pill" onClick={share}>↗ Share link</button>{message&&<span className="muted text-xs" role="status">{message}</span>}<Link href="/saved" className="text-xs font-bold underline">Saved items</Link></div>
}
