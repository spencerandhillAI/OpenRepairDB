/**
 * Import exactly 50 real repair attempts from Open Repair Alliance ORDS v0.3.
 * Source: https://github.com/openrepair/data (CC BY-SA 4.0).
 * Run in Portainer web container: node scripts/import-openrepair-50.mjs
 * No fake device models; one repair_cases row per source record.
 */
import pg from "pg";

const DATASET = "OpenRepairData_v0.3_aggregate_202607_eee.csv";
const DATASET_URL = `https://media.githubusercontent.com/media/openrepair/data/main/${DATASET}`;
const SOURCE_PAGE = `https://github.com/openrepair/data/blob/main/${DATASET}`;
const LIMIT = 50;
const clean = value => String(value ?? "").trim().slice(0, 1500);
const key = value => clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const field = (row, ...names) => {
  for (const name of names) {
    const found = Object.keys(row).find(k => key(k) === key(name));
    if (found && clean(row[found])) return clean(row[found]);
  }
  return "";
};

// Streaming RFC 4180 CSV reader, including escaped quotes and multiline fields.
async function* csvRows(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let columns = [], row = [], value = "", quoted = false, afterQuote = false, first = true;
  const accept = () => {
    row.push(value);
    value = "";
    const completed = row;
    row = [];
    if (first) {
      columns = completed.map((x, i) => i === 0 ? x.replace(/^\uFEFF/, "") : x);
      first = false;
      return null;
    }
    if (!completed.some(x => x.trim())) return null;
    return Object.fromEntries(columns.map((column, index) => [column, completed[index] ?? ""]));
  };
  try {
    while (true) {
      const { done, value: bytes } = await reader.read();
      const chunk = decoder.decode(bytes ?? new Uint8Array(), { stream: !done });
      for (let i = 0; i < chunk.length; i++) {
        const char = chunk[i];
        if (quoted) {
          if (char === '"') { quoted = false; afterQuote = true; }
          else value += char;
        } else if (afterQuote && char === '"') {
          value += '"'; quoted = true; afterQuote = false;
        } else if (char === ',' && !afterQuote) {
          row.push(value); value = ""; afterQuote = false;
        } else if (char === '\n' && !afterQuote) {
          const record = accept(); if (record) yield record;
        } else if (char === '\r' && !afterQuote) {
          // CRLF or CR: LF is the actual row terminator for published ORDS CSV.
        } else if (char === '"' && value === "") {
          quoted = true;
        } else {
          value += char; afterQuote = false;
        }
      }
      if (done) break;
    }
    if (value || row.length) { const record = accept(); if (record) yield record; }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

const response = await fetch(DATASET_URL, {
  headers: { "User-Agent": "OpenRepairDB/0.1 (ORA open data import)", Accept: "text/csv" },
  signal: AbortSignal.timeout(120000),
});
if (!response.ok || !response.body) throw new Error(`ORA CSV download HTTP ${response.status}`);
const records = [];
const ids = new Set();
for await (const row of csvRows(response.body)) {
  const id = field(row, "id");
  const category = field(row, "product_category", "product category");
  const problem = field(row, "problem");
  const provider = field(row, "data_provider", "data provider");
  if (!id || !category || !problem || !provider) continue;
  const unique = `${provider}:${id}`;
  if (ids.has(unique)) continue;
  ids.add(unique);
  records.push({
    unique, category, problem,
    brand: field(row, "brand"),
    status: field(row, "repair_status", "repair status"),
    barrier: field(row, "repair_barrier_if_end_of_life"),
    date: field(row, "event_date", "event date"),
    provider,
  });
  if (records.length === LIMIT) break;
}
if (records.length !== LIMIT) throw new Error(`Only ${records.length} valid distinct records found; nothing written.`);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();
try {
  await db.query("BEGIN");
  let inserted = 0;
  for (const item of records) {
    const canonical = `${SOURCE_PAGE}#openrepairdb-record=${encodeURIComponent(item.unique)}`;
    const exists = await db.query("SELECT 1 FROM sources WHERE canonical_url = $1", [canonical]);
    if (exists.rowCount) continue;
    const source = await db.query(
      `INSERT INTO sources (source_type, source_name, canonical_url, author_or_rightsholder,
        licence_id, licence_url, attribution_text, permitted_use, retrieved_at, notes)
       VALUES ('ora_repair_attempt', 'Open Repair Alliance', $1, 'Open Repair Alliance contributors',
        'CC-BY-SA-4.0', 'https://creativecommons.org/licenses/by-sa/4.0/',
        $2, 'redistribution_allowed', NOW(), $3) RETURNING id`,
      [canonical, `Open Repair Alliance / ${item.provider}; record ${item.unique}; CC BY-SA 4.0`,
       `Dataset: ${DATASET}; original record ID: ${item.unique}; dataset URL: ${SOURCE_PAGE}; source data may be community reported.`]
    );
    await db.query(
      `INSERT INTO repair_cases (source_id, title, symptoms, diagnosis, outcome, verification_status, review_status)
       VALUES ($1, $2, $3, $4, $5, 'unverified', 'approved')`,
      [source.rows[0].id,
       `${item.brand ? item.brand + " · " : ""}${item.category} — ORA ${item.unique}`.slice(0, 350),
       item.problem, item.barrier || null,
       [item.status, item.date ? `Event: ${item.date}` : ""].filter(Boolean).join(" · ") || null]
    );
    inserted++;
  }
  await db.query("COMMIT");
  console.log(`ORA: ${records.length} actual source records selected; ${inserted} imported; ${records.length - inserted} already present.`);
  console.log("Search for product category, brand or reported problem. Attribution: Open Repair Alliance, CC BY-SA 4.0.");
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  db.release();
  await pool.end();
}
