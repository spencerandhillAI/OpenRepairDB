import Link from "next/link";
import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { entryHref, kindNames, publicId, type EntryKind } from "@/lib/entries";

export const dynamic = "force-dynamic";

const categories = {
  devices: { title: "Geräte / Maschinen", description: "Die zuletzt hinzugefügten Geräte und Maschinen." },
  parts: { title: "Platinen & Bauteile", description: "Die neuesten Platinen und elektronischen Bauteile." },
  repairs: { title: "Reparaturwissen", description: "Die zuletzt hinzugefügten Reparaturfälle." },
} as const;
type Category = keyof typeof categories;
type Item = { kind: EntryKind; id: string; label: string; detail: string; created_at: Date };

const queries: Record<Category,string> = {
  devices: `
    SELECT 'device'::text AS kind, d.id::text AS id, d.canonical_model_name AS label,
      concat_ws(' · ', m.name, d.product_category, d.description) AS detail, d.created_at
    FROM devices d LEFT JOIN manufacturers m ON m.id=d.manufacturer_id
    WHERE d.review_status='approved'
    ORDER BY d.created_at DESC, d.id DESC LIMIT 30`,
  parts: `
    SELECT * FROM (
      SELECT 'board'::text AS kind, b.id::text AS id, b.board_identifier_original AS label,
        concat_ws(' · ', m.name, b.board_type, b.revision) AS detail, b.created_at
      FROM boards b LEFT JOIN manufacturers m ON m.id=b.manufacturer_id
      WHERE b.review_status='approved'
      UNION ALL
      SELECT 'component'::text AS kind, c.id::text AS id,
        coalesce(c.part_number_original,c.marking,'Bauteil') AS label,
        concat_ws(' · ', m.name, c.component_type, c.marking) AS detail, c.created_at
      FROM components c LEFT JOIN manufacturers m ON m.id=c.manufacturer_id
      WHERE c.review_status='approved'
    ) entries ORDER BY created_at DESC, kind, id DESC LIMIT 30`,
  repairs: `
    SELECT 'repair'::text AS kind, r.id::text AS id, r.title AS label,
      concat_ws(' · ', r.fault_code, r.symptoms) AS detail, r.created_at
    FROM repair_cases r WHERE r.review_status='approved'
    ORDER BY r.created_at DESC, r.id DESC LIMIT 30`,
};

export default async function CategoryPage({params}:{params:Promise<{category:string}>}) {
  const {category} = await params;
  if (!(category in categories)) notFound();
  const selected = category as Category;
  let items: Item[] = [];
  let error = false;
  try {
    const result = await pool.query<Item>(queries[selected]);
    items = result.rows;
  } catch (e) {
    console.error("Category listing failed:", e);
    error = true;
  }
  return <main className="shell page">
    <header className="topbar"><Link className="brand" href="/">OpenRepair<span>DB</span></Link><Link href="/">← Startseite</Link></header>
    <p className="eyebrow">WISSENSDATENBANK · NEUESTE EINTRÄGE</p>
    <h1 className="pageTitle">{categories[selected].title}</h1>
    <p className="status">{categories[selected].description}</p>
    {error ? <p className="status">Die Einträge konnten momentan nicht geladen werden. Bitte später erneut versuchen.</p> :
      items.length === 0 ? <p className="status">In dieser Kategorie sind noch keine freigegebenen Einträge vorhanden.</p> :
      <>
        <p className="status">{items.length} neueste Einträge</p>
        {items.map(item=><Link key={item.kind+"-"+item.id} className="result" style={{display:"block",color:"inherit",textDecoration:"none"}} href={entryHref(item.kind,item.id,item.label)}>
          <span>{kindNames[item.kind]} · {publicId(item.kind,item.id)}</span>
          <h2>{item.label}</h2>
          {item.detail && <p>{item.detail}</p>}
          <p style={{marginTop:12}}>Details ansehen →</p>
        </Link>)}
      </>
    }
  </main>;
}
