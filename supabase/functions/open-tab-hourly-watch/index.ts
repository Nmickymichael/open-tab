import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const REGIONS = ["US","CA","MX","BR","AR","GB","IE","DE","FR","ES","IT","NL","SE","ZA","NG","KE","EG","AE","SA","IN","PK","BD","JP","KR","ID","PH","SG","AU","NZ"];
const CATEGORY: Record<string,string> = {
  "1":"Movies","2":"Lifestyle","10":"Music","15":"Education & Science","17":"Sports",
  "20":"Gaming","22":"Viral Culture","23":"Comedy","24":"Movies",
  "25":"News","26":"Lifestyle & How-to","27":"Education & Science","28":"Technology"
};
const PRIORITY_CREATORS = [
  "mrbeast","mrwhosetheboss","marques brownlee","mkbhd","unbox therapy",
  "linus tech tips","veritasium","mark rober","dude perfect","emma chamberlain",
  "casey neistat","jacksepticeye","pewdiepie","sidemen","colin and samir"
];
function genreForVideo(video:any):string {
  const text=[video.snippet?.title,video.snippet?.description,video.snippet?.channelTitle].join(" ").toLowerCase();
  if(/\b(podcast|podcasts|full episode|podcast episode|talk show|interview|long-form conversation|bible study podcast|christian podcast|faith podcast|theology podcast)\b/.test(text) || (/\b(bible|christian|faith|theology|jesus|scripture|gospel|apologetics)\b/.test(text) && /\b(show|series|discussion|interview|conversation|episode|sermon|study)\b/.test(text))) return "Podcasts";
  if(/\b(car build|car builds|automotive build|automotive builds|car modification|car modifications|modified car|car restoration|car restorations|automotive restoration|engine rebuild|house renovation|house renovations|home renovation|home renovations|home building|building a house|construction project|workshop build|workshop builds|workshop tour|woodworking|maker build|maker builds|diy project|diy projects|renovation project|3d printing)\b/.test(text)) return "DIY & Builds";
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
const NON_ENGLISH_SCRIPT=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u1780-\u17FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/u;
const ENGLISH_WORDS=new Set("the a an and or but if then than to of in on at for from with by about after before over under into is are was were be been being have has had do does did can could will would should may might this that these those it its not no yes you your we our they their he she his her my me what when where why how who which there here all any some more most many much every new latest live official watch video videos episode part today tonight highlights news review explained reaction interview podcast music game games football soccer match club league transfer goal goals season world championship cup winner winners build making made world cup argentina france scores score scoring wins win beat beats reacts reacts revealed reveals says said breaks record records incredible amazing insane first look unboxing phone technology creator challenge survival".split(" "));
const NON_ENGLISH_WORDS=new Set("el la los las un una unos unas y o pero para por con sin del al de en es son fue esta este esto como que quien quienes donde cuando porque sobre entre muy mas tambien ya se su sus tu usted ustedes nosotros ellos ellas mis te le les hay era han ha soy eres somos estan estaba tiene tienen hizo hacen desde hasta contra tras futbol partido equipo equipos jugador jugadores liga copa mundial goles transferencia fichaje fichajes noticias hoy manana ayer ganar gano victoria derrota juego juegos cancion canciones nuevo nueva ultimo ultima musica que los las del una uno por como para con sin sobre entre muy pero tambien hoy ayer manana futbol gol goles equipo equipos jugador partido partidos victoria derrota noticias partido juego partido y el la de en les des une est avec pour sur dans pas plus aussi aujourd hui hier demain pourquoi comment qui quoi le un et sont aux du der die das und ist mit von zu den ein eine nicht auch heute morgen warum wie was wer il lo gli che non con per del della delle sono oggi domani do da dos das uma um nao porque futebol gol jogo equipe jogador het een van met voor niet vandaag morgen waarom wat wie".split(" "));
const ENGLISH_CREATOR_CHANNELS=["mrbeast","mrwhosetheboss","marques brownlee","mkbhd","unbox therapy","linus tech tips","veritasium","mark rober","dude perfect","emma chamberlain","casey neistat","jacksepticeye","pewdiepie","sidemen","colin and samir"];
function textWords(value:string){return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").match(/[a-z]+/g)||[]}
function containsNonEnglishText(value:string){if(!value)return false;if(NON_ENGLISH_SCRIPT.test(value))return true;const tokens=textWords(value);if(tokens.length<2)return false;let foreign=0,english=0;for(const token of tokens){if(NON_ENGLISH_WORDS.has(token))foreign++;if(ENGLISH_WORDS.has(token))english++;}return foreign>=2&&foreign>english}
function hasEnglishSignal(value:string,minWords=2){const tokens=textWords(value);if(tokens.length<minWords)return false;let evidence=0;for(const token of tokens)if(ENGLISH_WORDS.has(token))evidence++;return evidence>=Math.min(2,Math.ceil(tokens.length*0.12))}
function isEnglishCandidate(video:any):boolean{
 const snippet=video.snippet??{};
 const language=[snippet.defaultAudioLanguage,snippet.defaultLanguage].filter(Boolean).map((v:string)=>v.toLowerCase().trim());
 if(language.some((value:string)=>!/^en(?:[-_]|$)/.test(value)))return false;
 const title=String(snippet.title??"");
 const description=String(snippet.description??"");
 const channel=String(snippet.channelTitle??"");
 if([title,description,channel].some(containsNonEnglishText))return false;
 const knownCreator=ENGLISH_CREATOR_CHANNELS.some(name=>channel.toLowerCase().includes(name));
 if(!hasEnglishSignal(title,2)&&!knownCreator)return false;
 if(description.split(/\s+/).filter(Boolean).length>=12&&!hasEnglishSignal(description,8))return false;
 return true;
}
function discoveryScore(item:{video:any;regions:Set<string>;ranks:number[]}):number {
  const views=Number(item.video.statistics?.viewCount??0);
  const averageRank=item.ranks.reduce((sum,n)=>sum+n,0)/Math.max(1,item.ranks.length);
  const language=String(item.video.snippet?.defaultAudioLanguage??item.video.snippet?.defaultLanguage??"").toLowerCase();
  // English is enforced before scoring; retain a small metadata preference for explicit en tags.
  const englishBoost=language.startsWith("en")?10:0;
  return item.regions.size*100 + Math.log10(Math.max(views,1))*8 +
    (51-averageRank)*0.25 + creatorPriority(item.video)*42 + (item.searchTopics?.length??0)*12 + englishBoost;
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

  // A full multi-market discovery run can take longer than pg_net's 5-second request window.
  // Acknowledge the cron request immediately and let Supabase keep the work alive in the background.
  EdgeRuntime.waitUntil((async () => {
    try {
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

  // One rotating targeted YouTube search per hourly run; hydrate up to 50 IDs in one batch.
  // This expands topic coverage without per-video API calls or additional database tables.
  const DISCOVERY_QUERIES = [
    {label:"Building: automotive, renovation, construction and maker projects",query:"car build|car modification|car restoration|house renovation|home construction|workshop build|maker build|DIY project|woodworking"},
    {label:"Podcasts: Bible, Christian, faith, theology, interviews and talk shows",query:"Bible podcast|Christian podcast|faith podcast|theology podcast|interview podcast|talk show podcast|podcast clips|technology culture podcast"},
    {label:"Tech: reviews and English tech creators",query:"tech review|smartphone review|laptop review|gadget review|MKBHD|Mrwhosetheboss|Unbox Therapy"},
    {label:"Explore: MrBeast and regular English creators",query:"MrBeast|Dude Perfect|Sidemen|Mark Rober|Veritasium|Emma Chamberlain|Casey Neistat"},
    {label:"Music: official videos and performances",query:"official music video|live music performance|music cover"},
    {label:"Gaming: gameplay and gaming creators",query:"gaming gameplay|Minecraft gameplay|Fortnite gameplay|Roblox gameplay|gaming walkthrough"},
    {label:"Playables: interactive and browser games",query:"interactive game|playable game|browser game|play in browser"},
    {label:"Movies: trailers and short films",query:"movie trailer|short film|film trailer|animated short film"}
  ];
  const discoveryQuery=DISCOVERY_QUERIES[new Date().getUTCHours()%DISCOVERY_QUERIES.length];
  const byId = new Map<string, { video:any; regions:Set<string>; ranks:number[]; searchTopics:string[] }>();
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
        const item = byId.get(video.id) ?? { video, regions:new Set<string>(), ranks:[], searchTopics:[] };
        item.regions.add(region);
        item.ranks.push(index + 1);
        const currentViews = Number(item.video.statistics?.viewCount ?? 0);
        const newViews = Number(video.statistics?.viewCount ?? 0);
        if (newViews > currentViews) item.video = video;
        byId.set(video.id,item);
      });
    } catch { regionErrors.push(region + ":network"); }
  }

  // Targeted search rotates one category each hour, avoiding expensive multi-query bursts.
  try {
    const searchUrl=new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.search=new URLSearchParams({
      part:"snippet",type:"video",order:"viewCount",maxResults:"50",
      q:discoveryQuery.query,relevanceLanguage:"en",regionCode:"US",key:youtubeKey
    }).toString();
    const searchResponse=await fetch(searchUrl);
    if(!searchResponse.ok) regionErrors.push("targeted-search:"+searchResponse.status);
    else {
      const searchPayload=await searchResponse.json();
      const ids=[...new Set((searchPayload.items??[]).map((item:any)=>String(item.id?.videoId??"")).filter(Boolean))].slice(0,50);
      if(ids.length){
        const detailsUrl=new URL("https://www.googleapis.com/youtube/v3/videos");
        detailsUrl.search=new URLSearchParams({part:"snippet,statistics",id:ids.join(","),key:youtubeKey}).toString();
        const detailsResponse=await fetch(detailsUrl);
        if(!detailsResponse.ok) regionErrors.push("targeted-details:"+detailsResponse.status);
        else {
          const details=await detailsResponse.json();
          (details.items??[]).forEach((video:any,index:number)=>{
            if(!video.id||!video.snippet?.title||!video.snippet?.channelTitle)return;
            const item=byId.get(video.id)??{video,regions:new Set<string>(),ranks:[],searchTopics:[]};
            const existingViews=Number(item.video.statistics?.viewCount??0);
            const candidateViews=Number(video.statistics?.viewCount??0);
            if(candidateViews>existingViews)item.video=video;
            if(!item.searchTopics.includes(discoveryQuery.label))item.searchTopics.push(discoveryQuery.label);
            item.ranks.push(51+index);
            byId.set(video.id,item);
          });
        }
      }
    }
  } catch { regionErrors.push("targeted-search:network"); }

  const candidates = [...byId.values()]
    // Keep every chart market eligible, but only publish videos with English language metadata/text.
    .filter(x => (x.regions.size >= 1 || x.searchTopics.length > 0) && Number(x.video.statistics?.viewCount ?? 0) >= 100000 && isEnglishCandidate(x.video))
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
    const searchTopics = [...new Set(candidate.searchTopics??[])];
    const discoverySignal = regions.length
      ? "YouTube's most popular charts in "+regions.join(", ")
      : "targeted YouTube search for "+searchTopics.join(", ");
    const category = genreForVideo(video);
    // Genre is descriptive metadata only; no category or creator caps.
    const source = "https://www.youtube.com/watch?v="+id;
    const thumbnail = video.snippet.thumbnails?.maxres?.url ??
      video.snippet.thumbnails?.standard?.url ??
      video.snippet.thumbnails?.high?.url ??
      "https://i.ytimg.com/vi/"+id+"/hqdefault.jpg";
    const description = "OPEN TAB WATCH trend spotlight. This original video by "+channel+
      " was discovered through "+discoverySignal+
      ". Follow the source link to watch the original upload and support its creator.";
    const why = regions.length
      ? "YouTube chart signal: this video appeared in the most popular charts across "+regions.join(", ")+". It was selected for multi-market visibility, not an unverified claim of universal popularity."
      : "Discovery signal: this video surfaced in targeted YouTube search for "+searchTopics.join(", ")+". Selection requires the 100,000-view minimum and English-language screening.";
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
  return json({published:false, reason:"No eligible chart or targeted-search video passed the English screen, 100,000-100,000-view threshold and duplicate check.", candidatesChecked:candidates.length, regionErrors});
    } catch (error) {
      console.error("OPEN TAB WATCH background run failed", error);
    }
  })());
  return json({ accepted: true, message: "WATCH discovery started in the background." }, 202);
});
