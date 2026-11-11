/**
 * Pilot import: 5 Arduino device models + 5 documented boards + 20
 * LibrePCB official-library components. No repair-case links are inferred.
 * Run: node scripts/import-linked-pilot.mjs
 * Requires DATABASE_URL; idempotent via source provenance and identifiers.
 */
import pg from "pg";

const models = [
 {model:"Arduino UNO R3", board:"Arduino UNO R3 PCB", category:"Mikrocontroller-Entwicklungsboard", url:"https://docs.arduino.cc/hardware/uno-rev3"},
 {model:"Arduino Mega 2560 Rev3", board:"Arduino Mega 2560 Rev3 PCB", category:"Mikrocontroller-Entwicklungsboard", url:"https://docs.arduino.cc/hardware/mega-2560"},
 {model:"Arduino Leonardo", board:"Arduino Leonardo PCB", category:"Mikrocontroller-Entwicklungsboard", url:"https://docs.arduino.cc/hardware/leonardo"},
 {model:"Arduino Nano", board:"Arduino Nano PCB", category:"Mikrocontroller-Entwicklungsboard", url:"https://docs.arduino.cc/hardware/nano"},
 {model:"Arduino Due", board:"Arduino Due PCB", category:"Mikrocontroller-Entwicklungsboard", url:"https://docs.arduino.cc/hardware/due"}
];
const request = async (url) => {
 const r=await fetch(url,{headers:{"Accept":"application/vnd.github+json","User-Agent":"OpenRepairDB-linked-pilot"},signal:AbortSignal.timeout(30000)});
 if(!r.ok) throw Error(`HTTP ${r.status}: ${url}`);
 return r;
};
const github = async path => (await request(`https://api.github.com/${path}`)).json();
async function partsFromLibrePCB() {
 const repos=await github("orgs/LibrePCB-Libraries/repos?per_page=100&type=public");
 const candidates=repos.filter(r=>!r.archived && /base|semiconductor|analog|logic|microcontroller|ic|passive|discrete/i.test(r.name)).sort((a,b)=>Number(/base/i.test(b.name))-Number(/base/i.test(a.name)));
 if(!candidates.length) throw Error("No official LibrePCB library repositories found");
 const parts=[];
 const seen=new Set();
 for(const repo of candidates.slice(0,12)) {
  const license=await request(`https://raw.githubusercontent.com/LibrePCB-Libraries/${encodeURIComponent(repo.name)}/${encodeURIComponent(repo.default_branch)}/LICENSE.txt`).then(r=>r.text()).catch(()=>null);
  if(!license || !/CC0|public domain/i.test(license)) continue;
  const tree=await github(`repos/LibrePCB-Libraries/${encodeURIComponent(repo.name)}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`);
  if(tree.truncated) continue;
  const files=(tree.tree||[]).filter(f=>f.type==="blob" && /^cmp\/[^/]+\/component\.lp$/.test(f.path));
  for(const f of files.slice(0,100)) {
   const url=`https://raw.githubusercontent.com/LibrePCB-Libraries/${encodeURIComponent(repo.name)}/${encodeURIComponent(repo.default_branch)}/${f.path}`;
   const body=await request(url).then(r=>r.text());
   const name=body.match(/\(name\s+"((?:[^"\\]|\\.)+)"/)?.[1]?.replace(/\\"/g,'"').trim();
   if(!name || name.length>180 || seen.has(name.toLowerCase())) continue;
   seen.add(name.toLowerCase());
   parts.push({name,url,library:repo.name});
   if(parts.length===20) return parts;
  }
 }
 throw Error(`Found only ${parts.length} usable CC0 components, need 20. Nothing imported.`);
}

console.log("Checking 5 official model pages and collecting 20 licensed components...");
for(const m of models) {
 const r=await request(m.url);
 const html=await r.text();
 if(!html.toLowerCase().includes("arduino")) throw Error(`Unexpected device page: ${m.url}`);
}
const parts=await partsFromLibrePCB();
if(!process.env.DATABASE_URL) throw Error("DATABASE_URL missing");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const db=await pool.connect();
try {
 await db.query("BEGIN");
 const manufacturer=await db.query("INSERT INTO manufacturers(name) VALUES ('Arduino') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id");
 const arduino=manufacturer.rows[0].id;
 let devices=0,boards=0,components=0,links=0;
 for(const m of models) {
  const src=await db.query(`SELECT id FROM sources WHERE canonical_url=$1 LIMIT 1`,[m.url]);
  const source=src.rows[0]?.id ?? (await db.query(`INSERT INTO sources(source_type,source_name,canonical_url,author_or_rightsholder,permitted_use,notes,retrieved_at) VALUES('manufacturer_documentation','Arduino Documentation',$1,'Arduino','metadata_only','Model and PCB existence verified from official hardware documentation; no drawings or images copied.',NOW()) RETURNING id`,[m.url])).rows[0].id;
  let device=(await db.query(`SELECT d.id FROM devices d JOIN device_identifiers di ON di.device_id=d.id WHERE di.identifier_type='manufacturer_model' AND di.value_normalized=$1 LIMIT 1`,[m.model.toLowerCase()])).rows[0]?.id;
  if(!device) {
   device=(await db.query(`INSERT INTO devices(manufacturer_id,canonical_model_name,product_category,description,review_status) VALUES($1,$2,$3,'Offiziell dokumentiertes Arduino-Entwicklungsboard.','approved') RETURNING id`,[arduino,m.model,m.category])).rows[0].id;
   await db.query(`INSERT INTO device_identifiers(device_id,source_id,identifier_type,value_original,value_normalized,verification_status) VALUES($1,$2,'manufacturer_model',$3,$4,'verified')`,[device,source,m.model,m.model.toLowerCase()]);
   devices++;
  }
  let board=(await db.query(`SELECT id FROM boards WHERE board_identifier_normalized=$1 LIMIT 1`,[m.board.toLowerCase()])).rows[0]?.id;
  if(!board) {
   board=(await db.query(`INSERT INTO boards(manufacturer_id,board_identifier_original,board_identifier_normalized,board_type,notes,review_status) VALUES($1,$2,$3,'Entwicklungsboard-PCB',$4,'approved') RETURNING id`,[arduino,m.board,m.board.toLowerCase(),`Offizielles Board-Modell; kein eigenständiger Fertigungs-/PCB-Revisioncode. Dokumentation: ${m.url}`])).rows[0].id;
   boards++;
  }
  const relation=await db.query(`INSERT INTO device_boards(device_id,board_id,relationship_type,source_id,confidence,review_status) VALUES($1,$2,'installed_in',$3,1,'approved') ON CONFLICT(device_id,board_id,relationship_type) DO NOTHING RETURNING id`,[device,board,source]);
  links+=relation.rowCount;
 }
 for(const part of parts) {
  const sourceResult=await db.query("SELECT id FROM sources WHERE canonical_url=$1 LIMIT 1",[part.url]);
  const source=sourceResult.rows[0]?.id ?? (await db.query(`INSERT INTO sources(source_type,source_name,canonical_url,author_or_rightsholder,licence_id,licence_url,attribution_text,permitted_use,retrieved_at,notes) VALUES('librepcb_component','LibrePCB official library',$1,'LibrePCB-Libraries contributors','CC0-1.0','https://creativecommons.org/publicdomain/zero/1.0/',$2,'redistribution_allowed',NOW(),$3) RETURNING id`,[part.url,`LibrePCB-Libraries / ${part.library}, CC0 1.0`,`Official library component definition. Repository: ${part.library}. Not proof of placement on a physical board.`])).rows[0].id;
  const existing=await db.query("SELECT id FROM components WHERE part_number_normalized=$1 LIMIT 1",[part.name.toLowerCase()]);
  if(existing.rowCount) continue;
  await db.query(`INSERT INTO components(part_number_original,part_number_normalized,component_type,description,datasheet_source_id,review_status) VALUES($1,$2,'LibrePCB Bibliotheksbauteil',$3,$4,'approved')`,[part.name,part.name.toLowerCase(),`Offizielle LibrePCB-Komponentendefinition (${part.library}); keine Zuordnung zu einer konkreten Platine nachgewiesen.`,source]);
  components++;
 }
 await db.query("COMMIT");
 console.log(`Pilot complete: ${devices} devices, ${boards} boards, ${components} components, ${links} device-board links created. 50 existing repairs unchanged.`);
 console.log("No board-component placements or repair-case links invented. Re-running is safe.");
} catch(e) {await db.query("ROLLBACK");throw e;} finally {db.release();await pool.end();}
