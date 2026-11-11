import Link from "next/link";
import { pool } from "@/lib/db";

type SearchParams = Promise<{ q?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  let status = "Gib einen Suchbegriff ein.";
  let results: { kind: string; label: string; detail: string }[] = [];

  if (q.trim()) {
    try {
      const term = q.trim().slice(0, 120);
      const result = await pool.query(
        "SELECT 'Gerät' AS kind, canonical_model_name AS label, COALESCE(description, '') AS detail FROM devices WHERE review_status = 'approved' AND search_text ILIKE $1 ESCAPE '\\\\' LIMIT 20",
        [`%${term.replace(/[\\\\%_]/g, "\\\\$&")}%`]
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
    {results.map((item, index) => <article className="result" key={index}><span>{item.kind}</span><h2>{item.label}</h2><p>{item.detail}</p></article>)}
  </main>;
}
