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
