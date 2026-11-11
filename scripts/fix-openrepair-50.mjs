/**
 * Safe ORA repair correction. Default is PREVIEW ONLY.
 * node scripts/fix-openrepair-50.mjs
 * node scripts/fix-openrepair-50.mjs --apply
 * Never changes IDs, sources, device links, or non-ORA cases.
 */
import pg from "pg";
const DATASET="OpenRepairData_v0.3_aggregate_202607_eee.csv";
const BASE=`https://github.com/openrepair/data/blob/main/${DATASET}`;
const URL=`https://media.githubusercontent.com/media/openrepair/data/main/${DATASET}`;
const norm=x=>String(x??"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
const val=(r,...names)=>{for(const n of names){const k=Object.keys(r).find(k=>norm(k)===norm(n));if(k && String(r[k]??"").trim())return String(r[k]).trim().slice(0,1500);}return "";};
function parseCSV(input) {
 const rows=[];let row=[],v="",quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(quoted){if(c==='"'){if(input[i+1]==='"'){v+='"';i++;}else quoted=false;}else v+=c;}
  else if(c==='"' && !v) quoted=true;
  else if(c===','){row.push(v);v="";}
  else if(c==='\n'){row.push(v);if(row.some(x=>x.trim()))rows.push(row);row=[];v="";}
  else if(c!=='\r')v+=c;
 }
 if(quoted)throw Error("Unclosed CSV quoted field");
 if(v || row.length){row.push(v);rows.push(row);}
 const header=rows.shift()?.map((x,i)=>i===0?x.replace(/^\uFEFF/,""):x);
 if(!header?.length)throw Error("CSV header missing");
 for(const [i,r] of rows.entries())if(r.length!==header.length)throw Error(`CSV row ${i+2} has ${r.length} columns, expected ${header.length}`);
 return {header,records:rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]])))};
}
const response=await fetch(URL,{headers:{"User-Agent":"OpenRepairDB/0.1","Accept":"text/csv"},signal:AbortSignal.timeout(120000)});
if(!response.ok)throw Error(`CSV download HTTP ${response.status}`);
const {header,records}=parseCSV(await response.text());
console.log("CSV columns:",JSON.stringify(header));
console.log("First parsed source row:",JSON.stringify(records[0]));
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL missing");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const db=await pool.connect();
const apply=process.argv.includes("--apply");
try{
 await db.query("BEGIN");
 const current=await db.query(`SELECT r.id,r.title,r.symptoms,r.diagnosis,r.outcome,s.canonical_url
 FROM repair_cases r JOIN sources s ON s.id=r.source_id
 WHERE s.source_type='ora_repair_attempt' AND s.canonical_url LIKE $1
 ORDER BY r.id FOR UPDATE OF r`,[BASE+"#openrepairdb-record=%"]);
 if(current.rowCount!==50)throw Error(`Expected 50 ORA cases, found ${current.rowCount}. No changes.`);
 const index=new Map();
 for(const row of records){
  const id=val(row,"id"),provider=val(row,"data_provider");
  if(id && provider)index.set(`${provider}:${id}`,row);
 }
 let updated=0;
 for(const old of current.rows){
  const encoded=old.canonical_url.split("#openrepairdb-record=")[1];
  if(!encoded)throw Error(`Missing provenance for REP-${old.id}`);
  const unique=decodeURIComponent(encoded);
  const row=index.get(unique);
  if(!row)throw Error(`Source record not found: ${unique}`);
  const category=val(row,"product_category");
  const brand=val(row,"brand");
  const problem=val(row,"problem");
  const status=val(row,"repair_status");
  const barrier=val(row,"repair_barrier_if_end_of_life");
  const date=val(row,"event_date");
  if(!category || !problem)throw Error(`Required source fields absent for ${unique}. No changes.`);
  const title=`${brand?brand+" · ":""}${category} — ORA ${unique}`.slice(0,350);
  const outcome=[status,date?`Event: ${date}`:""].filter(Boolean).join(" · ")||null;
  if(updated<5)console.log("PREVIEW",JSON.stringify({id:old.id,source:unique,before:{title:old.title,problem:old.symptoms,outcome:old.outcome},after:{title,problem,outcome,diagnosis:barrier||null}}));
  if(apply)await db.query(`UPDATE repair_cases SET title=$2,symptoms=$3,diagnosis=$4,outcome=$5,updated_at=NOW() WHERE id=$1`,[old.id,title,problem,barrier||null,outcome]);
  updated++;
 }
 if(apply){await db.query("COMMIT");console.log(`SUCCESS: Corrected ${updated} existing ORA cases; IDs and links preserved.`);}
 else {await db.query("ROLLBACK");console.log(`DRY RUN: Validated ${updated} ORA cases. Nothing changed. Run with --apply after checking preview.`);}
}catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();await pool.end();}
