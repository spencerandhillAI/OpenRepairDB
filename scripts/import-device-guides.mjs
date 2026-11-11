/** One-time, repeatable migration: import technical device documentation from JSON into PostgreSQL.
 * Run: node scripts/import-device-guides.mjs
 * Does not delete or recreate existing tables or records.
 */
import pg from "pg";
import {readFile} from "node:fs/promises";
const file=new URL("../data/device-guides/arduino-uno-r3.json",import.meta.url);
const guide=JSON.parse(await readFile(file,"utf8"));
if(!guide.model || !guide.overview || !Array.isArray(guide.specifications) || !Array.isArray(guide.pinGroups) || !Array.isArray(guide.links))throw Error("Invalid guide data");
if(!process.env.DATABASE_URL)throw Error("DATABASE_URL missing");
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const db=await pool.connect();
try{
 await db.query("BEGIN");
 await db.query(`CREATE TABLE IF NOT EXISTS device_documentation (
  device_id BIGINT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  overview TEXT NOT NULL,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  specifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  pin_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  documentation_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`);
 const device=await db.query(`SELECT d.id FROM devices d JOIN manufacturers m ON m.id=d.manufacturer_id WHERE d.canonical_model_name=$1 AND m.name='Arduino' AND d.review_status='approved'`,[guide.model]);
 if(device.rowCount!==1)throw Error(`Expected exactly one approved Arduino device named ${guide.model}, found ${device.rowCount}`);
 await db.query(`INSERT INTO device_documentation(device_id,overview,capabilities,specifications,pin_groups,safety_notes,documentation_links,source_url,review_status)
 VALUES($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8,'approved')
 ON CONFLICT(device_id) DO UPDATE SET
 overview=EXCLUDED.overview,capabilities=EXCLUDED.capabilities,specifications=EXCLUDED.specifications,
 pin_groups=EXCLUDED.pin_groups,safety_notes=EXCLUDED.safety_notes,
 documentation_links=EXCLUDED.documentation_links,source_url=EXCLUDED.source_url,
 updated_at=NOW()`,[device.rows[0].id,guide.overview,JSON.stringify(guide.capabilities),JSON.stringify(guide.specifications),JSON.stringify(guide.pinGroups),JSON.stringify(guide.safety),JSON.stringify(guide.links),guide.sourceUrl]);
 await db.query("COMMIT");
 console.log(`SUCCESS: Documentation for ${guide.model} stored in PostgreSQL (device ID ${device.rows[0].id}). Existing records preserved.`);
}catch(e){await db.query("ROLLBACK");throw e;}finally{db.release();await pool.end();}
