"use client";
import {useState} from "react";
export function FeedImage({src,alt}:{src:string|null;alt:string}){const[failed,setFailed]=useState(false);if(!src||failed)return null;return <div className="story-image mb-4 block aspect-[16/10] overflow-hidden"><img src={src} alt={alt} loading="lazy" onError={()=>setFailed(true)} className="h-full w-full object-cover"/></div>}
