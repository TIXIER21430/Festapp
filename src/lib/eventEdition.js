// Build a new annual edition without altering the source event or its task history.
export function planNextEdition(events,tasks,sourceId,year){
 if(!Array.isArray(events)||!Array.isArray(tasks)||typeof sourceId!=="string"||!/^(20\d{2})$/.test(String(year)))throw new TypeError("Édition invalide");
 const source=events.find(e=>e?.id===sourceId);
 if(!source||!Array.isArray(source.values)||typeof source.values[0]!=="string")throw new Error("Manifestation introuvable");
 const baseName=source.values[0].trim().replace(/\s+20\d{2}$/,"");
 const name=baseName+" "+year;
 if(events.some(e=>String(e?.values?.[0]||"").trim().toLocaleLowerCase("fr")===name.toLocaleLowerCase("fr")))throw new Error("Cette édition existe déjà");
 const sourceTasks=tasks.filter(t=>t?.eventId===sourceId&&Array.isArray(t.values));
 return {eventValues:[name,"",source.values[2]||""],tasks:sourceTasks.map(t=>({values:[String(t.values[0]||""),"",String(t.phase?"":t.values[2]||"")],...(typeof t.phase==="string"?{phase:t.phase}:{}),done:false}))};
}
