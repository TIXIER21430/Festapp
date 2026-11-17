import {parseShiftSlot} from "./volunteerPlanning.js";
// Read-only display model. Never changes persisted shifts.
export function volunteerSchedule(rows,eventId){
 const selected=(Array.isArray(rows)?rows:[]).filter(r=>r&&Array.isArray(r.values)&&r.eventId===eventId);
 const valid=[],unscheduled=[];
 for(const row of selected){
  const slot=parseShiftSlot(row.values[1]);
  if(slot)valid.push({id:row.id,name:row.values[0],time:row.values[1],post:row.values[2],start:slot.start,end:slot.end});
  else unscheduled.push({id:row.id,name:row.values[0],time:row.values[1],post:row.values[2]});
 }
 valid.sort((a,b)=>a.start-b.start||a.end-b.end||a.name.localeCompare(b.name,"fr"));
 return {scheduled:valid,unscheduled,total:selected.length};
}
