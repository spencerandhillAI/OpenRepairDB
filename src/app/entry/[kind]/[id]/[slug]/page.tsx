import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { entryHref, kindNames, kinds, publicId, type EntryKind } from "@/lib/entries";
import { getDeviceGuide } from "@/lib/device-guides";

type Props = { params: Promise<{ kind:string; id:string; slug:string }> };
type Row = Record<string, unknown>;
function val(v: unknown) { return typeof v === "string" || typeof v === "number" ? String(v) : ""; }
function Detail({label,value}:{label:string;value:unknown}) {
  if (!val(value)) return null;
  return <section style={{marginBottom:22}}><h2 style={{fontSize:"1rem",opacity:.7}}>{label}</h2><p style={{whiteSpace:"pre-wrap"}}>{val(value)}</p></section>;
}
export default async function EntryPage({params}:Props) {
  const {kind:rawKind,id,slug} = await params;
  if (!kinds.includes(rawKind as EntryKind) || !/^[1-9]\d{0,17}$/.test(id)) notFound();
  const kind = rawKind as EntryKind;
  const sql:Record<EntryKind,string> = {
    device: `SELECT d.*,m.name AS manufacturer FROM devices d LEFT JOIN manufacturers m ON m.id=d.manufacturer_id WHERE d.id=$1 AND d.review_status='approved'`,
    board: `SELECT b.*,m.name AS manufacturer FROM boards b LEFT JOIN manufacturers m ON m.id=b.manufacturer_id WHERE b.id=$1 AND b.review_status='approved'`,
    component: `SELECT c.*,m.name AS manufacturer,s.canonical_url AS datasheet_url FROM components c LEFT JOIN manufacturers m ON m.id=c.manufacturer_id LEFT JOIN sources s ON s.id=c.datasheet_source_id WHERE c.id=$1 AND c.review_status='approved'`,
    repair: `SELECT r.*,s.source_name,s.canonical_url,s.licence_id,s.licence_url,s.attribution_text FROM repair_cases r LEFT JOIN sources s ON s.id=r.source_id WHERE r.id=$1 AND r.review_status='approved'`,
  };
  const result = await pool.query(sql[kind],[id]);
  if (!result.rows.length) notFound();
  const r:Row = result.rows[0];
  const title = kind==="device" ? val(r.canonical_model_name) : kind==="board" ? val(r.board_identifier_original) : kind==="component" ? (val(r.part_number_original)||val(r.marking)||"Bauteil") : val(r.title);
  const guide = kind==="device" ? getDeviceGuide(r.canonical_model_name) : null;
  const canonical = entryHref(kind,id,title);
  if (slug !== canonical.split("/").at(-1)) redirect(canonical);
  const links:{href:string;label:string}[]=[];
  if (kind==="device") {
    const connected = await pool.query(`SELECT b.id,b.board_identifier_original AS label FROM device_boards db JOIN boards b ON b.id=db.board_id WHERE db.device_id=$1 AND db.review_status='approved' AND b.review_status='approved' LIMIT 50`,[id]);
    for(const x of connected.rows) links.push({href:entryHref("board",x.id,x.label),label:`Platine: ${x.label}`});
    const repairs = await pool.query(`SELECT id,title FROM repair_cases WHERE device_id=$1 AND review_status='approved' LIMIT 50`,[id]);
    for(const x of repairs.rows) links.push({href:entryHref("repair",x.id,x.title),label:`Reparaturfall: ${x.title}`});
  }
  if (kind==="board") {
    const connected = await pool.query(`SELECT c.id,coalesce(c.part_number_original,c.marking,'Bauteil') AS label FROM board_components bc JOIN components c ON c.id=bc.component_id WHERE bc.board_id=$1 AND bc.review_status='approved' AND c.review_status='approved' LIMIT 50`,[id]);
    for(const x of connected.rows) links.push({href:entryHref("component",x.id,x.label),label:`Bauteil: ${x.label}`});
    const repairs = await pool.query(`SELECT id,title FROM repair_cases WHERE board_id=$1 AND review_status='approved' LIMIT 50`,[id]);
    for(const x of repairs.rows) links.push({href:entryHref("repair",x.id,x.title),label:`Reparaturfall: ${x.title}`});
  }
  if (kind==="repair") {
    if(r.device_id) {const d=await pool.query("SELECT id,canonical_model_name FROM devices WHERE id=$1 AND review_status='approved'",[r.device_id]);if(d.rows[0]) links.push({href:entryHref("device",d.rows[0].id,d.rows[0].canonical_model_name),label:`Gerät: ${d.rows[0].canonical_model_name}`});}
    if(r.board_id) {const b=await pool.query("SELECT id,board_identifier_original FROM boards WHERE id=$1 AND review_status='approved'",[r.board_id]);if(b.rows[0]) links.push({href:entryHref("board",b.rows[0].id,b.rows[0].board_identifier_original),label:`Platine: ${b.rows[0].board_identifier_original}`});}
  }
  const source = val(r.canonical_url);
  const safeSource = /^https?:\/\//i.test(source) ? source : "";
  const licenceUrl=val(r.licence_url);
  const safeLicence=/^https?:\/\//i.test(licenceUrl)?licenceUrl:"";
  return <main className="shell page">
    <header className="topbar"><Link className="brand" href="/">OpenRepair<span>DB</span></Link><Link href="/search">← Suche</Link></header>
    <p className="eyebrow">{kindNames[kind]} · {publicId(kind,id)}</p>
    <h1 className="pageTitle">{title}</h1>
    <p className="status">Kurzname: {slug} · Kennung: {publicId(kind,id)}</p>
    {kind==="device" && <><Detail label="Hersteller" value={r.manufacturer}/><Detail label="Kategorie" value={r.product_category}/><Detail label="Beschreibung" value={r.description}/></>}
    {kind==="device" && guide && <section className="technicalGuide">
      <h2>Was ist das?</h2><p>{guide.overview}</p>
      <h2>Was kann das Gerät?</h2><ul>{guide.capabilities.map(x=><li key={x}>{x}</li>)}</ul>
      <h2>Technische Daten</h2><dl className="techSpecs">{guide.specifications.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      <h2>Pinbelegung und Anschlüsse</h2><p>Die folgende Übersicht fasst die wichtigsten Pin-Gruppen zusammen. Maßgeblich ist das vollständige Pinout des Herstellers.</p>
      {guide.pinGroups.map(group=><section className="pinGroup" key={group.name}><h3>{group.name}</h3><strong>{group.pins}</strong><p>{group.description}</p></section>)}
      <h2>Hinweise für Prüfung und Reparatur</h2><ul>{guide.safety.map(x=><li key={x}>{x}</li>)}</ul>
      <h2>Weiterführende Dokumentation</h2><ul>{guide.links.map(x=><li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗</a></li>)}</ul>
      <p className="status">Technische Angaben aus offizieller Arduino-Dokumentation. Pinout und Schaltplan werden verlinkt, nicht als eigene Zeichnungen ausgegeben.</p>
    </section>}
    {kind==="board" && <><Detail label="Hersteller" value={r.manufacturer}/><Detail label="Platinenkennung" value={r.board_identifier_original}/><Detail label="Typ" value={r.board_type}/><Detail label="Revision" value={r.revision}/><Detail label="Notizen" value={r.notes}/></>}
    {kind==="component" && <><Detail label="Hersteller" value={r.manufacturer}/><Detail label="Teilenummer" value={r.part_number_original}/><Detail label="Markierung" value={r.marking}/><Detail label="Bauteiltyp" value={r.component_type}/><Detail label="Beschreibung" value={r.description}/></>}
    {kind==="repair" && <><Detail label="Fehlerbild / Symptome" value={r.symptoms}/><Detail label="Fehlercode" value={r.fault_code}/><Detail label="Diagnose" value={r.diagnosis}/><Detail label="Reparaturmaßnahmen" value={r.repair_actions}/><Detail label="Verwendete Teile" value={r.parts_used}/><Detail label="Werkzeuge" value={r.tools_used}/><Detail label="Ergebnis" value={r.outcome}/><Detail label="Sicherheitshinweise" value={r.safety_notes}/><Detail label="Verifizierungsstatus" value={r.verification_status}/></>}
    {links.length>0 && <section style={{marginTop:32}}><h2>Verknüpfte Einträge</h2>{links.map(x=><p key={x.href}><Link href={x.href}>{x.label} →</Link></p>)}</section>}
    {(safeSource || val(r.source_name)) && <section style={{marginTop:32}}><h2>Quelle und Lizenz</h2><p>{val(r.source_name)}</p>{safeSource && <p><a href={safeSource} target="_blank" rel="noopener noreferrer">Originalquelle öffnen ↗</a></p>}<p>{val(r.attribution_text)}</p>{safeLicence ? <p><a href={safeLicence} target="_blank" rel="noopener noreferrer">{val(r.licence_id)} ↗</a></p> : <Detail label="Lizenz" value={r.licence_id}/>}</section>}
    {kind==="component" && /^https?:\/\//i.test(val(r.datasheet_url)) && <p><a href={val(r.datasheet_url)} target="_blank" rel="noopener noreferrer">Datenblatt öffnen ↗</a></p>}
    <p style={{marginTop:36}}><Link href="/search">← Zurück zur Suche</Link></p>
  </main>;
}
