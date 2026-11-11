/**
 * Read-only preview of the ORA source CSV to verify column semantics.
 * No database access or writes.
 */
const url="https://media.githubusercontent.com/media/openrepair/data/main/OpenRepairData_v0.3_aggregate_202607_eee.csv";
const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
if(!response.ok||!response.body) throw new Error("Download HTTP "+response.status);
const reader=response.body.getReader();
const decoder=new TextDecoder();
let text="";
try {
 while(text.length<8000){
  const {done,value}=await reader.read();
  if(done)break;
  text+=decoder.decode(value,{stream:true});
 }
}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
console.log("ORA CSV raw header and first records (first 5000 chars):");
console.log(text.slice(0,5000));
console.log("No database changes.");
