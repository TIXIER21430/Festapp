// A conservative, local-only planning helper. Expected slot: HH:MM-HH:MM.
// Incomplete or ambiguous slots are not guessed.
export function parseShiftSlot(value){
 if(typeof value!=="string")return null;
 const match=/^\s*([01]\d|2[0-3]):([0-5]\d)\s*[-–]\s*([01]\d|2[0-3]):([0-5]\d)\s*$/.exec(value);
 if(!match)return null;
 const start=Number(match[1])*60+Number(match[2]);
 const end=Number(match[3])*60+Number(match[4]);
 return end>start?{start,end}:null;
}
export function findVolunteerConflicts(rows,candidate,{excludeId=null}={}){
 const name=String(candidate?.values?.[0]||"").trim().toLocaleLowerCase("fr");
 const slot=parseShiftSlot(candidate?.values?.[1]);
 if(!name||!slot)return [];
 return (Array.isArray(rows)?rows:[]).filter(row=>{
  if(!row||row.id===excludeId||!Array.isArray(row.values))return false;
  if(String(row.values[0]||"").trim().toLocaleLowerCase("fr")!==name)return false;
  // Do not infer cross-event clashes when dates are unknown.
  if(!candidate.eventId||!row.eventId||candidate.eventId!==row.eventId)return false;
  const other=parseShiftSlot(row.values[1]);
  return other!==null&&slot.start<other.end&&other.start<slot.end;
 });
}
