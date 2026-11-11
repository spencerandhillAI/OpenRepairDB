import {pool} from "@/lib/db";
import type {PoolClient} from "pg";
export type Kind="device"|"board"|"component"|"repair";
export type Mode="create"|"enrich";
type Obj=Record<string,unknown>;
const str=(v:unknown,n=3000)=>typeof v==="string"?v.trim().slice(0,n):"";
const key=(v:string)=>v.normalize("NFKC").trim().toLowerCase().replace(/\s+/g," ");
export function normalizeImport(kind:Kind,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("JSON-Objekt erforderlich.");
 const r=raw as Obj;
 const name=str(r.model||r.name||r.title||r.boardIdentifier||r.partNumber,200);
 const manufacturer=str(r.manufacturer,200);
 const sourceUrl=str(r.sourceUrl,2000);
 if(!name)throw Error("Bezeichnung fehlt: model, name, title, boardIdentifier oder partNumber.");
 if(!/^https:\/\/[^\s]+$/i.test(sourceUrl))throw Error("HTTPS-sourceUrl erforderlich.");
 if(kind!=="repair"&&!manufacturer)throw Error("Hersteller fehlt. Bitte manufacturer im JSON ergänzen.");
 if(kind==="repair"&&!str(r.symptoms)&&!str(r.repairActions)&&!str(r.overview))throw Error("Reparatur benötigt Symptome oder Reparaturmaßnahmen.");
 return {...r,name,manufacturer,sourceUrl};
}
async function find(db:PoolClient,kind:Kind,r:Obj){
 const manufacturer=key(String(r.manufacturer||""));
 const rawName=key(String(r.name));
 const name=manufacturer&&rawName.startsWith(manufacturer+" ")?rawName.slice(manufacturer.length+1):rawName;
 if(kind==="device")return (await db.query(`SELECT d.id,d.canonical_model_name AS name FROM devices d LEFT JOIN manufacturers m ON m.id=d.manufacturer_id WHERE lower(regexp_replace(trim(d.canonical_model_name),'\\s+',' ','g')) IN ($1,$3) AND lower(coalesce(m.name,''))=$2 ORDER BY d.id`,[name,manufacturer,manufacturer+" "+name])).rows;
 if(kind==="board")return (await db.query(`SELECT b.id,b.board_identifier_original AS name FROM boards b LEFT JOIN manufacturers m ON m.id=b.manufacturer_id WHERE lower(trim(b.board_identifier_normalized))=$1 AND lower(coalesce(m.name,''))=$2 ORDER BY b.id`,[name,manufacturer])).rows;
 if(kind==="component")return (await db.query(`SELECT c.id,c.part_number_original AS name FROM components c LEFT JOIN manufacturers m ON m.id=c.manufacturer_id WHERE lower(trim(c.part_number_normalized))=$1 AND lower(coalesce(m.name,''))=$2 ORDER BY c.id`,[name,manufacturer])).rows;
 return (await db.query(`SELECT r.id,r.title AS name FROM repair_cases r JOIN sources s ON s.id=r.source_id WHERE lower(trim(r.title))=$1 OR (s.canonical_url=$2 AND s.source_type='admin_import_repair') ORDER BY r.id`,[name,r.sourceUrl])).rows;
}
export async function inspectImport(kind:Kind,r:Obj){
 const db=await pool.connect();try{return await find(db,kind,r);}finally{db.release();}
}
async function manufacturerId(db:PoolClient,name:string){
 const found=await db.query(`INSERT INTO manufacturers(name) VALUES($1) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,[name]);
 return found.rows[0].id;
}
export async function saveImport(kind:Kind,mode:Mode,r:Obj){
 const db=await pool.connect();
 try{
 await db.query("BEGIN");
 await db.query("SELECT pg_advisory_xact_lock(hashtext($1))",["admin-import:"+kind+":"+key(String(r.manufacturer||""))+":"+key(String(r.name))]);
 const matches=await find(db,kind,r);
 if(matches.length>1)throw Error("Mehrere Dubletten gefunden. Bitte manuell klären.");
 if(mode==="create"&&matches.length)throw Error("Datensatz existiert bereits. Bitte 'Vorhandenen Datensatz ergänzen' verwenden.");
 if(mode==="enrich"&&!matches.length)throw Error("Kein vorhandener Datensatz. Bitte 'Neuen Datensatz anlegen' verwenden.");
 const source=await db.query(`INSERT INTO sources(source_type,source_name,canonical_url,permitted_use,retrieved_at,notes)
 VALUES($1,$2,$3,'metadata_only',NOW(),$4) RETURNING id`,["admin_import_"+kind,String(r.name),r.sourceUrl,"Administrator-Import; Quelleninhalt und Nutzungsrechte manuell prüfen"]);
 const sourceId=source.rows[0].id;
 const name=String(r.name),man=String(r.manufacturer||"");
 const mid=man?await manufacturerId(db,man):null;
 const description=str(r.overview||r.description,10000);
 let id:number;
 if(kind==="device"){
  if(mode==="create"){const q=await db.query(`INSERT INTO devices(manufacturer_id,canonical_model_name,product_category,description,review_status) VALUES($1,$2,$3,$4,'pending') RETURNING id`,[mid,name,str(r.category,200)||null,description||null]);id=q.rows[0].id;}
  else {id=matches[0].id;await db.query(`UPDATE devices SET description=CASE WHEN $2<>'' AND (description IS NULL OR description='') THEN $2 ELSE description END, product_category=COALESCE(product_category,NULLIF($3,'')),updated_at=NOW() WHERE id=$1`,[id,description,str(r.category,200)]);}
  const doc=await db.query("SELECT * FROM device_documentation WHERE device_id=$1 FOR UPDATE",[id]);
  const x=doc.rows[0];
  const array=(v:unknown)=>Array.isArray(v)?v:[];
  const combine=(a:unknown,b:unknown)=>[...array(a),...array(b)].filter((v,i,all)=>all.findIndex(z=>JSON.stringify(z)===JSON.stringify(v))===i).slice(0,150);
  const fields={capabilities:combine(x?.capabilities,r.capabilities),specifications:combine(x?.specifications,r.specifications),pins:combine(x?.pin_groups,r.pinGroups),safety:combine(x?.safety_notes,r.safety),links:combine(x?.documentation_links,r.links)};
  await db.query(`INSERT INTO device_documentation(device_id,overview,capabilities,specifications,pin_groups,safety_notes,documentation_links,source_url,review_status)
  VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,'pending')
  ON CONFLICT(device_id) DO UPDATE SET overview=CASE WHEN device_documentation.overview='' THEN EXCLUDED.overview ELSE device_documentation.overview END,
  capabilities=EXCLUDED.capabilities,specifications=EXCLUDED.specifications,pin_groups=EXCLUDED.pin_groups,
  safety_notes=EXCLUDED.safety_notes,documentation_links=EXCLUDED.documentation_links,
  review_status='pending',updated_at=NOW()`,[id,x?.overview||description||name,JSON.stringify(fields.capabilities),JSON.stringify(fields.specifications),JSON.stringify(fields.pins),JSON.stringify(fields.safety),JSON.stringify(fields.links),r.sourceUrl]);
 }else if(kind==="board"){
  if(mode==="create"){const q=await db.query(`INSERT INTO boards(manufacturer_id,board_identifier_original,board_identifier_normalized,board_type,revision,notes,review_status) VALUES($1,$2,$3,$4,$5,$6,'pending') RETURNING id`,[mid,name,key(name),str(r.category,200)||null,str(r.revision,100)||null,description||null]);id=q.rows[0].id;}
  else{id=matches[0].id;await db.query(`UPDATE boards SET notes=COALESCE(NULLIF(notes,''),NULLIF($2,'')),board_type=COALESCE(board_type,NULLIF($3,'')) WHERE id=$1`,[id,description,str(r.category,200)]);}
 }else if(kind==="component"){
  if(mode==="create"){const q=await db.query(`INSERT INTO components(manufacturer_id,part_number_original,part_number_normalized,component_type,description,review_status) VALUES($1,$2,$3,$4,$5,'pending') RETURNING id`,[mid,name,key(name),str(r.category,200)||null,description||null]);id=q.rows[0].id;}
  else{id=matches[0].id;await db.query(`UPDATE components SET description=COALESCE(NULLIF(description,''),NULLIF($2,'')),component_type=COALESCE(component_type,NULLIF($3,'')) WHERE id=$1`,[id,description,str(r.category,200)]);}
 }else{
  if(mode==="create"){const q=await db.query(`INSERT INTO repair_cases(source_id,title,symptoms,diagnosis,repair_actions,safety_notes,review_status,verification_status) VALUES($1,$2,$3,$4,$5,$6,'pending','unverified') RETURNING id`,[sourceId,name,str(r.symptoms)||description||null,str(r.diagnosis)||null,str(r.repairActions)||null,str(r.safetyNotes)||null]);id=q.rows[0].id;}
  else{id=matches[0].id;await db.query(`UPDATE repair_cases SET symptoms=COALESCE(NULLIF(symptoms,''),NULLIF($2,'')),diagnosis=COALESCE(NULLIF(diagnosis,''),NULLIF($3,'')),repair_actions=COALESCE(NULLIF(repair_actions,''),NULLIF($4,'')),updated_at=NOW() WHERE id=$1`,[id,str(r.symptoms)||description,str(r.diagnosis),str(r.repairActions)]);}
 }
 await db.query("COMMIT");return {id,kind,mode,reviewStatus:"pending"};
 }catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();}
}
