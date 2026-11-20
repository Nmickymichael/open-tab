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
const RSS_SOURCES=[
 {name:"BBC News",region:"Europe / Global",url:"https://feeds.bbci.co.uk/news/world/rss.xml"},
 {name:"The Guardian",region:"Europe / Global",url:"https://www.theguardian.com/world/rss"},
 {name:"Al Jazeera",region:"Middle East / Global",url:"https://www.aljazeera.com/xml/rss/all.xml"},
 {name:"Deutsche Welle",region:"Europe / Global",url:"https://rss.dw.com/xml/rss-en-all"},
 {name:"France 24",region:"Europe / Global",url:"https://www.france24.com/en/rss"},
 {name:"BBC Africa",region:"Africa",url:"https://feeds.bbci.co.uk/news/world/africa/rss.xml"},
 {name:"Africanews",region:"Africa",url:"https://www.africanews.com/feed/rss"},
 {name:"Daily Nation",region:"East Africa",url:"https://nation.africa/kenya/rss.xml"},
 {name:"Channel News Asia",region:"Asia-Pacific",url:"https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml"},
 {name:"Dawn",region:"South Asia",url:"https://www.dawn.com/feeds/home"},
 {name:"ABC News Australia",region:"Asia-Pacific",url:"https://www.abc.net.au/news/feed/51120/rss.xml"},
 {name:"Associated Press",region:"Americas / Global",url:"https://news.google.com/rss/search?q=site%3Aapnews.com+world&hl=en&gl=US&ceid=US%3Aen"}
];
function decodeXml(value:string){return value.replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g,"$1").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()}
function tagValue(block:string,tag:string){const match=block.match(new RegExp("<"+tag+"(?:\\s[^>]*)?>([\\s\\S]*?)</"+tag+">","i"));return match?decodeXml(match[1]):""}
async function discover(url:string,key:string){
 const day=nairobiDay();
 const feeds=await Promise.all(RSS_SOURCES.map(async source=>{
  try{
   const response=await fetch(source.url,{headers:{"User-Agent":"OPEN TAB newsroom discovery/1.0","Accept":"application/rss+xml, application/xml, text/xml"}});
   if(!response.ok){console.warn("RSS source unavailable",source.name,response.status);return []}
   const xml=await response.text(),items=xml.match(/<item\\b[\\s\\S]*?<\\/item>/gi)??[];
   return items.slice(0,12).map(block=>{
    const title=tagValue(block,"title"),link=tagValue(block,"link"),published=tagValue(block,"pubDate");
    const date=published?new Date(published):null;
    const sourceTag=block.match(/<source[^>]*>([\\s\\S]*?)<\\/source>/i);
    return {headline:title.slice(0,500),source_name:sourceTag?decodeXml(sourceTag[1]):source.name,source_url:link,source_published_at:date&&!Number.isNaN(date.getTime())?date.toISOString():null,region:source.region,story_date:day,status:"new"};
   }).filter((row:any)=>row.headline&&/^https:\\/\\//i.test(row.source_url));
  }catch(error){console.warn("RSS source failed",source.name,error);return []}
 }));
 const leads:any[]=[];
 for(const batch of feeds)for(const row of batch){if(!leads.some(x=>x.source_url===row.source_url))leads.push(row);if(leads.length>=80)break}
 if(!leads.length)throw new Error("No eligible RSS story leads returned from the configured international newsrooms.");
 const response=await fetch(url+"/rest/v1/editorial_story_leads",{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify(leads)});
 if(!response.ok)throw new Error("Saving international story leads failed: "+response.status+" "+(await response.text()).slice(0,300));
 console.log("Daily international newsroom discovery completed",JSON.stringify({sources:RSS_SOURCES.length,leads:leads.length,date:day}));
}
async function health(url:string,key:string){
 const localHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Africa/Nairobi',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 if(localHour<18){console.log('Publisher health check deferred until 18:00 EAT');return}
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