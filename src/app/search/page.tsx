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
        `WITH matches AS (
           SELECT 'device'::text AS kind, d.id::text AS id, d.canonical_model_name AS label,
             concat_ws(' · ', m.name, d.product_category, d.description) AS detail,
             greatest(
               CASE WHEN lower(d.canonical_model_name)=lower($1) THEN 120 ELSE 0 END,
               CASE WHEN lower(d.canonical_model_name) LIKE '%' || lower($1) || '%' THEN 65 ELSE 0 END,
               CASE WHEN lower(coalesce(d.product_category,'')) LIKE '%' || lower($1) || '%' THEN 18 ELSE 0 END,
               CASE WHEN lower(coalesce(d.description,'')) LIKE '%' || lower($1) || '%' THEN 8 ELSE 0 END,
               coalesce((SELECT max(CASE
                 WHEN lower(di.value_normalized)=lower($1) THEN 150
                 WHEN lower(di.value_normalized) LIKE '%' || lower($1) || '%' THEN 95
                 ELSE 0 END)
                 FROM device_identifiers di WHERE di.device_id=d.id),0)
             ) AS relevance
           FROM devices d LEFT JOIN manufacturers m ON m.id=d.manufacturer_id
           WHERE d.review_status='approved'
           UNION ALL
           SELECT 'board', b.id::text, b.board_identifier_original,
             concat_ws(' · ', b.board_type, b.revision, b.notes),
             greatest(
               CASE WHEN lower(b.board_identifier_normalized)=lower($1) THEN 150 ELSE 0 END,
               CASE WHEN lower(b.board_identifier_normalized) LIKE '%' || lower($1) || '%' THEN 95 ELSE 0 END,
               CASE WHEN lower(coalesce(b.board_type,'')) LIKE '%' || lower($1) || '%' THEN 20 ELSE 0 END,
               CASE WHEN lower(coalesce(b.revision,'')) LIKE '%' || lower($1) || '%' THEN 15 ELSE 0 END,
               CASE WHEN lower(coalesce(b.notes,'')) LIKE '%' || lower($1) || '%' THEN 8 ELSE 0 END
             )
           FROM boards b WHERE b.review_status='approved'
           UNION ALL
           SELECT 'component', c.id::text, coalesce(c.part_number_original,c.marking,'Bauteil'),
             concat_ws(' · ', c.marking,c.component_type,c.description),
             greatest(
               CASE WHEN lower(coalesce(c.part_number_normalized,''))=lower($1) THEN 150 ELSE 0 END,
               CASE WHEN lower(coalesce(c.part_number_normalized,'')) LIKE '%' || lower($1) || '%' THEN 95 ELSE 0 END,
               CASE WHEN lower(coalesce(c.marking,''))=lower($1) THEN 110 ELSE 0 END,
               CASE WHEN lower(coalesce(c.marking,'')) LIKE '%' || lower($1) || '%' THEN 70 ELSE 0 END,
               CASE WHEN lower(coalesce(c.component_type,'')) LIKE '%' || lower($1) || '%' THEN 18 ELSE 0 END,
               CASE WHEN lower(coalesce(c.description,'')) LIKE '%' || lower($1) || '%' THEN 8 ELSE 0 END
             )
           FROM components c WHERE c.review_status='approved'
           UNION ALL
           SELECT 'repair', rc.id::text, rc.title,
             concat_ws(' · ', rc.fault_code,rc.symptoms,rc.diagnosis),
             greatest(
               CASE WHEN lower(coalesce(rc.fault_code,''))=lower($1) THEN 130 ELSE 0 END,
               CASE WHEN lower(coalesce(rc.fault_code,'')) LIKE '%' || lower($1) || '%' THEN 85 ELSE 0 END,
               CASE WHEN lower(rc.title)=lower($1) THEN 110 ELSE 0 END,
               CASE WHEN lower(rc.title) LIKE '%' || lower($1) || '%' THEN 55 ELSE 0 END,
               CASE WHEN lower(coalesce(rc.symptoms,'')) LIKE '%' || lower($1) || '%' THEN 25 ELSE 0 END,
               CASE WHEN lower(coalesce(rc.diagnosis,'')) LIKE '%' || lower($1) || '%' THEN 12 ELSE 0 END
             )
           FROM repair_cases rc WHERE rc.review_status='approved'
         )
         SELECT kind,id,label,detail
         FROM matches
         WHERE relevance>0
         ORDER BY relevance DESC, lower(label), kind, id
         LIMIT 30`,
        [term]
      );
      results = result.rows;
      status = results.length ? `${results.length} Treffer` : "Noch keine passenden Einträge. Die Datenbank ist am Anfang noch leer.";
    } catch {
      status = "Die Suche ist momentan nicht verfügbar. Bitte später erneut versuchen.";
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
