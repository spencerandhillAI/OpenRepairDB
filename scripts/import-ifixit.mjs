/**
 * Import 50 public iFixit guide references as searchable, unverified repair cases.
 * Only title, guide ID, URL and source attribution are stored; no guide text/media.
 * Run from the deployed web container: node scripts/import-ifixit.mjs
 */
import pg from "pg";

const TARGET = 50;
const API = "https://www.ifixit.com/api/2.0/guides";
const pages = [];
const seen = new Set();

for (let offset = 0; offset < 500 && pages.length < TARGET; offset += 50) {
  const url = new URL(API);
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("limit", "50");
  url.searchParams.set("filter", "repair");
  const response = await fetch(url, {
    headers: { "User-Agent": "OpenRepairDB/0.1 (public guide reference index)", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`iFixit API HTTP ${response.status}; database unchanged`);
  const batch = await response.json();
  if (!Array.isArray(batch)) throw new Error("Unexpected iFixit API response; database unchanged");
  for (const guide of batch) {
    const id = Number(guide.guideid ?? guide.guide_id ?? guide.id);
    const title = String(guide.title ?? "").trim();
    if (!Number.isSafeInteger(id) || id <= 0 || !title || seen.has(id)) continue;
    seen.add(id);
    pages.push({ id, title });
    if (pages.length === TARGET) break;
  }
  if (batch.length < 50) break;
}

if (pages.length !== TARGET) throw new Error(`Found only ${pages.length} eligible guides; database unchanged`);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  let created = 0;
  for (const guide of pages) {
    const url = `https://www.ifixit.com/Guide/${guide.id}`;
    const existing = await client.query("SELECT id FROM sources WHERE canonical_url = $1 LIMIT 1", [url]);
    if (existing.rowCount) continue;
    const source = await client.query(
      `INSERT INTO sources
        (source_type, source_name, canonical_url, author_or_rightsholder, licence_id, licence_url,
         attribution_text, permitted_use, retrieved_at, notes)
       VALUES ('ifixit_guide', 'iFixit', $1, 'iFixit guide contributors', 'CC-BY-NC-SA-3.0',
               'https://creativecommons.org/licenses/by-nc-sa/3.0/', $2,
               'metadata_only', NOW(), $3)
       RETURNING id`,
      [url, `iFixit guide #${guide.id}; individual author and licence must be checked at source`,
       "Reference only: title, stable guide ID, link. No guide steps, photos or media copied. Noncommercial API terms apply."]
    );
    await client.query(
      `INSERT INTO repair_cases (source_id, title, verification_status, review_status)
       VALUES ($1, $2, 'unverified', 'approved')`,
      [source.rows[0].id, guide.title]
    );
    created++;
  }
  await client.query("COMMIT");
  console.log(`iFixit: ${pages.length} real guide references checked, ${created} imported, ${pages.length - created} already present.`);
  console.log("Search by words in a guide title. These are source references, not verified repair outcomes.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
