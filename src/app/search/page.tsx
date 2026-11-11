import Link from "next/link";
import { pool } from "@/lib/db";

import { entryHref, type EntryKind } from "@/lib/entries";

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  let status = "Gib einen Suchbegriff ein.";
  let results: { kind: EntryKind; id: string; label: string; detail: string }[] = [];

  if (q.trim()) {
    try {
      const term = q.trim().slice(0, 120);
      const result = await pool.query(
        `SELECT kind, id, label, detail
         FROM (
           SELECT 'device' AS kind, d.id::text AS id,
                  d.canonical_model_name AS label,
                  concat_ws(' · ', m.name, d.product_category, d.description) AS detail
           FROM devices d
           LEFT JOIN manufacturers m ON m.id = d.manufacturer_id
           WHERE d.review_status = 'approved'
             AND (
               position(lower($1) in d.search_text) > 0
               OR EXISTS (
                 SELECT 1 FROM device_identifiers di
                 WHERE di.device_id = d.id
                   AND position(lower($1) in lower(di.value_normalized)) > 0
               )
             )
           UNION ALL
           SELECT 'board', b.id::text, b.board_identifier_original,
                  concat_ws(' · ', b.board_type, b.revision, b.notes)
           FROM boards b
           WHERE b.review_status = 'approved'
             AND position(lower($1) in lower(b.board_identifier_normalized)) > 0
           UNION ALL
           SELECT 'component', c.id::text, coalesce(c.part_number_original, c.marking, 'Bauteil'),
                  concat_ws(' · ', c.marking, c.component_type, c.description)
           FROM components c
           WHERE c.review_status = 'approved'
             AND (
               position(lower($1) in lower(coalesce(c.part_number_normalized, ''))) > 0
               OR position(lower($1) in lower(coalesce(c.marking, ''))) > 0
             )
           UNION ALL
           SELECT 'repair', rc.id::text, rc.title,
                  concat_ws(' · ', rc.fault_code, rc.symptoms, rc.diagnosis)
           FROM repair_cases rc
           WHERE rc.review_status = 'approved'
             AND (
               position(lower($1) in lower(coalesce(rc.fault_code, ''))) > 0
               OR position(lower($1) in lower(coalesce(rc.symptoms, ''))) > 0
               OR position(lower($1) in lower(rc.title)) > 0
             )
         ) AS matches
         ORDER BY CASE WHEN lower(label) = lower($1) THEN 0 ELSE 1 END, label
         LIMIT 30`,
        [term]
      );
      results = result.rows;
      status = results.length ? `${results.length} Treffer` : "Noch keine passenden Einträge. Die Datenbank ist am Anfang noch leer.";
    } catch {
      status = "Die Datenbank ist noch nicht initialisiert. Bitte später erneut versuchen.";
    }
  }

  return <main className="shell page">
    <header className="topbar"><Link className="brand" href="/">OpenRepair<span>DB</span></Link><Link href="/">← Startseite</Link></header>
    <p className="eyebrow">WISSENSDATENBANK</p>
    <h1 className="pageTitle">Suche</h1>
    <form className="search" action="/search"><input name="q" defaultValue={q} placeholder="Modell, Platine, Bauteil oder Fehlercode …" /><button type="submit">Suchen →</button></form>
    <p className="status">{status}</p>
    {results.map((item) => <Link className="result" style={{display:"block",color:"inherit",textDecoration:"none"}} href={entryHref(item.kind, item.id, item.label)} key={`${item.kind}-${item.id}`}><span>{({device:"Gerät / Maschine",board:"Platine",component:"Bauteil",repair:"Reparaturfall"} as const)[item.kind]} · {({device:"DEV",board:"BRD",component:"CMP",repair:"REP"} as const)[item.kind]}-{item.id.padStart(6,"0")}</span><h2>{item.label}</h2><p>{item.detail}</p><p style={{marginTop:12}}>Details ansehen →</p></Link>)}
  </main>;
}
