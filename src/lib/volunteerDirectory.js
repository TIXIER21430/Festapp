// Local demo contact picker: only explicitly categorized volunteers.
// No contact phone/email is exposed in shift selection.
export function volunteerChoices(contacts){
 const seen=new Set();
 return (Array.isArray(contacts)?contacts:[]).filter(row=>{
  if(!row||!Array.isArray(row.values))return false;
  const name=String(row.values[0]||"").trim();
  const category=String(row.values[1]||"").trim().normalize("NFC").toLocaleLowerCase("fr");
  if(!name||category!=="bénévole")return false;
  const key=name.normalize("NFC").toLocaleLowerCase("fr");
  if(seen.has(key))return false;
  seen.add(key);
  return true;
 }).map(row=>({id:row.id,name:row.values[0].trim()})).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
}
