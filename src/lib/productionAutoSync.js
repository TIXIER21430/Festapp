// A confirmed baseline distinguishes a stale cache from unsent edits.
// Never choose a winner automatically if both copies have changed.
export function decideProductionSync({localText,remoteText,remoteRevision,baseline,pristine=false,remoteHasRecords=false}){
 if(typeof localText!=='string'||typeof remoteText!=='string')return 'conflict';
 if(localText===remoteText)return 'same';
 if(baseline&&typeof baseline.text==='string'&&baseline.revision!=null){
  if(localText===baseline.text)return 'receive';
  if(String(remoteRevision)===String(baseline.revision)&&remoteText===baseline.text)return 'send';
  return 'conflict';
 }
 return pristine&&remoteHasRecords?'receive':'conflict';
}
export function readProductionBaseline(storage,key){
 try{
  const value=JSON.parse(storage.getItem(key)||'null');
  return value&&typeof value.text==='string'&&/^[1-9][0-9]*$/.test(String(value.revision))?value:null;
 }catch{return null;}
}
export function rememberProductionBaseline(storage,key,baseline){
 try{storage.setItem(key,JSON.stringify(baseline));return true;}catch{return false;}
}

// A missing browser baseline can be recovered only from an exact, server-confirmed
// historical snapshot. Never use this path for a known baseline or unsent edits.
export async function recoverUnknownBaseline({decision,baseline,localPayload,verifyPrevious}){
 if(decision!=='conflict'||baseline||!localPayload||typeof verifyPrevious!=='function')return decision;
 try{return await verifyPrevious(localPayload)===true?'receive':decision;}catch{return decision;}
}
