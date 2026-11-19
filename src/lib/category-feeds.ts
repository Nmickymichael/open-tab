import {GLOBAL_NEWS_SOURCES} from "@/lib/global-news-sources";
export type LiveCategoryStory={title:string;url:string;description:string;source:string;date:string;image:string|null;imageCredit:string|null;imageLicense:string|null;imageSource:string|null};
const feeds:Record<string,{name:string;url:string}[]> = {
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
 news:[...GLOBAL_NEWS_SOURCES.map(({name,url})=>({name,url}))]
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
function metadataAttribute(tagText:string,name:string){const match=tagText.match(new RegExp("\\b"+name+"\\s*=\\s*(['"])(.*?)\\1","i"));return match?.[2]??""}
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
export async function getLiveCategoryStories(slug:string):Promise<LiveCategoryStory[]>{const sources=feeds[slug]||[];const batches=await Promise.all(sources.map(async source=>{try{const res=await fetch(source.url,{headers:{"user-agent":"OPEN TAB Newsroom/1.0 (+https://opentab-media.netlify.app)","accept":"application/rss+xml, application/atom+xml, application/xml, text/xml"},signal:AbortSignal.timeout(7000),next:{revalidate:600}});if(!res.ok)return[];const xml=await res.text();const blocks=[...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>m[2]);return blocks.slice(0,12).map(block=>{const link=tag(block,"link")||block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]||"";return{title:tag(block,"title"),url:link,description:clean(tag(block,"description")||tag(block,"summary")||tag(block,"content:encoded")),source:source.name,date:tag(block,"pubDate")||tag(block,"published")||tag(block,"updated"),image:image(block),imageCredit:imageCredit(block),imageLicense:imageLicense(block),imageSource:imageSource(block)}}).filter(x=>x.title&&/^https?:\/\//i.test(x.url))}catch{return[]}}));const seen=new Set<string>();const items=batches.flat().filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true}).sort((a,b)=>Date.parse(b.date||"")-Date.parse(a.date||"")).slice(0,30);return fillMissingArticleImages(items)}
