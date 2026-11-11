import {normalizeImport,inspectImport,saveImport,type Kind,type Mode} from "@/lib/admin-entity-import";
import { extractHtmlGuide } from "@/lib/html-guide-extractor";
import { NextRequest,NextResponse } from "next/server";
import {adminAuthorized,safeFetch} from "@/lib/admin-import";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest){
 try{
 const origin=req.headers.get("origin");
 // Reverse proxies may expose an internal req.nextUrl.origin. Validate against
 // the actual request Host instead, and reject missing/mismatched origins.
 const host=req.headers.get("host");
 let sameOrigin=false;
 try {
   if(origin && host){
     const parsed=new URL(origin);
     sameOrigin=(parsed.protocol==="http:" || parsed.protocol==="https:") && parsed.host.toLowerCase()===host.toLowerCase();
   }
 } catch { /* malformed Origin */ }
 if(!sameOrigin)return NextResponse.json({error:"Ungültige Anfragequelle."},{status:403});
 if(Number(req.headers.get("content-length")||0)>1_100_000)return NextResponse.json({error:"Anfrage zu groß."},{status:413});
 const input=await req.json();
 if(!adminAuthorized(input.password))return NextResponse.json({error:"Administrator-Zugang verweigert."},{status:403,headers:{"Cache-Control":"no-store"}});
 if(input.action==="fetch"){
 const url=String(input.url||"");
 const result=await safeFetch(url);
 if(result.type.includes("json") || result.body.trimStart().startsWith("{")){
 const data=JSON.parse(result.body);return NextResponse.json({data:normalizeGuide(data)});
 }
 const extracted=extractHtmlGuide(result.body,url);
 return NextResponse.json({data:extracted,notice:"HTML-Auswertung: technische Tabellen und Dokumentationslinks wurden übernommen, soweit im HTML vorhanden. Bitte Modell, Angaben und Quelle prüfen. Leere Felder werden nicht erfunden."});
 }
 const kind=input.kind as Kind;
 if(!["device","board","component","repair"].includes(kind))return NextResponse.json({error:"Bitte Importtyp auswählen."},{status:400});
 const record=normalizeImport(kind,input.data);
 const matches=await inspectImport(kind,record);
 if(input.action==="preview")return NextResponse.json({data:record,matches,warning:matches.length>1?"Mehrdeutige Dubletten – Import gesperrt.":matches.length===1?"Vorhandener Datensatz erkannt. Ergänzen möglich.":"Kein vorhandener Datensatz erkannt. Neuanlage möglich."});
 if(input.action==="save"){
  if(input.confirm!==true)return NextResponse.json({error:"Explizite Bestätigung erforderlich."},{status:400});
  const mode=input.mode as Mode;
  if(mode!=="create"&&mode!=="enrich")return NextResponse.json({error:"Bitte Neuanlage oder Ergänzung auswählen."},{status:400});
  const result=await saveImport(kind,mode,record);
  return NextResponse.json({saved:true,...result});
 }
 return NextResponse.json({error:"Unbekannte Aktion."},{status:400});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Import fehlgeschlagen."},{status:400,headers:{"Cache-Control":"no-store"}});}
}
