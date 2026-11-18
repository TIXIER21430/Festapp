import {photoCrc32} from './photoZip.js';
import {parseDemoBackup,validateDemoData} from './demoBackup.js';
import {inspectCombinedEcocupSettings,inspectCombinedVolunteerNeeds} from './combinedDemoBackup.js';
import {importTillConfig,validateTillConfig} from './tillConfig.js';
import {OWNER_MODULES,parseOwnerReviews,fingerprintOwnerModule} from './ownerSetup.js';
import {parseVolunteerNeeds} from './volunteerNeeds.js';
import {serializeDemoEcocupSettings,DEFAULT_ECOCUP_SETTINGS} from './ecocupDemoSettings.js';
import {summarizeEcocups} from './ecocupDemoBalance.js';
import {validatePhotoInput} from './photoVault.js';

const decoder=new TextDecoder('utf-8',{fatal:true});
const required=['FESTAPP-sauvegarde.json','FESTAPP-menus-caisse.json','FESTAPP-verifications.json','FESTAPP-liste-des-photos.json'];
const MAX_ZIP_BYTES=2_000_000_000;
const MAX_PHOTOS=500;
const MIME={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',heic:'image/heic',heif:'image/heif'};
const u16=(v,o)=>v.getUint16(o,true);
const u32=(v,o)=>v.getUint32(o,true);
const invalid=()=>new TypeError('ZIP FEST’APP incompatible ou endommagé. Aucun changement effectué.');
const exact=(x,y)=>JSON.stringify(x)===JSON.stringify(y);

// Read central-directory entries and check each local header, size and CRC.
// Only our own uncompressed archives are accepted. Photo blobs are streamed by
// slice, avoiding loading the entire archive into browser memory at once.
export async function readCompleteBackupZip(file){
 if(!(file instanceof Blob)||file.size<22||file.size>MAX_ZIP_BYTES)throw invalid();
 const end=new DataView(await file.slice(file.size-22).arrayBuffer());
 if(u32(end,0)!==0x06054b50||u16(end,4)!==0||u16(end,6)!==0||u16(end,8)!==u16(end,10)||u16(end,20)!==0)throw invalid();
 const count=u16(end,10),directorySize=u32(end,12),directoryOffset=u32(end,16);
 if(count<4||count>MAX_PHOTOS+4||directorySize>200_000||directoryOffset+directorySize!==file.size-22)throw invalid();
 const central=new DataView(await file.slice(directoryOffset,directoryOffset+directorySize).arrayBuffer());
 const entries=new Map();let offset=0;
 for(let i=0;i<count;i++){
  if(offset+46>central.byteLength||u32(central,offset)!==0x02014b50)throw invalid();
  const flags=u16(central,offset+8),method=u16(central,offset+10),crc=u32(central,offset+16),compressed=u32(central,offset+20),size=u32(central,offset+24);
  const nameLen=u16(central,offset+28),extraLen=u16(central,offset+30),commentLen=u16(central,offset+32),localOffset=u32(central,offset+42);
  const next=offset+46+nameLen+extraLen+commentLen;
  if(next>central.byteLength||flags!==0x0800||method!==0||size!==compressed||nameLen===0||nameLen>250||extraLen!==0||commentLen!==0)throw invalid();
  const name=decoder.decode(new Uint8Array(central.buffer,offset+46,nameLen));
  if(entries.has(name)||(!required.includes(name)&&!/^photos\/(?:[a-z]+\/)?\d{3}-[^/\\]+$/.test(name)))throw invalid();
  if(localOffset+30+nameLen+size>directoryOffset)throw invalid();
  const local=new DataView(await file.slice(localOffset,localOffset+30+nameLen).arrayBuffer());
  if(u32(local,0)!==0x04034b50||u16(local,6)!==flags||u16(local,8)!==method||u32(local,14)!==crc||u32(local,18)!==size||u32(local,22)!==size||u16(local,26)!==nameLen||u16(local,28)!==0)throw invalid();
  const localName=decoder.decode(new Uint8Array(local.buffer,30,nameLen));
  if(localName!==name)throw invalid();
  const blob=file.slice(localOffset+30+nameLen,localOffset+30+nameLen+size);
  const actual=photoCrc32(new Uint8Array(await blob.arrayBuffer()));
  if(actual!==crc)throw invalid();
  entries.set(name,{name,blob,size,crc});offset=next;
 }
 if(offset!==directorySize||required.some(name=>!entries.has(name)))throw invalid();
 const readJson=async(name,limit)=>{
  const entry=entries.get(name);
  if(entry.size>limit)throw invalid();
  return decoder.decode(await entry.blob.arrayBuffer());
 };
 const backupJSON=await readJson(required[0],10_000_000);
 const menuJSON=await readJson(required[1],100_000);
 const reviewJSON=await readJson(required[2],100_000);
 const manifestJSON=await readJson(required[3],250_000);
 parseDemoBackup(backupJSON);
 importTillConfig(menuJSON);
 let review,manifest;
 try{review=JSON.parse(reviewJSON);manifest=JSON.parse(manifestJSON);}catch{throw invalid();}
 if(!review||review.format!=='festapp-owner-review'||review.version!==1||!review.reviews||typeof review.reviews!=='object'||Array.isArray(review.reviews))throw invalid();
 if(!manifest||manifest.format!=='festapp-photos-originales'||manifest.version!==1||manifest.rubrique!=='toutes'||!Array.isArray(manifest.photos)||manifest.photos.length>MAX_PHOTOS||entries.size!==required.length+manifest.photos.length)throw invalid();
 const photos=[];const matched=new Set();
 for(const item of manifest.photos){
  if(!item||typeof item.fichier!=='string'||matched.has(item.fichier)||!entries.has(item.fichier)||!item.fichier.startsWith('photos/')||typeof item.nomOriginal!=='string'||typeof item.rubrique!=='string'||typeof item.ficheAssociee!=='string'||typeof item.date!=='string'||item.date.length>50)throw invalid();
  const original=item.nomOriginal;
  const ext=original.split('.').pop().toLowerCase();
  const type=MIME[ext];if(!type)throw invalid();
  const entry=entries.get(item.fichier);
  const blob=entry.blob.slice(0,entry.size,type);
  validatePhotoInput({name:original,type,size:entry.size},item.rubrique,item.ficheAssociee);
  matched.add(item.fichier);
  photos.push({blob,scope:item.rubrique,fileName:original,recordId:item.ficheAssociee,addedAt:item.date||new Date().toISOString(),type,size:entry.size,crc:entry.crc});
 }
 return {backupJSON,menuJSON,reviews:parseOwnerReviews(JSON.stringify(review.reviews)),photos};
}

export async function photoKey(photo){
 const crc=Number.isInteger(photo.crc)?photo.crc:photoCrc32(new Uint8Array(await photo.blob.arrayBuffer()));
 return JSON.stringify([photo.scope,photo.fileName,photo.size,photo.recordId||'',crc]);
}

export async function planCompleteZipRestore(archive,currentData,{volunteerNeeds={},ecocupSettings=DEFAULT_ECOCUP_SETTINGS,tillConfig={},reviews={},photos=[]}={}){
 const current=validateDemoData(currentData),incoming=parseDemoBackup(archive.backupJSON),nextData=structuredClone(current);
 let addedRecords=0,unchangedRecords=0;const conflicts=[];
 for(const [category,rows] of Object.entries(incoming)){
  const destination=nextData[category]||[];
  const byId=new Map(destination.map(row=>[row.id,row]));
  for(const row of rows){
   const existing=byId.get(row.id);
   if(existing){if(exact(existing,row))unchangedRecords++;else conflicts.push(`Fiche ${category} déjà modifiée sur cet appareil`);}
   else{destination.push(row);byId.set(row.id,row);addedRecords++;}
  }
  if(destination.length>10000)conflicts.push(`Limite de fiches dépassée : ${category}`);
  nextData[category]=destination;
 }
 const eventIds=new Set((nextData.events||[]).map(row=>row.id));
 for(const [category,rows] of Object.entries(nextData))if(category!=='events')for(const row of rows)if(row.eventId&&!eventIds.has(row.eventId)&&!(current[category]||[]).some(old=>old.id===row.id))conflicts.push(`Manifestation absente pour une fiche ${category}`);

 const incomingNeeds=inspectCombinedVolunteerNeeds(archive.backupJSON);
 const nextNeeds=parseVolunteerNeeds(JSON.stringify(volunteerNeeds));
 if(incomingNeeds.present)for(const [id,posts] of Object.entries(incomingNeeds.needs)){
  const target={...(nextNeeds[id]||{})};
  for(const [post,n] of Object.entries(posts)){
   if(Object.hasOwn(target,post)&&target[post]!==n)conflicts.push('Besoins bénévoles différents pour '+post);
   else target[post]=n;
  }
  nextNeeds[id]=target;
 }

 const includedEcocups=inspectCombinedEcocupSettings(archive.backupJSON);
 let nextEcocups=JSON.parse(serializeDemoEcocupSettings(ecocupSettings));
 if(includedEcocups.present){
  const incomingSettings=includedEcocups.settings;
  if(!exact(nextEcocups,incomingSettings)){
   if(exact(nextEcocups,DEFAULT_ECOCUP_SETTINGS)&&!(current.ecocups||[]).length)nextEcocups=incomingSettings;
   else conflicts.push('Réglages écocups différents sur cet appareil');
  }
 }
 try{summarizeEcocups(nextData.ecocups||[],{openingBalance:Number(nextEcocups.openingBalance),alertThreshold:Number(nextEcocups.alertThreshold)});}catch{conflicts.push('Mouvements écocups incompatibles avec le stock initial');}

 const nextMenus=validateTillConfig(tillConfig),incomingMenus=importTillConfig(archive.menuJSON);
 for(const [event,items] of Object.entries(incomingMenus)){
  if(Object.hasOwn(nextMenus,event)&&!exact(nextMenus[event],items))conflicts.push('Menu de caisse différent pour '+event);
  else nextMenus[event]=items;
 }

 const nextReviews={...reviews};
 for(const module of OWNER_MODULES){
  const r=archive.reviews[module.key];
  if(r?.fingerprint===fingerprintOwnerModule(nextData,module.key,{ecocups:{opening:nextEcocups.openingBalance,threshold:nextEcocups.alertThreshold}})&&!Object.hasOwn(nextReviews,module.key))nextReviews[module.key]=r;
 }

 const currentKeys=new Set();
 for(const photo of photos)currentKeys.add(await photoKey(photo));
 const addPhotos=[];let unchangedPhotos=0;
 for(const photo of archive.photos){
  const key=await photoKey(photo);
  if(currentKeys.has(key))unchangedPhotos++;else{addPhotos.push(photo);currentKeys.add(key);}
 }
 if(photos.length+addPhotos.length>500)conflicts.push('Plus de 500 photos : restauration bloquée');
 for(const scope of ['recipes','posts','archives','finance','equipment','events']){
  const count=photos.filter(photo=>photo.scope===scope).length+addPhotos.filter(photo=>photo.scope===scope).length;
  if(count>100)conflicts.push('Plus de 100 photos dans la rubrique '+scope);
 }
 return {safe:conflicts.length===0,conflicts,addedRecords,unchangedRecords,addedPhotos:addPhotos.length,unchangedPhotos,nextData,nextNeeds,nextEcocups,nextMenus,nextReviews,addPhotos};
}
