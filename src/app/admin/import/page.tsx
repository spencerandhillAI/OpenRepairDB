"use client";
import {useState} from "react";
type Reply={error?:string;data?:unknown;matches?:{id:string;canonical_model_name:string;has_documentation:boolean}[];warning?:string;notice?:string;htmlPreview?:{title:string;description:string;sourceUrl:string};saved?:boolean;deviceId?:string};
export default function AdminImportPage(){
 const [password,setPassword]=useState("");
 const [json,setJson]=useState("");
 const [url,setUrl]=useState("");
 const [result,setResult]=useState<Reply|null>(null);
 const [busy,setBusy]=useState(false);
 const [approved,setApproved]=useState(false);
 async function call(action:"fetch"|"preview"|"save"){
  setBusy(true);setResult(null);
  try{
   const response=await fetch("/api/admin/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,action,url,data:action==="fetch"?undefined:JSON.parse(json),confirm:action==="save"&&approved})});
   const reply:Reply=await response.json();setResult(reply);
   if(reply.data)setJson(JSON.stringify(reply.data,null,2));
   if(action!=="preview")setApproved(false);
  }catch(e){setResult({error:e instanceof Error?e.message:"Fehler"});}finally{setBusy(false);}
 }
 return <main className="shell page">
  <header className="topbar"><a className="brand" href="/">OpenRepair<span>DB</span></a><a href="/">← Startseite</a></header>
  <p className="eyebrow">ADMINISTRATION · DATENIMPORT</p><h1 className="pageTitle">Technische Daten importieren</h1>
  <p className="status">Nur mit Administrator-Importschlüssel. Neue Dokumentation bleibt zunächst zur Prüfung vorgemerkt. Vorhandene Dokumentationen werden niemals automatisch überschrieben.</p>
  <div className="importForm">
   <label>Administrator-Importschlüssel<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label>HTTPS-Quelladresse (derzeit nur freigegebene Domains)<input type="url" placeholder="https://docs.arduino.cc/..." value={url} onChange={e=>setUrl(e.target.value)}/></label>
   <button disabled={busy||!password||!url} onClick={()=>call("fetch")}>URL auslesen</button>
   <label>Strukturierte technische Daten (JSON)<textarea rows={17} spellCheck={false} value={json} onChange={e=>{setJson(e.target.value);setApproved(false);}} placeholder='{"model":"...","overview":"...","sourceUrl":"https://...","specifications":[],"pinGroups":[]}'/></label>
   <button disabled={busy||!password||!json} onClick={()=>call("preview")}>Prüfen und Dubletten anzeigen</button>
   {result?.matches && <section><h2>Dublettenprüfung</h2>{result.matches.length===0?<p>Kein passendes Gerät gefunden. Zuerst einen Gerätedatensatz anlegen.</p>:result.matches.map(x=><p key={x.id}>DEV-{String(x.id).padStart(6,"0")} · {x.canonical_model_name} · {x.has_documentation?"Dokumentation bereits vorhanden":"Noch keine Dokumentation"}</p>)}</section>}
   {result?.warning && <p role="alert">{result.warning}</p>}
   {result?.htmlPreview && <section><h2>Ausgelesene Webseite</h2><p><strong>{result.htmlPreview.title}</strong></p><p>{result.htmlPreview.description}</p><p>Quelle: {result.htmlPreview.sourceUrl}</p></section>}
   {result?.notice && <p>{result.notice}</p>}
   {result?.error && <p role="alert">{result.error}</p>}
   {result?.saved && <p role="status">Gespeichert für Gerät {result.deviceId}; Prüfstatus: pending. Noch nicht öffentlich sichtbar.</p>}
   <label className="importConfirm"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> Ich habe die Quelle, technische Angaben und die Vorschau geprüft. Import ausdrücklich bestätigen.</label>
   <button disabled={busy||!password||!json||!approved||!result?.matches?.length||result.matches.length!==1||result.matches[0].has_documentation} onClick={()=>call("save")}>Dokumentation zur Prüfung speichern</button>
  </div>
 </main>;
}
