export function checklistProgress(tasks,eventId,phases){
 if(!Array.isArray(tasks)||typeof eventId!=="string"||!Array.isArray(phases))throw new TypeError("Invalid checklist");
 return phases.map(phase=>{
  const rows=tasks.filter(r=>r?.eventId===eventId&&r.values?.[2]===phase);
  const done=rows.filter(r=>r.done===true).length;
  return {phase,rows,total:rows.length,done,remaining:rows.length-done};
 });
}
