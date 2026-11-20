import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const regions=[
 {region:"Africa",q:'("Africa" OR Kenya OR Nigeria OR "South Africa" OR Ethiopia OR Ghana OR Tanzania OR Rwanda)'},
 {region:"Asia-Pacific",q:'("Asia" OR India OR China OR Japan OR Indonesia OR Pakistan OR Philippines OR Australia)'},
 {region:"Europe",q:'(Europe OR "European Union" OR UK OR Germany OR France OR Ukraine OR Italy)'},
 {region:"Americas",q:'("United States" OR Canada OR Brazil OR Mexico OR Argentina OR Colombia)'},
 {region:"Middle East",q:'("Middle East" OR Israel OR Palestine OR Iran OR Saudi Arabia OR UAE OR Lebanon)'}
];
function nairobiDay(){const p=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Nairobi",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());const v=(k:string)=>p.find(x=>x.type===k)?.value??"";return v("year")+"-"+v("month")+"-"+v("day")}
async function discover(url:string,key:string){
 const day=nairobiDay();
 const batches=await Promise.all(regions.map(async r=>{
  const u=new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  u.search=new URLSearchParams({query:r.q,mode:"ArtList",format:"json",maxrecords:"35",sort:"HybridRel",timespan:"24h"}).toString();
  const res=await fetch(u);if(!res.ok)throw new Error("GDELT "+r.region+" "+res.status);
  const data=await res.json();
  return (data.articles??[]).map((a:any)=>({headline:String(a.title??"").slice(0,500),source_name:String(a.domain??"Unknown source").slice(0,180),source_url:String(a.url??""),source_published_at:a.seendate?new Date(String(a.seendate).replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,"$1-$2-$3T$4:$5:$6Z")).toISOString():null,region:r.region,story_date:day,status:"new"}));
 }));
 const leads:any[]=[];for(const batch of batches)for(const x of batch){if(x.headline&&/^https:\/\//i.test(x.source_url)&&!leads.some(y=>y.source_url===x.source_url))leads.push(x);if(leads.length>=60)break}
 if(!leads.length){console.log("No eligible international story leads",day);return}
 const res=await fetch(url+"/rest/v1/editorial_story_leads",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify(leads)});
 if(!res.ok)throw new Error("Saving story leads failed: "+res.status+" "+(await res.text()).slice(0,300));
 console.log("Daily story discovery saved",leads.length,"candidate leads for",day);
}
async function health(url:string,key:string){
 const day=nairobiDay(), next=new Date(day+"T00:00:00Z");next.setUTCDate(next.getUTCDate()+1);
 const start=day+"T00:00:00+03:00",end=next.toISOString().slice(0,10)+"T00:00:00+03:00";
 async function count(table:string){const u=new URL(url+"/rest/v1/"+table);u.search=new URLSearchParams({select:"id",status:"eq.published",published_at:"gte."+start,"published_at":"lt."+end,limit:"1"}).toString();const r=await fetch(u,{headers:{apikey:key,Authorization:"Bearer "+key,Prefer:"count=exact",Range:"0-0"}});if(!r.ok)throw new Error("Count "+table+" failed: "+r.status);const n=Number((r.headers.get("content-range")??"").split("/")[1]);return Number.isFinite(n)?n:(await r.json()).length}
 const [articles,videos]=await Promise.all([count("articles"),count("videos")]);
 const status=articles>0?"healthy":"missed",detail=articles>0?articles+" news article(s) published; "+videos+" video(s) published.":"No news article published by the 18:00 EAT check. WATCH videos published: "+videos+".";
 const headers={apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"};
 const saved=await fetch(url+"/rest/v1/publisher_health_events?on_conflict=event_date",{method:"POST",headers,body:JSON.stringify({event_date:day,status,published_article_count:articles,watch_video_count:videos,details:detail,checked_at:new Date().toISOString()})});
 if(!saved.ok)throw new Error("Saving health event failed: "+saved.status);
 if(status==="missed"){
  const admins=await fetch(url+"/rest/v1/profiles?role=eq.admin&select=id",{headers:{apikey:key,Authorization:"Bearer "+key}});
  if(!admins.ok)throw new Error("Loading admin recipients failed");
  for(const admin of await admins.json()){
   const title="Daily publishing target missed · "+day,u=new URL(url+"/rest/v1/reader_notifications");
   u.search=new URLSearchParams({select:"id",user_id:"eq."+admin.id,title:"eq."+title,limit:"1"}).toString();
   const check=await fetch(u,{headers:{apikey:key,Authorization:"Bearer "+key}});
   if(check.ok&&(await check.json()).length===0)await fetch(url+"/rest/v1/reader_notifications",{method:"POST",headers,body:JSON.stringify({user_id:admin.id,title,body:"No OPEN TAB news article was published by 18:00 EAT today. WATCH video publishing is active. Review the international story queue.",href:"/admin/publishing-health"})});
  }
 }
 console.log("Publisher health check",JSON.stringify({day,status,articles,videos}));
}
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return reply({error:"POST required"},405);
 const supplied=req.headers.get("x-open-tab-cron-secret")??"",url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!supplied||!url||!key)return reply({error:"Unauthorized or missing server configuration"},401);
 const verified=await fetch(url+"/rest/v1/rpc/verify_open_tab_cron_secret",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({p_secret:supplied})});
 if(!verified.ok||(await verified.json())!==true)return reply({error:"Unauthorized"},401);
 let task="discover";try{task=String((await req.json())?.task??"discover")}catch{}
 if(task==="discover"){EdgeRuntime.waitUntil(discover(url,key).catch(e=>console.error("Daily discovery failed",e)));return reply({accepted:true,task},202)}
 if(task==="health"){EdgeRuntime.waitUntil(health(url,key).catch(e=>console.error("Publisher health failed",e)));return reply({accepted:true,task},202)}
 return reply({error:"Unknown task"},400);
});