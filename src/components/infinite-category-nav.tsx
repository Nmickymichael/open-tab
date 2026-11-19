"use client";

import Link from "next/link";
import {useEffect,useRef} from "react";

type NavItem={label:string;href:string};

export function InfiniteCategoryNav({items}:{items:NavItem[]}){
  const rail=useRef<HTMLDivElement>(null);
  const group=useRef<HTMLDivElement>(null);
  const resetting=useRef(false);
  useEffect(()=>{
    const el=rail.current;
    const first=group.current;
    if(!el||!first||items.length<2)return;
    const width=first.getBoundingClientRect().width;
    if(width>0)el.scrollLeft=width;
    const onScroll=()=>{
      if(resetting.current)return;
      const segment=first.getBoundingClientRect().width;
      if(!segment)return;
      if(el.scrollLeft<segment*.45){
        resetting.current=true;
        el.scrollLeft+=segment;
        requestAnimationFrame(()=>{resetting.current=false});
      }else if(el.scrollLeft>segment*1.55){
        resetting.current=true;
        el.scrollLeft-=segment;
        requestAnimationFrame(()=>{resetting.current=false});
      }
    };
    el.addEventListener("scroll",onScroll,{passive:true});
    return()=>el.removeEventListener("scroll",onScroll);
  },[items.length]);
  const copy=(key:string,hidden:boolean)=><div key={key} ref={hidden?undefined:group} className="nav-loop-group" aria-hidden={hidden||undefined}>{items.map(({label,href},i)=><Link key={key+"-"+href+"-"+i} href={href} tabIndex={hidden?-1:undefined}>{label}</Link>)}</div>;
  return <nav ref={rail} className="nav nav-infinite" aria-label="Browse OPEN TAB categories">
    {copy("before",true)}
    {copy("main",false)}
    {copy("after",true)}
  </nav>;
}
