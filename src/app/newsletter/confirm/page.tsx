"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "@/lib/supabase";
function ConfirmInner(){const params=useSearchParams();const[message,setMessage]=useState("Confirming your subscription…");useEffect(()=>{let active=true;async function run(){const token=params.get("token");if(!token||!supabase){setMessage("This confirmation link is invalid.");return}const{error}=await supabase.functions.invoke("newsletter-confirm",{body:{token}});if(active)setMessage(error?"We could not confirm this link. It may have expired or already been used.":"You're subscribed! Welcome to OPEN TAB.");}run();return()=>{active=false}},[params]);return <main className="wrap min-h-[60vh] py-20"><div className="eyebrow">OPEN TAB newsletter</div><h1 className="headline mt-4 text-5xl">YOUR INBOX, OPENED.</h1><p className="muted mt-5" role="status">{message}</p><a className="btn-red mt-7" href="/">Back to OPEN TAB ↗</a></main>}
import {Suspense} from "react";
export default function ConfirmPage(){return <Suspense fallback={<main className="wrap py-20">Loading confirmation…</main>}><ConfirmInner/></Suspense>}