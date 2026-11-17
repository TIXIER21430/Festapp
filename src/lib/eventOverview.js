// Demo-only event overview. A record is linked only when an explicit field
// exactly matches the event name; ambiguous free text is never inferred.
const MODULES=["tasks","shopping","stock","shifts","feedback","finance"];
export function eventOverview(data,eventName){
 if(typeof eventName!=="string"||!eventName.trim())throw new TypeError("Invalid event");
 const normalized=eventName.trim().normalize("NFC").toLocaleLowerCase("fr");
 const result={eventName,counts:{},records:{},unassigned:{}};
 for(const module of MODULES){
  const rows=Array.isArray(data?.[module])?data[module]:[];
  const matches=[],unassigned=[];
  for(const row of rows){
   if(!row||!Array.isArray(row.values))continue;
   const values=row.values.filter(v=>typeof v==="string").map(v=>v.trim().normalize("NFC").toLocaleLowerCase("fr"));
   if(values.includes(normalized))matches.push(row);
   else unassigned.push(row);
  }
  result.records[module]=matches;
  result.counts[module]=matches.length;
  result.unassigned[module]=unassigned.length;
 }
 return result;
}
