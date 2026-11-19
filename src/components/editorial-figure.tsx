"use client";

import {FeedImage} from "@/components/feed-image";

export function EditorialFigure({src,alt,caption,credit,sourceUrl,sourceLabel}:{src:string|null;alt:string;caption:string;credit?:string|null;sourceUrl?:string|null;sourceLabel?:string|null}){
 return <figure className="editorial-figure">
  <FeedImage src={src} alt={alt}/>
  <figcaption className="muted text-xs leading-5">{caption}{credit?" Photo/graphic: "+credit:""}{sourceUrl?<><span> · </span><a className="underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel||"View source"} ↗</a></>:null}</figcaption>
 </figure>;
}
