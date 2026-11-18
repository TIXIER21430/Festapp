// Preview only: never writes storage, never contacts Supabase.
// Replacements must remain an explicit, separately confirmed user action.
import {parseDemoBackup,validateDemoData} from "./demoBackup.js";
export function previewRestoreImpact(json,current){
 const incoming=parseDemoBackup(json);
 const existing=validateDemoData(current);
 const categories=Object.keys(incoming).sort().map(category=>{
  const oldRows=existing[category]||[];
  const newRows=incoming[category];
  const oldIds=new Set(oldRows.map(row=>row.id));
  const newIds=new Set(newRows.map(row=>row.id));
  return {category,current:oldRows.length,incoming:newRows.length,
   matchingIds:newRows.filter(row=>oldIds.has(row.id)).length,
   wouldRemove:oldRows.filter(row=>!newIds.has(row.id)).length,
   wouldAdd:newRows.filter(row=>!oldIds.has(row.id)).length};
 });
 return {categories,existingCategoriesNotInBackup:Object.keys(existing).filter(key=>!Object.hasOwn(incoming,key)).sort(),
  requiresConfirmation:categories.some(row=>row.wouldRemove>0||row.matchingIds>0)};
}
