// Safe, idempotent append for the private Drive snapshot. No remote write or overwrite.
import {validateDemoData} from './demoBackup.js';

export function mergeDriveSeed(current, incoming) {
  const existing=validateDemoData(current);
  const additions=validateDemoData(incoming);
  const next={...existing};
  let added=0;
  for(const [category,rows] of Object.entries(additions)) {
    const present=new Set((next[category]||[]).map(row=>row.id));
    const missing=rows.filter(row=>!present.has(row.id));
    if((next[category]||[]).length+missing.length>10000)throw new RangeError('Trop de fiches dans '+category);
    next[category]=[...(next[category]||[]),...missing];
    added+=missing.length;
  }
  return {data:next,added};
}
