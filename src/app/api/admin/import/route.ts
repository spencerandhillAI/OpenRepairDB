import { NextRequest,NextResponse } from "next/server";
import {adminAuthorized,normalizeGuide,safeFetch,inspect,save} from "@/lib/admin-import";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 try{
 const origin=req.headers.get("origin");
 if(!origin || origin!==req.nextUrl.origin)return NextResponse.json({error:"Ungültige Anfragequelle."},{status:403});
 if(Number(req.headers.get("content-length")||0)>1_100_000)return NextResponse.json({error:"Anfrage zu groß."},{status:413});
 const input=await req.json();
 if(!adminAuthorized(input.password))return NextResponse.json({error:"Administrator-Zugang verweigert."},{status:403,headers:{"Cache-Control":"no-store"}});
 if(input.action==="fetch"){
 const url=String(input.url||"");
 const result=await safeFetch(url);
 if(result.type.includes("json") || result.body.trimStart().startsWith("{")){
 const data=JSON.parse(result.body);return NextResponse.json({data:normalizeGuide(data)});
 }
 // HTML is untrusted and cannot be automatically turned into verified technical specifications.
 const title=result.body.match(/<title[^>]*>([^<]{1,300})<\/title>/i)?.[1]?.trim()||"";
 const description=result.body.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]||"";
 return NextResponse.json({htmlPreview:{title,description,sourceUrl:url},notice:"HTML-Quelle erkannt. Bitte technische Fakten anhand der Originaldokumentation in JSON erfassen und vor dem Import prüfen."});
 }
 const guide=normalizeGuide(input.data);
 const matches=await inspect(guide);
 if(input.action==="preview")return NextResponse.json({data:guide,matches,warning:matches.length===0?"Gerät fehlt in der Datenbank.":matches.some(x=>x.has_documentation)?"Bereits dokumentiertes Gerät erkannt.":null});
 if(input.action==="save"){
 if(input.confirm!==true)return NextResponse.json({error:"Explizite Bestätigung erforderlich."},{status:400});
 const id=await save(guide);
 return NextResponse.json({saved:true,deviceId:id,reviewStatus:"pending"});
 }
 return NextResponse.json({error:"Unbekannte Aktion."},{status:400});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Import fehlgeschlagen."},{status:400,headers:{"Cache-Control":"no-store"}});}
}
