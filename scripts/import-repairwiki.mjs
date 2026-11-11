/**
 * Imports exactly 50 distinct RepairWiki page references into OpenRepairDB.
 * No third-party article text or media is copied.
 * Run inside the web container: node scripts/import-repairwiki.mjs
 */
import pg from "pg";

const API = process.env.REPAIRWIKI_API || "https://repair.wiki/api.php";
const TARGET = 50;
const EXCLUDED = /^(Main Page|RepairWiki:|Template:|Category:|File:|Help:|User:|Talk:|Special:)/i;

async function api(params) {
  const url = new URL(API);
  for (const [key, value] of Object.entries({ action: "query", format: "json", formatversion: "2", ...params })) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers: { "User-Agent": "OpenRepairDB/0.1 (repair metadata importer; source attribution)" }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`RepairWiki API HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

async function discover() {
  const found = new Map();
  let cursor;
  for (let page = 0; page < 20 && found.size < TARGET; page++) {
    const data = await api({ list: "allpages", apnamespace: 0, aplimit: 50, ...(cursor ? { apcontinue: cursor } : {}) });
    for (const item of data.query?.allpages || []) {
      if (item.pageid && item.title && !EXCLUDED.test(item.title)) found.set(item.pageid, item);
      if (found.size >= TARGET) break;
    }
    cursor = data.continue?.apcontinue;
    if (!cursor) break;
  }
  if (found.size < TARGET) throw new Error(`Only ${found.size} eligible RepairWiki pages found; no changes written.`);
  return [...found.values()].slice(0, TARGET);
}

const pages = await discover();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  let inserted = 0;
  for (const page of pages) {
    const url = `https://repair.wiki/index.php?curid=${page.pageid}`;
    const existing = await client.query("SELECT id FROM sources WHERE canonical_url = $1 LIMIT 1", [url]);
    if (existing.rowCount) continue;
    const source = await client.query(
      `INSERT INTO sources (source_type, source_name, canonical_url, author_or_rightsholder, licence_id, licence_url, attribution_text, permitted_use, retrieved_at, notes)
       VALUES ('repairwiki_page', 'RepairWiki', $1, 'RepairWiki contributors', 'CC-BY-SA-3.0', 'https://creativecommons.org/licenses/by-sa/3.0/', $2, 'metadata_only', NOW(), $3) RETURNING id`,
      [url, `RepairWiki contributors — ${page.title}; licence must be checked on the individual page`, "Page-title and source-link only; no guide content copied; licence requires page-level verification."]
    );
    // Store each source as a searchable, unverified reference entry, not a verified device model.
    // A unique synthetic identifier prevents merging unrelated pages with similar titles.
    const device = await client.query(
      `INSERT INTO devices (canonical_model_name, product_category, description, review_status)
       VALUES ($1, 'RepairWiki-Quellenverweis', $2, 'approved') RETURNING id`,
      [page.title, "Importierter Seitentitel von RepairWiki; Zuordnung zu einem Gerät und technische Angaben noch nicht geprüft."]
    );
    await client.query(
      `INSERT INTO device_identifiers (device_id, source_id, identifier_type, value_original, value_normalized, verification_status)
       VALUES ($1, $2, 'repairwiki_page_id', $3, $3, 'unverified')`,
      [device.rows[0].id, source.rows[0].id, String(page.pageid)]
    );
    inserted++;
  }
  await client.query("COMMIT");
  console.log(`RepairWiki: ${pages.length} pages checked, ${inserted} new searchable source references imported, ${pages.length - inserted} already present.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
