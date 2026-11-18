import Link from "next/link";
import {supabase} from "@/lib/supabase";

export const revalidate=60;

type Creator={id:string;name:string;slug:string;bio:string|null;avatar_url:string|null;channel_url?:string|null};

export const metadata={title:"Creators",description:"Meet the voices, storytellers and communities featured by OPEN TAB."};

export default async function CreatorsPage(){
  let creators:Creator[]=[];
  if(supabase){
    const {data}=await supabase.from("creators").select("id,name,slug,bio,avatar_url,channel_url").order("name",{ascending:true}).limit(100);
    creators=data??[];
  }

  return <main className="wrap min-h-[55vh] py-12 md:py-16">
    <div className="eyebrow">People shaping the conversation</div>
    <h1 className="headline mt-4 text-6xl md:text-8xl">MEET THE CREATORS<span className="accent">.</span></h1>
    <p className="muted mt-5 max-w-2xl text-sm leading-7 md:text-base">Discover the voices, independent storytellers and creative communities bringing fresh perspectives to the stories that matter.</p>
    {creators.length>0?<div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{creators.map(creator=><Link key={creator.id} href={"/creators/"+creator.slug} className="group border border-neutral-300 p-4 transition hover:border-[#f04438]"><div className="story-image mb-4 aspect-square bg-[#171717]">{creator.avatar_url?<img src={creator.avatar_url} alt={creator.name}/>:<div className="grid h-full place-items-center text-5xl font-black text-[#f04438]">{creator.name.charAt(0)}</div>}</div><h2 className="font-black group-hover:text-[#f04438]">{creator.name}</h2>{creator.bio&&<p className="muted mt-2 line-clamp-3 text-xs leading-5">{creator.bio}</p>}<span className="mt-4 block text-right text-xs font-bold uppercase tracking-wider">View profile ↗</span></Link>)}</div>:<div className="mt-12 border-y border-neutral-300 py-10"><h2 className="font-black text-2xl">The creator directory is getting ready.</h2><p className="muted mt-3 max-w-xl text-sm leading-7">{supabase?"Creator profiles will appear here as the editorial team publishes them.":"Creator profiles will appear here once the OPEN TAB database is connected."}</p><Link href="/about" className="btn-red mt-6">Discover OPEN TAB ↗</Link></div>}
  </main>;
}
