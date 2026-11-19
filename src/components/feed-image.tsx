"use client";
import {useState} from "react";
export function FeedImage({src,alt,video=false}:{src:string|null;alt:string;video?:boolean}){const[failed,setFailed]=useState(false);if(!src||failed)return null;return <div className={"story-image mb-4 block "+(video?"aspect-video":"aspect-[16/10]")+" overflow-hidden"}><img src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)} className="h-full w-full object-cover"/></div>}
