"use client";
import {useState} from "react";
type Kind="device"|"board"|"component"|"repair";
type Mode="create"|"enrich";
type Match={id:string;name:string};
type Reply={manufacturers?:string[];error?:string;data?:unknown;matches?:Match[];suggestions?:{id:string;name:string;manufacturer?:string;score:number}[];warning?:string;notice?:string;saved?:boolean;id?:string;kind?:Kind;mode?:Mode};
const labels:Record<Kind,string>={device:"Gerät",board:"Platine",component:"Bauteil",repair:"Reparaturanleitung / Reparaturfall"};
const starterManufacturers:Record<Exclude<Kind,"repair">,string[]>={
 device:["Acer","Apple","Arduino","ASUS","Bosch","Dell","Dyson","HP","Lenovo","LG","Microsoft","Nintendo","Panasonic","Philips","Samsung","Siemens","Sony","Whirlpool"],
 board:["Arduino","ASRock","ASUS","Espressif","Gigabyte","MSI","Raspberry Pi","Seeed Studio","STMicroelectronics","Texas Instruments"],
 component:["Analog Devices","Broadcom","Infineon","Intel","Microchip Technology","Murata","Nexperia","NXP Semiconductors","onsemi","Renesas","ROHM","Samsung","STMicroelectronics","Texas Instruments","Vishay"]
};
const prefixes:Record<Kind,string>={device:"DEV",board:"BRD",component:"CMP",repair:"REP"};
export default function AdminImportPage(){
 const [password,setPassword]=useState("");
 const [kind,setKind]=useState<Kind>("device");
 const [mode,setMode]=useState<Mode|null>(null);
 const [selectedId,setSelectedId]=useState<string>("");
 const [json,setJson]=useState("");
 const [manufacturer,setManufacturer]=useState("");
 const [knownManufacturers,setKnownManufacturers]=useState<string[]>([]);
 const [manufacturerNotice,setManufacturerNotice]=useState("");
 const [manufacturerOpen,setManufacturerOpen]=useState(false);
 const [url,setUrl]=useState("");
 const [result,setResult]=useState<Reply|null>(null);
 const [busy,setBusy]=useState(false);
 const [approved,setApproved]=useState(false);
 const [previewed,setPreviewed]=useState(false);
 const reset=()=>{setResult(null);setMode(null);setSelectedId("");setApproved(false);setPreviewed(false);};
 async function loadManufacturers(){
  if(!password){setManufacturerNotice("Bitte zuerst den Administrator-Importschlüssel eingeben.");return;}
  try{
   const response=await fetch("/api/admin/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,action:"manufacturers"})});
   const reply:Reply=await response.json();
   if(!response.ok)throw Error(reply.error||"Hersteller konnten nicht geladen werden.");
   setKnownManufacturers(reply.manufacturers||[]);setManufacturerNotice("");
  }catch(e){setManufacturerNotice(e instanceof Error?e.message:"Hersteller konnten nicht geladen werden.");}
 }
 async function call(action:"fetch"|"preview"|"save"){
  setBusy(true);
  try{
   const data=action==="fetch"?undefined:JSON.parse(json);
   const response=await fetch("/api/admin/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password,action,kind,mode,selectedId,url,data,manufacturer:kind==="repair"?"":manufacturer,confirm:action==="save"&&approved})});
   const reply:Reply=await response.json();setResult(reply);
   if(action==="fetch"){if(reply.data){
    setJson(JSON.stringify(reply.data,null,2));
    const extracted=reply.data as Record<string,unknown>;
    if(kind!=="repair"&&typeof extracted.manufacturer==="string"&&extracted.manufacturer.trim())setManufacturer(extracted.manufacturer.trim());
   }setMode(null);setSelectedId("");setPreviewed(false);setApproved(false);}
   if(action==="preview"){setPreviewed(!!reply.matches);setSelectedId(reply.matches?.length===1?String(reply.matches[0].id):"");setMode(null);setApproved(false);}
   if(action==="save"){setPreviewed(false);setApproved(false);}
  }catch(e){setResult({error:e instanceof Error?e.message:"Fehler"});setPreviewed(false);}finally{setBusy(false);}
 }
 const matches=result?.matches||[];
 const manufacturerOptions=kind==="repair"?[]:Array.from(new Map([...starterManufacturers[kind],...knownManufacturers].map(x=>[x.trim().toLocaleLowerCase("de"),x.trim()])).values()).sort((a,b)=>a.localeCompare(b,"de"));
 const filteredManufacturers=manufacturerOptions.filter(x=>x.toLocaleLowerCase("de").includes(manufacturer.trim().toLocaleLowerCase("de"))).slice(0,12);
 const eligible=previewed&&(mode==="create"?matches.length===0:mode==="enrich"&&!!selectedId);
 return <main className="shell page">
  <header className="topbar"><a className="brand" href="/">OpenRepair<span>DB</span></a><a href="/">← Startseite</a></header>
  <p className="eyebrow">ADMINISTRATION · DATENIMPORT</p><h1 className="pageTitle">Datensätze importieren</h1>
  <p className="status">Administrator-Importschlüssel erforderlich. Neue und ergänzte Datensätze werden zur Prüfung vorgemerkt. Vorhandene Werte werden bei Ergänzungen nicht überschrieben.</p>
  <div className="importForm">
   <label>Was möchtest du importieren?
    <select value={kind} onChange={e=>{setKind(e.target.value as Kind);setManufacturer("");setManufacturerOpen(false);reset();}}>
     {Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select>
   </label>
   <label>Administrator-Importschlüssel<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></label>
   {kind!=="repair"&&<div style={{position:"relative"}}>
    <label htmlFor="manufacturer-input">Hersteller</label>
    <input id="manufacturer-input" type="text" role="combobox" aria-autocomplete="list" aria-expanded={manufacturerOpen} aria-controls="manufacturer-suggestions" autoComplete="off" placeholder="Hersteller eingeben, z. B. Arduino" value={manufacturer}
     onFocus={()=>{setManufacturerOpen(true);if(knownManufacturers.length===0)void loadManufacturers();}}
     onBlur={e=>{if(!e.currentTarget.parentElement?.contains(e.relatedTarget as Node))setManufacturerOpen(false);}}
     onKeyDown={e=>{if(e.key==="Escape")setManufacturerOpen(false);if(e.key==="Enter"&&manufacturerOpen&&filteredManufacturers.length){e.preventDefault();setManufacturer(filteredManufacturers[0]);setManufacturerOpen(false);reset();}}}
     onChange={e=>{setManufacturer(e.target.value);setManufacturerOpen(true);reset();}}/>
    {manufacturerOpen&&filteredManufacturers.length>0&&<div id="manufacturer-suggestions" role="listbox" aria-label="Herstellervorschläge" style={{position:"relative",zIndex:10,maxHeight:260,overflowY:"auto",background:"#17251e",border:"1px solid #66806e",borderRadius:10,marginTop:4,boxShadow:"0 8px 24px #0008"}}>
      {filteredManufacturers.map(x=><button key={x} type="button" role="option" aria-selected={manufacturer===x}
       onMouseDown={e=>e.preventDefault()}
       onClick={()=>{setManufacturer(x);setManufacturerOpen(false);reset();}}
       style={{display:"block",width:"100%",textAlign:"left",padding:"12px 16px",background:"transparent",color:"#f1f6f1",border:0,borderBottom:"1px solid #34483d",borderRadius:0,fontSize:"1rem",cursor:"pointer"}}>{x}</button>)}
     </div>}
    <p style={{fontSize:".9rem",opacity:.8,marginTop:6}}>Vorschläge aus Datenbank und Startliste. Freitext ist ebenfalls möglich.</p>
   </div>}
   {manufacturerNotice&&<p role="status">{manufacturerNotice}</p>}
   <label>HTTPS-Quelladresse (freigegebene Domains)<input type="url" placeholder="https://docs.arduino.cc/..." value={url} onChange={e=>{setUrl(e.target.value);reset();}}/></label>
   <button disabled={busy||!password||!url} onClick={()=>call("fetch")}>URL auslesen</button>
   <label>Strukturierte Daten (JSON)<textarea rows={18} spellCheck={false} value={json} onChange={e=>{setJson(e.target.value);reset();}} placeholder={JSON.stringify({manufacturer:"Arduino",model:"Arduino UNO R3",overview:"...",sourceUrl:"https://docs.arduino.cc/hardware/uno-rev3"},null,2)}/></label>
   <p>Pflichtfelder: Bezeichnung, Hersteller (außer bei Reparaturen), HTTPS-Quellenadresse. Bei Reparaturen zusätzlich Symptome oder Maßnahmen. Das Herstellerfeld hat Vorrang vor dem Herstellerwert im JSON.</p>
   <button disabled={busy||!password||!json||(kind!=="repair"&&!manufacturer.trim())} onClick={()=>call("preview")}>Prüfen und Dubletten anzeigen</button>
   {previewed&&<section><h2>Dublettenprüfung: {labels[kind]}</h2>
    {matches.length===0?<p>Kein passender Datensatz gefunden.</p>:matches.map(x=><p key={x.id}>{prefixes[kind]}-{String(x.id).padStart(6,"0")} · {x.name}</p>)}
    {result?.warning&&<p role="status">{result.warning}</p>}
    <h3>Meintest du vielleicht dieses Gerät bzw. diesen Eintrag?</h3>
    <p>Ähnliche Einträge sind Vorschläge, keine bestätigten Dubletten. Bitte Modell und Hardware-Revision vergleichen.</p>
    <div role="radiogroup" aria-label="Vorhandenen Datensatz auswählen">
    {Array.from(new Map([...matches.map(x=>({...x,score:1})),...(result?.suggestions||[])].map(x=>[String(x.id),x])).values()).map(x=>
      <label className="importConfirm" key={x.id}>
       <input type="radio" name="existingEntry" checked={selectedId===String(x.id)} onChange={()=>{setSelectedId(String(x.id));setMode("enrich");setApproved(false);}}/>
       {prefixes[kind]}-{String(x.id).padStart(6,"0")} · {x.name} {x.score<1?"(ähnlicher Treffer)": "(exakter Treffer)"}
      </label>)}
    <label className="importConfirm"><input type="radio" name="existingEntry" checked={mode==="create"} onChange={()=>{setSelectedId("");setMode("create");setApproved(false);}}/> Keines davon – neuen Datensatz anlegen</label>
    </div>
    <label className="importConfirm"><input type="checkbox" checked={mode==="enrich"} disabled={!selectedId} onChange={e=>{setMode(e.target.checked?"enrich":null);setApproved(false);}}/> Vorhandenen Datensatz ergänzen</label>
    <label className="importConfirm"><input type="checkbox" checked={mode==="create"} disabled={matches.length!==0} onChange={e=>{setMode(e.target.checked?"create":null);setApproved(false);}}/> Neuen Datensatz anlegen</label>
   </section>}
   {result?.notice&&<p>{result.notice}</p>}
   {result?.error&&<div role="alert" aria-live="assertive" style={{background:"#4b171d",color:"#fff1f2",border:"2px solid #ef4444",borderRadius:12,padding:"18px 20px",margin:"18px 0",fontWeight:600}}><strong style={{display:"block",fontSize:"1.15rem",marginBottom:8}}>✕ Import fehlgeschlagen</strong><span style={{overflowWrap:"anywhere"}}>{result.error}</span></div>}
   {result?.saved&&<div role="status" aria-live="polite" style={{background:"#123d2a",color:"#e9fff0",border:"2px solid #4ade80",borderRadius:12,padding:"18px 20px",margin:"18px 0"}}><strong style={{display:"block",fontSize:"1.15rem",marginBottom:8}}>✓ Import erfolgreich!</strong><div>Datensatz <strong>{prefixes[result.kind||kind]}-{String(result.id).padStart(6,"0")}</strong> wurde {result.mode==="create"?"neu angelegt":"ergänzt"}.</div><div style={{marginTop:6}}>Prüfstatus: <strong>Ausstehend (pending)</strong></div></div>}
   <label className="importConfirm"><input type="checkbox" checked={approved} disabled={!eligible} onChange={e=>setApproved(e.target.checked)}/> Ich habe die Quelle, technischen Angaben und Dublettenprüfung kontrolliert. Import bestätigen.</label>
   <button disabled={busy||!password||!json||!eligible||!approved} onClick={()=>call("save")}>{mode==="enrich"?"Vorhandenen Datensatz ergänzen":"Neuen Datensatz anlegen"}</button>
  </div>
 </main>;
}
