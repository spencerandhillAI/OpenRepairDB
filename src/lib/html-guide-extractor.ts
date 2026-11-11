/** Extract only statements actually present in fetched HTML.
 * This is a draft for administrator review, never verified technical truth.
 */
const decode=(s:string)=>s.replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
const clean=(s:string)=>decode(s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim());
const meta=(html:string,name:string)=>{const tags=html.match(/<meta\b[^>]*>/gi)||[];for(const tag of tags){if(new RegExp('(?:name|property)=["\\\']'+name+'["\\\']','i').test(tag))return clean(tag.match(/content=["']([^"']*)["']/i)?.[1]||"");}return "";};
export function extractHtmlGuide(html:string,url:string){
 const h1=clean(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||"");
 const title=clean(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||"");
 const model=(h1||title.split(/[|–—]/)[0]||"").slice(0,200);
 const description=meta(html,"description")||meta(html,"og:description");
 const paragraphs=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>clean(m[1])).filter(x=>x.length>35&&x.length<1500);
 const overview=(description||paragraphs[0]||"").slice(0,10000);
 const specs:[string,string][]=[];
 const seen=new Set<string>();
 const add=(key:string,value:string)=>{key=key.slice(0,200);value=value.slice(0,1000);if(key&&value&&key.length<130&&value.length<500&&!seen.has(key.toLowerCase())){seen.add(key.toLowerCase());specs.push([key,value]);}};
 for(const table of html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi)||[]){
  for(const tr of table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)||[]){
   const cells=[...tr.matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map(m=>clean(m[1]));
   if(cells.length===2)add(cells[0],cells[1]);
  }
 }
 for(const dl of html.match(/<dl\b[^>]*>[\s\S]*?<\/dl>/gi)||[]){
  const pairs=[...dl.matchAll(/<(dt|dd)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  for(let i=0;i<pairs.length-1;i++)if(pairs[i][1].toLowerCase()==="dt"&&pairs[i+1][1].toLowerCase()==="dd")add(clean(pairs[i][2]),clean(pairs[i+1][2]));
 }
 const links:{label:string;url:string}[]=[];
 for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const label=clean(match[2]).slice(0,200);let href="";
  try{const u=new URL(decode(match[1]),url);if(u.protocol==="https:")href=u.toString();}catch{}
  if(href&&/pinout|schematic|datasheet|schaltplan|documentation|hardware|technical|download/i.test(label+" "+href)&&!links.some(x=>x.url===href))links.push({label:label||"Dokumentation",url:href});
  if(links.length===30)break;
 }
 return {model,overview,sourceUrl:url,capabilities:[],specifications:specs.slice(0,100),pinGroups:[],safety:[],links,extraction:{method:"html-tables-and-description",foundSpecifications:specs.length,foundLinks:links.length,reviewRequired:true,notes:"Nur sichtbare HTML-Tabellen, Beschreibungen und Dokumentationslinks extrahiert. Keine Pinbelegung aus Vermutungen generiert."}};
}
