"use client";
import {useState} from "react";
type Kind="device"|"board"|"component"|"repair";
type Mode="create"|"enrich";
type Match={id:string;name:string};
type Reply={error?:string;data?:unknown;matches?:Match[];warning?:string;notice?:string;saved?:boolean;id?:string;kind?:Kind;mode?:Mode};
const labels:Record<Kind,string>={device:"Gerät",board:"Platine",component:"Bauteil",repair:"Reparaturanleitung / Reparaturfall"};
const prefixes:Record<Kind,string>={device:"DEV",board:"BRD",component:"CMP",repair:"REP"};
export default function AdminImportPage(){
 const [password,setPassword]=useState("");
 const [kind,setKind]=useState<Kind>("device");
 const [mode,setMode]=useState<Mode|null>(null);
 const [json,setJson]=useState("");
 const [url,setUrl]=useState("");
 const [result,setResult]=useState<Reply|null>(null);
 const [busy,setBusy]=useState(false);
 const [approved,setApproved]=useState(false);
 const [previewed,setPreviewed]=useState(false);
 const reset=()=>{setResult(null);setMode(null);setApproved(false);setPreviewed(false);};
 async function call(action:"fetch"|"preview"|"save"){
  setBusy(true);
  try{
   const data=action==="fetch"?undefined:JSON.parse(json);
   const response=await fetch("/api/admin/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,action,kind,mode,url,data,confirm:action==="save"&&approved})});
   const reply:Reply=await response.json();setResult(reply);
   if(action==="fetch"){if(reply.data)setJson(JSON.stringify(reply.data,null,2));setMode(null);setPreviewed(false);setApproved(false);}
   if(action==="preview"){setPreviewed(!!reply.matches);setMode(null);setApproved(false);}
   if(action==="save"){setPreviewed(false);setApproved(false);}
  }catch(e){setResult({error:e instanceof Error?e.message:"Fehler"});setPreviewed(false);}finally{setBusy(false);}
 }
 const matches=result?.matches||[];
 const eligible=previewed&&(mode==="create"?matches.length===0:mode==="enrich"&&matches.length===1);
 return <main className="shell page">
  <header className="topbar"><a className="brand" href="/">OpenRepair<span>DB</span></a><a href="/">← Startseite</a></header>
  <p className="eyebrow">ADMINISTRATION · DATENIMPORT</p><h1 className="pageTitle">Datensätze importieren</h1>
  <p className="status">Administrator-Importschlüssel erforderlich. Neue und ergänzte Datensätze werden zur Prüfung vorgemerkt. Vorhandene Werte werden bei Ergänzungen nicht überschrieben.</p>
  <div className="importForm">
   <label>Was möchtest du importieren?
    <select value={kind} onChange={e=>{setKind(e.target.value as Kind);reset();}}>
     {Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
   </label>
   <label>Administrator-Importschlüssel<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label>HTTPS-Quelladresse (freigegebene Domains)<input type="url" placeholder="https://docs.arduino.cc/..." value={url} onChange={e=>{setUrl(e.target.value);reset();}}/></label>
   <button disabled={busy||!password||!url} onClick={()=>call("fetch")}>URL auslesen</button>
   <label>Strukturierte Daten (JSON)<textarea rows={18} spellCheck={false} value={json} onChange={e=>{setJson(e.target.value);reset();}} placeholder={JSON.stringify({manufacturer:"Arduino",model:"Arduino UNO R3",overview:"...",sourceUrl:"https://docs.arduino.cc/hardware/uno-rev3"},null,2)}/></label>
   <p>Pflichtfelder: Bezeichnung, Hersteller (außer bei Reparaturen), HTTPS-Quellenadresse. Bei Reparaturen zusätzlich Symptome oder Maßnahmen. Die HTML-Erkennung kann den Hersteller nicht immer bestimmen – bitte selbst ergänzen.</p>
   <button disabled={busy||!password||!json} onClick={()=>call("preview")}>Prüfen und Dubletten anzeigen</button>
   {previewed&&<section><h2>Dublettenprüfung: {labels[kind]}</h2>
    {matches.length===0?<p>Kein passender Datensatz gefunden.</p>:matches.map(x=><p key={x.id}>{prefixes[kind]}-{String(x.id).padStart(6,"0")} · {x.name}</p>)}
    {result?.warning&&<p role="status">{result.warning}</p>}
    <label className="importConfirm"><input type="checkbox" checked={mode==="enrich"} disabled={matches.length!==1} onChange={e=>{setMode(e.target.checked?"enrich":null);setApproved(false);}}/> Vorhandenen Datensatz ergänzen</label>
    <label className="importConfirm"><input type="checkbox" checked={mode==="create"} disabled={matches.length!==0} onChange={e=>{setMode(e.target.checked?"create":null);setApproved(false);}}/> Neuen Datensatz anlegen</label>
   </section>}
   {result?.notice&&<p>{result.notice}</p>}
   {result?.error&&<p role="alert">{result.error}</p>}
   {result?.saved&&<p role="status">Gespeichert: {prefixes[result.kind||kind]}-{String(result.id).padStart(6,"0")} ({result.mode==="create"?"neu angelegt":"ergänzt"}). Prüfstatus: pending.</p>}
   <label className="importConfirm"><input type="checkbox" checked={approved} disabled={!eligible} onChange={e=>setApproved(e.target.checked)}/> Ich habe die Quelle, technischen Angaben und Dublettenprüfung kontrolliert. Import bestätigen.</label>
   <button disabled={busy||!password||!json||!eligible||!approved} onClick={()=>call("save")}>{mode==="enrich"?"Vorhandenen Datensatz ergänzen":"Neuen Datensatz anlegen"}</button>
  </div>
 </main>;
}
