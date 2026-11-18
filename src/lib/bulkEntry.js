// Offline only. A pasted spreadsheet is previewed before records are appended.
const ENABLED=new Set(['events','tasks','shopping','stock','contacts','feedback','finance','equipment','archives']);
export const BULK_ENTRY_CATEGORIES=ENABLED;
const CONTACT_KINDS=new Set(['bénévole','exposant','groupe','fournisseur','intervenant']);
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('fr');

function splitLine(line,separator){
 let quoted=false,cell='',cells=[];
 for(let i=0;i<line.length;i++){
  const ch=line[i];
  if(ch==='"'){
   if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
  }else if(ch===separator&&!quoted){cells.push(cell.trim());cell='';}
  else cell+=ch;
 }
 if(quoted)throw new TypeError('Guillemet non fermé : copiez une ligne par fiche.');
 cells.push(cell.trim());
 return cells;
}

const signature=(values,eventId)=>JSON.stringify([eventId||'',...values.map(normalize)]);

export function planBulkEntry(text,{category,existing=[],eventId='',fields=[]}={}){
 if(!ENABLED.has(category))throw new TypeError('Cette rubrique ne permet pas la saisie groupée.');
 if(typeof text!=='string'||text.length>150000)throw new TypeError('Le collage dépasse la limite de 150 000 caractères.');
 if(!Array.isArray(existing)||typeof eventId!=='string')throw new TypeError('Données locales invalides.');
 const lines=text.replace(/\r\n?/g,'\n').split('\n').filter(l=>l.trim());
 if(lines.length>500)throw new RangeError('Maximum 500 lignes à la fois.');
 const seen=new Set(existing.filter(x=>Array.isArray(x?.values)).map(x=>signature(x.values,x.eventId)));
 const rows=[],errors=[];let duplicates=0;
 const separator=lines.some(l=>l.includes('\t'))?'\t':';';
 for(let i=0;i<lines.length;i++){
  let values;
  try{values=splitLine(lines[i],separator);}catch(e){errors.push(`Ligne ${i+1} : ${e.message}`);continue;}
  if(i===0&&fields.length&&values.every((v,j)=>j<fields.length&&normalize(v)===normalize(fields[j])))continue;
  if(values.length>3){errors.push(`Ligne ${i+1} : 3 colonnes maximum (nom, quantité/type, précision).`);continue;}
  while(values.length<3)values.push('');
  if(!values[0]||values.some(v=>v.length>20000)){
   errors.push(`Ligne ${i+1} : nom absent ou champ trop long.`);continue;
  }
  if(category==='contacts'&&!CONTACT_KINDS.has(normalize(values[1]).replace('benevole','bénévole'))){
   errors.push(`Ligne ${i+1} : catégorie de contact requise (bénévole, exposant, groupe, fournisseur ou intervenant).`);continue;
  }
  const id=signature(values,eventId);
  if(seen.has(id)){duplicates++;continue;}
  seen.add(id);rows.push(values);
 }
 return {rows,errors,duplicates,sourceCount:lines.length};
}

export function appendBulkEntry(data,{category,values,eventId='',newId}={}){
 if(!ENABLED.has(category)||typeof newId!=='function'||!Array.isArray(values))throw new TypeError('Ajout impossible.');
 const existing=Array.isArray(data?.[category])?data[category]:[];
 if(existing.length+values.length>10000)throw new RangeError('Limite de fiches atteinte.');
 const seen=new Set(existing.map(x=>signature(x.values,x.eventId)));
 const add=[];
 for(const three of values){
  if(!Array.isArray(three)||three.length!==3||three.some(v=>typeof v!=='string'||v.length>20000)||!three[0].trim())throw new TypeError('Ligne de collage invalide.');
  const sig=signature(three,eventId);
  if(seen.has(sig))continue;
  seen.add(sig);add.push({id:newId(),values:three.slice(),...(category!=='events'&&eventId?{eventId}:{})});
 }
 return {data:{...data,[category]:[...existing,...add]},added:add.length};
}
