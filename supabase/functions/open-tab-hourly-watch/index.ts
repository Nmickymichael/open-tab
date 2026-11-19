import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const REGIONS = ["US","CA","MX","BR","AR","GB","IE","DE","FR","ES","IT","NL","SE","ZA","NG","KE","EG","AE","SA","IN","PK","BD","JP","KR","ID","PH","SG","AU","NZ"];
const CATEGORY: Record<string,string> = {
  "1":"Movies","2":"Lifestyle","10":"Music","15":"Education & Science","17":"Sports",
  "20":"Gaming","22":"Viral Culture","23":"Comedy","24":"Movies",
  "25":"News","26":"DIY & Builds","27":"Education & Science","28":"Technology"
};
const PRIORITY_CREATORS = [
  "mrbeast","mrwhosetheboss","marques brownlee","mkbhd","unbox therapy",
  "linus tech tips","veritasium","mark rober","dude perfect","emma chamberlain",
  "casey neistat","jacksepticeye","pewdiepie","sidemen","colin and samir"
];
function genreForVideo(video:any):string {
  const text=[video.snippet?.title,video.snippet?.description,video.snippet?.channelTitle].join(" ").toLowerCase();
  if(/\b(mrwhosetheboss|mkbhd|marques brownlee|unbox therapy|linus tech tips|dave2d|tech review|smartphone|gadget|iphone|android|laptop)\b/.test(text)) return "Technology";
  if(/\b(mrbeast|challenge|last to|24 hour challenge|hide and seek|survive)\b/.test(text)) return "Viral Culture";
  if(/\b(animation|animator|animated|cartoon)\b/.test(text)) return "Animation";
  if(/\b(makeup|beauty|skincare|haircare)\b/.test(text)) return "Beauty";
  if(/\b(comedy|funny|stand.?up|sketch)\b/.test(text)) return "Comedy";
  if(/\b(commentary|reaction|opinion|explained|discourse)\b/.test(text)) return "Commentary";
  if(/\b(review|reviewed|comparison|unboxing|first look|critique)\b/.test(text)) return "Reviews";
  if(/\b(diy|build|maker|woodworking|3d print|restoration|craft)\b/.test(text)) return "DIY & Builds";
  if(/\b(science|experiment|education|learn|physics|engineering|documentary)\b/.test(text)) return "Education & Science";
  if(/\b(fashion|style|outfit|lookbook)\b/.test(text)) return "Fashion";
  if(/\b(short film|filmmaking|cinematography|behind the scenes)\b/.test(text)) return "Film & Video";
  if(/\b(recipe|cooking|cook with|food|baking|chef)\b/.test(text)) return "Food";
  if(/\b(gameplay|gaming|minecraft|fortnite|roblox|gta|playthrough|esports)\b/.test(text)) return "Gaming";
  if(/\b(fitness|workout|training|gym|health)\b/.test(text)) return "Health & Fitness";
  if(/\b(lifestyle|routine|day in my life|home tour)\b/.test(text)) return "Lifestyle";
  if(/\b(music|official video|live performance|song|album|cover)\b/.test(text)) return "Music";
  if(/\b(news|election|breaking|report|current affairs)\b/.test(text)) return "News";
  if(/\b(soccer|football|basketball|tennis|nba|nfl|match highlights)\b/.test(text)) return "Sports";
  if(/\b(podcast|episode|interview|conversation)\b/.test(text)) return "Podcasts";
  if(/\b(vlog|travel diary|weekly vlog)\b/.test(text)) return "Vlogging";
  if(/\b(artist|illustration|painting|drawing|design)\b/.test(text)) return "Art & Design";
  return CATEGORY[String(video.snippet?.categoryId)] ?? "Viral Culture";
}
function creatorPriority(video:any):number {
  const channel=String(video.snippet?.channelTitle??"").toLowerCase().replace(/[^a-z0-9 ]/g,"");
  return PRIORITY_CREATORS.some(name=>channel.includes(name))?1:0;
}
function discoveryScore(item:{video:any;regions:Set<string>;ranks:number[]}):number {
  const views=Number(item.video.statistics?.viewCount??0);
  const averageRank=item.ranks.reduce((sum,n)=>sum+n,0)/Math.max(1,item.ranks.length);
  return item.regions.size*100 + Math.log10(Math.max(views,1))*8 +
    (51-averageRank)*0.25 + creatorPriority(item.video)*12;
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json", "Cache-Control":"no-store" } });
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,72);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error:"POST required" },405);
  const supplied = req.headers.get("x-open-tab-cron-secret");
  const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supplied || !supabaseUrl || !serviceKey) return json({ error:"Unauthorized" },401);

  const authCheck = await fetch(supabaseUrl + "/rest/v1/rpc/verify_open_tab_cron_secret", {
    method:"POST",
    headers:{ apikey:serviceKey, Authorization:"Bearer "+serviceKey, "Content-Type":"application/json" },
    body:JSON.stringify({ p_secret:supplied })
  });
  if (!authCheck.ok || await authCheck.json() !== true) return json({ error:"Unauthorized" },401);
  if (!youtubeKey) return json({ error:"YOUTUBE_API_KEY is not configured in Supabase Edge Function Secrets." },503);

  // Refresh up to 50 existing TV items in one YouTube statistics request,
  // then persist all returned counts through one restricted database RPC.
  // This runs on the existing hourly schedule, never on page requests.
  const viewRefreshErrors:string[] = [];
  try {
    const libraryUrl = new URL(supabaseUrl + "/rest/v1/videos");
    libraryUrl.search = new URLSearchParams({select:"id,youtube_id",status:"eq.published",youtube_id:"not.is.null",order:"published_at.desc",limit:"50"}).toString();
    const authHeaders = {apikey:serviceKey,Authorization:"Bearer "+serviceKey};
    const libraryResponse = await fetch(libraryUrl,{headers:authHeaders});
    if (!libraryResponse.ok) viewRefreshErrors.push("library-"+libraryResponse.status);
    else {
      const library:any[] = await libraryResponse.json();
      const ids = [...new Set(library.map(row=>String(row.youtube_id||"")).filter(Boolean))].slice(0,50);
      if (ids.length) {
        const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
        statsUrl.search = new URLSearchParams({part:"statistics",id:ids.join(","),key:youtubeKey}).toString();
        const statsResponse = await fetch(statsUrl);
        if (!statsResponse.ok) viewRefreshErrors.push("youtube-"+statsResponse.status);
        else {
          const stats = await statsResponse.json();
          const byYoutubeId = new Map<string,number>();
          (stats.items??[]).forEach((item:any)=>{
            const count=Number(item.statistics?.viewCount);
            if(item.id&&Number.isSafeInteger(count)&&count>=0)byYoutubeId.set(String(item.id),count);
          });
          const counts=library.flatMap(row=>{
            const count=byYoutubeId.get(String(row.youtube_id||""));
            return count===undefined?[]:[{id:row.id,view_count:count}];
          });
          if(counts.length) {
            const update=await fetch(supabaseUrl+"/rest/v1/rpc/refresh_video_view_counts",{
              method:"POST",
              headers:{...authHeaders,"Content-Type":"application/json"},
              body:JSON.stringify({p_counts:counts})
            });
            if(!update.ok)viewRefreshErrors.push("database-"+update.status);
          }
        }
      }
    }
  } catch {
    viewRefreshErrors.push("network");
  }

  const byId = new Map<string, { video:any; regions:Set<string>; ranks:number[] }>();
  const regionErrors:string[] = viewRefreshErrors.map(error=>"view-count-refresh:"+error);
  for (const region of REGIONS) {
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.search = new URLSearchParams({
      part:"snippet,statistics", chart:"mostPopular", regionCode:region, maxResults:"50", key:youtubeKey
    }).toString();
    try {
      const response = await fetch(url);
      if (!response.ok) { regionErrors.push(region + ":" + response.status); continue; }
      const payload = await response.json();
      (payload.items ?? []).forEach((video:any, index:number) => {
        if (!video.id || !video.snippet?.title || !video.snippet?.channelTitle) return;
        const item = byId.get(video.id) ?? { video, regions:new Set<string>(), ranks:[] };
        item.regions.add(region);
        item.ranks.push(index + 1);
        const currentViews = Number(item.video.statistics?.viewCount ?? 0);
        const newViews = Number(video.statistics?.viewCount ?? 0);
        if (newViews > currentViews) item.video = video;
        byId.set(video.id,item);
      });
    } catch { regionErrors.push(region + ":network"); }
  }

  const candidates = [...byId.values()]
    // Keep videos from every chart market and language eligible.
    .filter(x => x.regions.size >= 1 && Number(x.video.statistics?.viewCount ?? 0) >= 500000)
    .sort((a,b) => discoveryScore(b)-discoveryScore(a));

  const published:any[] = [];
  for (const candidate of candidates) {
    if (published.length >= 12) break;

    const video = candidate.video;
    const id = String(video.id);
    const duplicateUrl = new URL(supabaseUrl + "/rest/v1/videos");
    duplicateUrl.search = new URLSearchParams({
      select:"id", youtube_id:"eq."+id, is_watch_review:"eq.true", limit:"1"
    }).toString();
    const authHeaders = { apikey:serviceKey, Authorization:"Bearer "+serviceKey };
    const existsResponse = await fetch(duplicateUrl,{headers:authHeaders});
    if (!existsResponse.ok) return json({error:"Could not check duplicate status",detail:await existsResponse.text()},502);
    const existing = await existsResponse.json();
    if (existing.length) continue;

    const title = String(video.snippet.title).slice(0,240);
    const channel = String(video.snippet.channelTitle).slice(0,160);
    const regions = [...candidate.regions].sort();
    const category = genreForVideo(video);
    // Genre is descriptive metadata only; no category or creator caps.
    const source = "https://www.youtube.com/watch?v="+id;
    const thumbnail = video.snippet.thumbnails?.maxres?.url ??
      video.snippet.thumbnails?.standard?.url ??
      video.snippet.thumbnails?.high?.url ??
      "https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";
    const description = "OPEN TAB WATCH trend spotlight. This original video by "+channel+
      " appeared in YouTube's most popular charts in "+regions.join(", ")+
      ". Follow the source link to watch the original upload and support its creator.";
    const why = "YouTube chart signal: this video appeared in the most popular charts across "+
      regions.join(", ")+". It was selected for multi-market visibility, not an unverified claim of universal popularity.";
    const verdict = "Trend spotlight, not a full content review. Selection is based on public YouTube chart placement and metadata; OPEN TAB has not independently assessed every claim or the full video's quality.";
    const payload = {
      title, slug:slugify(title)+"-"+id.slice(0,6).toLowerCase(),
      description, youtube_id:id, thumbnail_url:thumbnail,
      view_count:Number(video.statistics?.viewCount ?? 0), status:"published",
      published_at:new Date().toISOString(), video_type:"video", is_watch_review:true,
      watch_category:category, why_trending:why, editorial_verdict:verdict,
      source_url:source, creator_display_name:channel
    };
    const insertResponse = await fetch(supabaseUrl+"/rest/v1/videos",{
      method:"POST",
      headers:{...authHeaders,"Content-Type":"application/json","Prefer":"return=representation"},
      body:JSON.stringify(payload)
    });
    if (!insertResponse.ok) return json({error:"Publishing failed",detail:await insertResponse.text()},502);
    const inserted = await insertResponse.json();
    published.push({title, youtube_id:id, creator:channel, category, regions, url:source, row:inserted[0] ?? null});
  }
  if (published.length) return json({published:true, count:published.length, items:published, regionErrors});
  return json({published:false, reason:"No eligible new chart-discovery video passed the view threshold and duplicate check.", candidatesChecked:candidates.length, regionErrors});
});
