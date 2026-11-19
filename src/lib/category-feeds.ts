import {GLOBAL_NEWS_SOURCES} from "@/lib/global-news-sources";
export type LiveCategoryStory={title:string;url:string;description:string;source:string;date:string;image:string|null;imageCredit:string|null;imageLicense:string|null;imageSource:string|null;sourceRegion?:string|null;corroboratingSources?:string[];verificationStatus?:"single-source"|"multi-source"};
const feeds:Record<string,{name:string;url:string;region?:string}[]> = {
 sports:[{name:"BBC Sport",url:"https://feeds.bbci.co.uk/sport/rss.xml?edition=int"},{name:"ESPN",url:"https://www.espn.com/espn/rss/news"},{name:"Sky Sports",url:"https://www.skysports.com/rss/12040"}],
 celebrities:[{name:"People",url:"https://people.com/feed/"},{name:"Variety",url:"https://variety.com/feed/"},{name:"The Guardian",url:"https://www.theguardian.com/tv-and-radio/rss"}],
 creators:[{name:"Tubefilter",url:"https://www.tubefilter.com/feed/"},{name:"Social Media Today",url:"https://www.socialmediatoday.com/feeds/news/"},{name:"The Verge",url:"https://www.theverge.com/rss/index.xml"}],
 entertainment:[{name:"Variety",url:"https://variety.com/feed/"},{name:"The Hollywood Reporter",url:"https://www.hollywoodreporter.com/feed/"},{name:"The Guardian Film",url:"https://www.theguardian.com/film/rss"}],
 technology:[{name:"TechCrunch",url:"https://techcrunch.com/feed/"},{name:"The Verge",url:"https://www.theverge.com/rss/index.xml"},{name:"Wired",url:"https://www.wired.com/feed/rss"}],
 business:[{name:"CNBC",url:"https://www.cnbc.com/id/100003114/device/rss/rss.html"},{name:"Reuters Business",url:"https://feeds.reuters.com/reuters/businessNews"},{name:"Yahoo Finance",url:"https://finance.yahoo.com/news/rssindex"}],
 lifestyle:[{name:"The Guardian Lifestyle",url:"https://www.theguardian.com/lifeandstyle/rss"},{name:"BBC Culture",url:"https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"},{name:"People",url:"https://people.com/feed/"}],
 opinions:[{name:"The Guardian Opinion",url:"https://www.theguardian.com/commentisfree/rss"},{name:"Al Jazeera Opinion",url:"https://www.aljazeera.com/xml/rss/all.xml"},{name:"The New York Times Opinion",url:"https://rss.nytimes.com/services/xml/rss/nyt/Opinion.xml"}],
 movies:[{name:"Variety",url:"https://variety.com/feed/"},{name:"The Hollywood Reporter",url:"https://www.hollywoodreporter.com/feed/"},{name:"The Guardian Film",url:"https://www.theguardian.com/film/rss"}],
 gaming:[{name:"IGN",url:"https://feeds.feedburner.com/ign/all"},{name:"Polygon",url:"https://www.polygon.com/rss/index.xml"},{name:"GamesIndustry.biz",url:"https://www.gamesindustry.biz/feed"}],
 music:[{name:"Rolling Stone",url:"https://www.rollingstone.com/music/music-news/feed/"},{name:"Billboard",url:"https://www.billboard.com/feed/"},{name:"Variety",url:"https://variety.com/v/music/feed/"}],
 "viral-culture":[{name:"BuzzFeed",url:"https://www.buzzfeed.com/index.xml"},{name:"Social Media Today",url:"https://www.socialmediatoday.com/feeds/news/"},{name:"The Verge",url:"https://www.theverge.com/rss/index.xml"}],
 education:[{name:"BBC Science",url:"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"},{name:"The Guardian Education",url:"https://www.theguardian.com/education/rss"},{name:"Nature",url:"https://www.nature.com/subjects/education.rss"}],
 world:[{name:"BBC World",url:"https://feeds.bbci.co.uk/news/world/rss.xml"},{name:"Al Jazeera",url:"https://www.aljazeera.com/xml/rss/all.xml"},{name:"The Guardian World",url:"https://www.theguardian.com/world/rss"}],
 news:[...GLOBAL_NEWS_SOURCES.map(({name,url,region})=>({name,url,region}))]
};
const namedEntities:Record<string,string>={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",ndash:"–",mdash:"—",rsquo:"’",lsquo:"‘",rdquo:"”",ldquo:"“",hellip:"…",copy:"©",reg:"®",trade:"™",euro:"€",pound:"£",cent:"¢",bull:"•",middot:"·",times:"×",divide:"÷"};
function decodeEntities(value:string){return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(entity,key:string)=>{if(key[0]==="#"){const hex=key[1]?.toLowerCase()==="x";const n=parseInt(key.slice(hex?2:1),hex?16:10);try{return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):" "}catch{return" "}}return namedEntities[key.toLowerCase()]??entity})}
function clean(value:string){let text=value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1");for(let i=0;i<2;i++)text=decodeEntities(text);return text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim()}
function tag(block:string,name:string){const m=block.match(new RegExp("<"+name+"\\b[^>]*>([\\s\\S]*?)</"+name+">","i"));return m?clean(m[1]):""}
function image(block:string){const m=block.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*(?:url|href)=["']([^"']+)["']/i)||block.match(/<img[^>]+src=["']([^"']+)["']/i);return m?.[1]||null}
function imageCredit(block:string){return tag(block,"media:credit")||tag(block,"image:credit")||null}
function imageLicense(block:string){return tag(block,"media:license")||tag(block,"image:license")||null}
function imageSource(block:string){const m=block.match(/<(?:media:content|media:thumbnail)[^>]*(?:url|href)=["']([^"']+)["']/i);return m?.[1]||null}
function publicArticleUrl(value:string){
 try{const url=new URL(value);if(!["http:","https:"].includes(url.protocol)||url.username||url.password)return null;const host=url.hostname.toLowerCase();if(host==="localhost"||host.endsWith(".localhost")||host==="127.0.0.1"||host==="::1"||host.startsWith("10.")||host.startsWith("192.168.")||/^172\.(1[6-9]|2[0-9]|3[01])\./.test(host))return null;return url.toString()}catch{return null}
}
function metadataAttribute(tagText:string,name:string){const match=tagText.match(new RegExp("\\b"+name+"\\s*=\\s*([\\x22'])(.*?)\\1","i"));return match?.[2]??""}
function articleImageFromHtml(html:string,pageUrl:string){
 const tags=html.match(/<(?:meta|link)\b[^>]*>/gi)||[];const candidates:string[]=[];
 for(const raw of tags){if(/^<meta/i.test(raw)){const key=(metadataAttribute(raw,"property")||metadataAttribute(raw,"name")||metadataAttribute(raw,"itemprop")).toLowerCase();if(["og:image","og:image:secure_url","twitter:image","twitter:image:src","image"].includes(key)){const content=metadataAttribute(raw,"content");if(content)candidates.push(content)}}else if(/image_src/i.test(metadataAttribute(raw,"rel"))){const href=metadataAttribute(raw,"href");if(href)candidates.push(href)}}
 for(const candidate of candidates){try{const url=new URL(candidate,pageUrl);if(!["http:","https:"].includes(url.protocol)||/\.svg(?:$|[?#])/i.test(url.href))continue;return url.toString()}catch{}}
 return null;
}
async function findArticleImage(articleUrl:string):Promise<string|null>{
 const safeUrl=publicArticleUrl(articleUrl);if(!safeUrl)return null;
 try{const response=await fetch(safeUrl,{headers:{"user-agent":"OPEN TAB Newsroom/1.0 (+https://opentab-media.netlify.app)","accept":"text/html,application/xhtml+xml"},signal:AbortSignal.timeout(5000),next:{revalidate:86400}});
 if(!response.ok||!/(text\/html|application\/xhtml\+xml)/i.test(response.headers.get("content-type")||""))return null;
 const reader=response.body?.getReader();if(!reader)return null;const decoder=new TextDecoder();let html="";let size=0;
 try{while(size<900000){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;html+=decoder.decode(part.value,{stream:true});if(html.includes("</head>"))break;}await reader.cancel()}catch{try{await reader.cancel()}catch{}}
 return articleImageFromHtml(html,safeUrl)}catch{return null}
}
async function fillMissingArticleImages(items:LiveCategoryStory[]){
 const targets=items.filter(item=>!item.image).slice(0,10);let cursor=0;
 const workers=Array.from({length:Math.min(3,targets.length)},async()=>{while(cursor<targets.length){const item=targets[cursor++];const image=await findArticleImage(item.url);if(image){item.image=image;item.imageSource=item.url;}}});
 await Promise.all(workers);return items;
}

const GDELT_QUERIES:Record<string,string>={news:"(world OR international OR Africa OR Asia OR Europe OR Americas OR Middle East)",world:"(world OR international OR Africa OR Asia OR Europe OR Americas OR Middle East)"};
function normalizedHeadline(value:string){return clean(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\b(the|a|an|and|or|to|of|in|on|for|with|after|as|at|by)\b/g," ").replace(/\s+/g," ").trim()}
function headlineSimilarity(a:string,b:string){const left=new Set(normalizedHeadline(a).split(" ").filter(x=>x.length>2));const right=new Set(normalizedHeadline(b).split(" ").filter(x=>x.length>2));if(!left.size||!right.size)return 0;let common=0;for(const word of left)if(right.has(word))common++;return common/(left.size+right.size-common)}
function deduplicateStories(items:LiveCategoryStory[]){const accepted:LiveCategoryStory[]=[];const urls=new Set<string>();for(const item of [...items].sort((a,b)=>Date.parse(b.date||"")-Date.parse(a.date||""))){let key=item.url;try{const u=new URL(item.url);u.hash="";["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(k=>u.searchParams.delete(k));key=u.toString().replace(/\/$/,"")}catch{}if(urls.has(key))continue;urls.add(key);const match=accepted.find(existing=>headlineSimilarity(existing.title,item.title)>=0.78);if(match){const sources=new Set([...(match.corroboratingSources||[match.source]),item.source]);match.corroboratingSources=[...sources].slice(0,8);match.verificationStatus=sources.size>1?"multi-source":"single-source";if(!match.image&&item.image){match.image=item.image;match.imageSource=item.imageSource;match.imageCredit=item.imageCredit;match.imageLicense=item.imageLicense;}continue;}item.corroboratingSources=[item.source];item.verificationStatus="single-source";accepted.push(item)}return accepted}
async function getGdeltStories(slug:string):Promise<LiveCategoryStory[]>{const query=GDELT_QUERIES[slug];if(!query)return[];try{const url=new URL("https://api.gdeltproject.org/api/v2/doc/doc");url.search=new URLSearchParams({query:query+" sourcelang:english",mode:"ArtList",format:"json",maxrecords:"25",sort:"DateDesc"}).toString();const response=await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(6500),next:{revalidate:600}});if(!response.ok)return[];const payload=await response.json();return(payload.articles||[]).map((item:any)=>({title:String(item.title||"").trim(),url:String(item.url||""),description:"International discovery result surfaced by GDELT. Read and verify the original publisher report before publication.",source:String(item.domain||"GDELT discovery"),date:item.seendate?String(item.seendate).replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,"$1-$2-$3T$4:$5:$6Z"):"",image:typeof item.socialimage==="string"&&item.socialimage.startsWith("https://")?item.socialimage:null,imageCredit:null,imageLicense:null,imageSource:null,sourceRegion:item.sourcecountry||null})).filter((item:LiveCategoryStory)=>item.title&&!!publicArticleUrl(item.url))}catch{return[]}}
async function getNewsDataStories(slug:string):Promise<LiveCategoryStory[]>{const key=process.env.NEWSDATA_API_KEY;if(!key)return[];const categoryMap:Record<string,string>={world:"top",news:"top"};const category=categoryMap[slug];if(!category)return[];try{const url=new URL("https://newsdata.io/api/1/latest");url.search=new URLSearchParams({apikey:key,language:"en",category,size:"10"}).toString();const response=await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(5500),next:{revalidate:3600}});if(!response.ok)return[];const payload=await response.json();return(payload.results||[]).map((item:any)=>({title:String(item.title||"").trim(),url:String(item.link||""),description:clean(String(item.description||item.content||"")),source:String(item.source_name||item.source_id||"NewsData.io"),date:String(item.pubDate||""),image:typeof item.image_url==="string"&&item.image_url.startsWith("https://")?item.image_url:null,imageCredit:null,imageLicense:null,imageSource:null,sourceRegion:Array.isArray(item.country)?item.country.join(", "):null})).filter((item:LiveCategoryStory)=>item.title&&!!publicArticleUrl(item.url))}catch{return[]}}

export async function getLiveCategoryStories(slug:string):Promise<LiveCategoryStory[]>{
 const sources=feeds[slug]||[];
 const batches:LiveCategoryStory[][]=[];
 let cursor=0;
 const workers=Array.from({length:Math.min(10,sources.length)},async()=>{
  while(cursor<sources.length){
   const source=sources[cursor++];
   try{
    const res=await fetch(source.url,{headers:{"user-agent":"OPEN TAB Newsroom/1.0 (+https://opentab-media.netlify.app)","accept":"application/rss+xml, application/atom+xml, application/xml, text/xml"},signal:AbortSignal.timeout(7000),next:{revalidate:600}});
    if(!res.ok)continue;
    const xml=await res.text();
    const blocks=[...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>m[2]);
    const parsed=blocks.slice(0,12).map(block=>{
     const link=tag(block,"link")||block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]||"";
     return{title:tag(block,"title"),url:link,description:clean(tag(block,"description")||tag(block,"summary")||tag(block,"content:encoded")),source:source.name,date:tag(block,"pubDate")||tag(block,"published")||tag(block,"updated"),image:image(block),imageCredit:imageCredit(block),imageLicense:imageLicense(block),imageSource:imageSource(block),sourceRegion:source.region||null};
    }).filter(x=>x.title&&/^https?:\/\//i.test(x.url));
    batches.push(parsed);
   }catch{/* One unavailable publisher must not block the wider newsroom. */}
  }
 });
 await Promise.all(workers);
 const [gdelt,newsdata]=await Promise.all([getGdeltStories(slug),getNewsDataStories(slug)]);
 const items=deduplicateStories([...batches.flat(),...gdelt,...newsdata]).slice(0,60);
 return fillMissingArticleImages(items);
}
