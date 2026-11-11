/**
 * Read-only audit of the first 50 Open Repair Alliance cases.
 * Run: node scripts/audit-openrepair-50.mjs
 * Never changes the database.
 */
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL});
try {
 const summary=await pool.query(`
 SELECT count(*)::int AS total,
 count(*) FILTER (WHERE r.device_id IS NOT NULL)::int AS linked_devices,
 count(*) FILTER (WHERE r.board_id IS NOT NULL)::int AS linked_boards,
 count(*) FILTER (WHERE nullif(trim(r.symptoms),'') IS NOT NULL)::int AS with_problem,
 count(*) FILTER (WHERE nullif(trim(r.outcome),'') IS NOT NULL)::int AS with_outcome,
 count(*) FILTER (WHERE r.verification_status='verified')::int AS verified,
 count(*) FILTER (WHERE s.licence_id='CC-BY-SA-4.0')::int AS licence_recorded
 FROM repair_cases r JOIN sources s ON s.id=r.source_id
 WHERE s.source_type='ora_repair_attempt'`);
 const records=await pool.query(`
 SELECT r.id,r.title,r.device_id,r.board_id,r.verification_status,
 left(coalesce(r.symptoms,''),120) AS problem,
 left(coalesce(r.outcome,''),100) AS outcome,
 s.canonical_url,s.licence_id
 FROM repair_cases r JOIN sources s ON s.id=r.source_id
 WHERE s.source_type='ora_repair_attempt'
 ORDER BY r.id LIMIT 50`);
 const counts=await pool.query(`
 SELECT (SELECT count(*)::int FROM devices) AS devices,
 (SELECT count(*)::int FROM boards) AS boards,
 (SELECT count(*)::int FROM components) AS components,
 (SELECT count(*)::int FROM repair_cases) AS repair_cases`);
 console.log("DATABASE COUNTS:",JSON.stringify(counts.rows[0],null,2));
 console.log("OPEN REPAIR ALLIANCE AUDIT:",JSON.stringify(summary.rows[0],null,2));
 console.log("FIRST 50 CASES:");
 for (const r of records.rows) console.log(JSON.stringify({public_id:`REP-${String(r.id).padStart(6,"0")}`,...r}));
 console.log("Audit complete. No data was changed.");
} finally {await pool.end();}
