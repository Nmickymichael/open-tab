import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const REGIONS = ["US","CA","MX","BR","GB","DE","FR","ZA","NG","AE","IN","JP","KR","AU"];
const CATEGORY: Record<string,string> = {
  "1":"Movies","2":"Lifestyle","10":"Music","15":"Lifestyle","17":"Gaming",
  "20":"Gaming","22":"Creators","23":"Viral Culture","24":"Movies",
  "25":"Viral Culture","26":"Lifestyle","27":"Tech","28":"Tech"
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type":"application/json", "Cache-Control":"no-store" } });
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,72);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error:"POST required" },405);
  const cronSecret = Deno.env.get("OPEN_TAB_CRON_SECRET");
  const supplied = req.headers.get("x-open-tab-cron-secret");
  if (!cronSecret || !supplied || supplied !== cronSecret) return json({ error:"Unauthorized" },401);

  const youtubeKey = Deno.env.get("YOUTUBE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!youtubeKey || !supabaseUrl || !serviceKey) {
    return json({ error:"Missing YOUTUBE_API_KEY or Supabase server credentials. Configure Edge Function secrets first." },503);
  }

  const byId = new Map<string, { video:any; regions:Set<string>; ranks:number[] }>();
  const regionErrors:string[] = [];
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
    .filter(x => x.regions.size >= 2 && Number(x.video.statistics?.viewCount ?? 0) >= 25000)
    .sort((a,b) => b.regions.size-a.regions.size ||
      (a.ranks.reduce((s,n)=>s+n,0)/a.ranks.length)-(b.ranks.reduce((s,n)=>s+n,0)/b.ranks.length) ||
      Number(b.video.statistics?.viewCount ?? 0)-Number(a.video.statistics?.viewCount ?? 0));

  for (const candidate of candidates) {
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
    const category = CATEGORY[String(video.snippet.categoryId)] ?? "Viral Culture";
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
      description, youtube_id:id, thumbnail_url:thumbnail, status:"published",
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
    return json({published:true, title, youtube_id:id, creator:channel, category, regions, url:source, row:inserted[0] ?? null, regionErrors});
  }
  return json({published:false, reason:"No eligible new multi-market trend passed the quality and duplicate checks.", candidatesChecked:candidates.length, regionErrors});
});
