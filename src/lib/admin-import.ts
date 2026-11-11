import { createHash, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { pool } from "@/lib/db";

export function adminAuthorized(password:unknown) {
 const expected=process.env.ADMIN_IMPORT_KEY;
 if(!expected || expected.length<24 || typeof password!=="string")return false;
 const a=createHash("sha256").update(password).digest();
 const b=createHash("sha256").update(expected).digest();
 return timingSafeEqual(a,b);
}
export type Guide={model:string;overview:string;capabilities:string[];specifications:[string,string][];pinGroups:{name:string;pins:string;description:string}[];safety:string[];links:{label:string;url:string}[];sourceUrl:string};
const text=(x:unknown,max=2000)=>typeof x==="string"?x.trim().slice(0,max):"";
export function normalizeGuide(raw:unknown):Guide {
 if(!raw || typeof raw!=="object" || Array.isArray(raw))throw Error("JSON muss ein Objekt sein.");
 const x=raw as Record<string,unknown>;
 const model=text(x.model,200),overview=text(x.overview,10000),sourceUrl=text(x.sourceUrl,2000);
 if(!model || !overview || !sourceUrl || !/^https:\/\//.test(sourceUrl))throw Error("model, overview und HTTPS-sourceUrl sind Pflichtfelder.");
 const strings=(v:unknown)=>Array.isArray(v)?v.slice(0,100).map(z=>text(z,1000)).filter(Boolean):[];
 const specifications=Array.isArray(x.specifications)?x.specifications.slice(0,100).filter((z):z is unknown[]=>Array.isArray(z)&&z.length===2).map(z=>[text(z[0],200),text(z[1],1000)] as [string,string]).filter(z=>z[0]&&z[1]):[];
 const pinGroups=Array.isArray(x.pinGroups)?x.pinGroups.slice(0,100).map(z=>({name:text(z?.name,200),pins:text(z?.pins,1000),description:text(z?.description,2000)})).filter(z=>z.name&&z.pins):[];
 const links=Array.isArray(x.links)?x.links.slice(0,50).map(z=>({label:text(z?.label,200),url:text(z?.url,2000)})).filter(z=>z.label&&/^https:\/\//.test(z.url)):[];
 return {model,overview,sourceUrl,capabilities:strings(x.capabilities),specifications,pinGroups,safety:strings(x.safety),links};
}
const allowed=new Set(["docs.arduino.cc","raw.githubusercontent.com","github.com"]);
export async function safeFetch(url:string){
 const u=new URL(url);
 if(u.protocol!=="https:" || u.username || u.password || u.port || !allowed.has(u.hostname))throw Error("URL nicht freigegeben. Derzeit erlaubt: docs.arduino.cc, github.com, raw.githubusercontent.com.");
 const addresses=await lookup(u.hostname,{all:true});
 if(!addresses.length || addresses.some(a=>{const ip=a.address;return a.family===4 ? /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) : ip==="::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80") || ip.startsWith("::ffff:");}))throw Error("Private oder lokale Zieladresse gesperrt.");
 const res=await fetch(u,{redirect:"error",signal:AbortSignal.timeout(12000),headers:{"Accept":"application/json,text/html;q=0.8","User-Agent":"OpenRepairDB-AdminImporter/0.1"}});
 if(!res.ok)throw Error("Quellabruf fehlgeschlagen: HTTP "+res.status);
 const len=Number(res.headers.get("content-length")||0);
 if(len>1_000_000)throw Error("Quelle ist zu groß.");
 const chunks:Uint8Array[]=[];let size=0;
 if(!res.body)throw Error("Leere Antwort.");
 for await(const chunk of res.body){size+=chunk.length;if(size>1_000_000)throw Error("Quelle ist zu groß.");chunks.push(chunk);}
 return {body:Buffer.concat(chunks).toString("utf8"),type:res.headers.get("content-type")||""};
}
export async function inspect(guide:Guide){
 const found=await pool.query(`SELECT d.id,d.canonical_model_name,dd.device_id IS NOT NULL AS has_documentation
 FROM devices d LEFT JOIN device_documentation dd ON dd.device_id=d.id
 WHERE lower(d.canonical_model_name)=lower($1) ORDER BY d.id LIMIT 10`,[guide.model]);
 return found.rows;
}
export async function save(guide:Guide){
 const db=await pool.connect();
 try{
 await db.query("BEGIN");
 const devices=await db.query("SELECT id FROM devices WHERE lower(canonical_model_name)=lower($1) FOR UPDATE",[guide.model]);
 if(devices.rowCount!==1)throw Error("Import nur für genau ein vorhandenes, eindeutig identifiziertes Gerät möglich. Gefunden: "+devices.rowCount);
 const id=devices.rows[0].id;
 const existing=await db.query("SELECT device_id FROM device_documentation WHERE device_id=$1",[id]);
 if(existing.rowCount)throw Error("DUBLETTE: Für dieses Gerät existiert bereits eine Dokumentation. Kein Überschreiben.");
 await db.query(`INSERT INTO device_documentation(device_id,overview,capabilities,specifications,pin_groups,safety_notes,documentation_links,source_url,review_status)
 VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,'pending')`,[id,guide.overview,JSON.stringify(guide.capabilities),JSON.stringify(guide.specifications),JSON.stringify(guide.pinGroups),JSON.stringify(guide.safety),JSON.stringify(guide.links),guide.sourceUrl]);
 await db.query("COMMIT");
 return id;
 }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
}
