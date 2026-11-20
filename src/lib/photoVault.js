// Offline originals. Images are never sent to Supabase, Facebook, or an AI provider.
export const MAX_PHOTO_BYTES=12_000_000;
export const MAX_PHOTOS_PER_SCOPE=100;
export const MAX_PHOTOS_TOTAL=500;
const DB_NAME="festapp-original-photos-v1";
const STORE="originals";
// Shared list used by image cards and ZIP restore. Photos stay local.
export const PHOTO_CATEGORIES=Object.freeze([
 "events","tasks","shopping","stock","ecocups","contacts","shifts",
 "feedback","recipes","finance","equipment","posts","archives"
]);
const SCOPES=new Set(PHOTO_CATEGORIES);
const IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp","image/gif","image/heic","image/heif"]);

export function validatePhotoInput(file,scope,recordId=""){
 if(!SCOPES.has(scope))throw new TypeError("Rubrique photo inconnue.");
 if(!file||typeof file.name!=="string"||!file.name.trim()||!IMAGE_TYPES.has(file.type)||
 !Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_PHOTO_BYTES)throw new TypeError("Photo refusée : JPEG, PNG, WebP, GIF ou HEIC de 12 Mo maximum.");
 if(typeof recordId!=="string"||recordId.length>200)throw new TypeError("Association invalide.");
 return {fileName:file.name.split(/[\\/]/).pop().slice(0,200),type:file.type,size:file.size,scope,recordId};
}

function openDb(){
 if(typeof indexedDB==="undefined")return Promise.reject(new Error("Stockage de photos indisponible sur cet appareil."));
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:"id"});};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
  request.onerror=()=>reject(new Error("Impossible d’ouvrir les photos locales."));
  request.onblocked=()=>reject(new Error("Fermez les anciens onglets FEST’APP puis réessayez."));
 });
}

async function transact(mode,perform){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  let result,finished=false;
  const tx=db.transaction(STORE,mode);
  const request=perform(tx.objectStore(STORE));
  request.onsuccess=()=>{result=request.result;};
  tx.oncomplete=()=>{finished=true;db.close();resolve(result);};
  const fail=()=>{if(finished)return;finished=true;db.close();reject(new Error("Impossible de conserver les photos sur cet appareil (espace plein ou accès refusé)."));};
  tx.onerror=fail;tx.onabort=fail;
 });
}

export async function listPhotoOriginals(scope){
 if(!SCOPES.has(scope))throw new TypeError("Rubrique photo inconnue.");
 const all=await transact("readonly",store=>store.getAll());
 return all.filter(row=>row.scope===scope&&row.blob instanceof Blob).sort((a,b)=>b.addedAt.localeCompare(a.addedAt));
}

export async function listAllPhotoOriginals(){
 const all=await transact("readonly",store=>store.getAll());
 if(!Array.isArray(all)||all.some(row=>!row||!SCOPES.has(row.scope)||!(row.blob instanceof Blob)||row.size!==row.blob.size))throw new Error("Certaines photos locales sont illisibles : export complet refusé pour éviter un oubli.");
 return all.sort((a,b)=>a.scope.localeCompare(b.scope)||a.addedAt.localeCompare(b.addedAt));
}

export async function savePhotoOriginal(file,scope,recordId=""){
 const meta=validatePhotoInput(file,scope,recordId);
 const row={...meta,id:crypto.randomUUID(),addedAt:new Date().toISOString(),blob:file};
 // Check capacity in the same transaction as the insert. An icon upload must
 // never make the complete backup impossible to restore (100/section, 500 total).
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");
  const store=tx.objectStore(STORE);
  let quotaError="";
  const request=store.getAll();
  request.onsuccess=()=>{
   const existing=request.result;
   if(existing.length>=MAX_PHOTOS_TOTAL)quotaError="Limite de 500 photos locales atteinte : téléchargez un ZIP complet avant de libérer de la place.";
   else if(existing.filter(photo=>photo.scope===scope).length>=MAX_PHOTOS_PER_SCOPE)quotaError="Limite de 100 photos locales par rubrique atteinte : téléchargez un ZIP complet avant de libérer de la place.";
   if(quotaError){tx.abort();return;}
   store.add(row);
  };
  tx.oncomplete=()=>{db.close();resolve(row);};
  const fail=()=>{db.close();reject(new Error(quotaError||"Impossible de conserver la photo sur cet appareil (espace plein ou accès refusé)."));};
  tx.onerror=fail;tx.onabort=fail;
 });
}

// One IndexedDB transaction for an explicitly confirmed ZIP restoration.
// Either all requested photo originals are committed, or none are.
export async function saveRestoredPhotoOriginals(photos){
 if(!Array.isArray(photos)||photos.length>500)throw new TypeError('Trop de photos à restaurer.');
 const rows=photos.map(photo=>{
  const meta=validatePhotoInput({name:photo?.fileName,type:photo?.type,size:photo?.size},photo?.scope,photo?.recordId||'');
  if(!(photo.blob instanceof Blob)||photo.blob.size!==meta.size)throw new TypeError('Photo restaurée invalide.');
  return {...meta,id:crypto.randomUUID(),addedAt:typeof photo.addedAt==='string'&&Number.isFinite(Date.parse(photo.addedAt))?photo.addedAt:new Date().toISOString(),blob:photo.blob};
 });
 if(!rows.length)return [];
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  const store=tx.objectStore(STORE);
  for(const row of rows)store.add(row);
  tx.oncomplete=()=>{db.close();resolve(rows.map(row=>row.id));};
  const fail=()=>{db.close();reject(new Error('Photos non restaurées : espace plein ou accès refusé.'));};
  tx.onerror=fail;tx.onabort=fail;
 });
}

export async function rollbackRestoredPhotoOriginals(ids){
 if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!id))throw new TypeError('Identifiants de photos invalides.');
 if(!ids.length)return;
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
  for(const id of ids)store.delete(id);
  tx.oncomplete=()=>{db.close();resolve();};
  const fail=()=>{db.close();reject(new Error('Impossible de retirer des photos après échec.'));};
  tx.onerror=fail;tx.onabort=fail;
 });
}

export async function deletePhotoOriginal(id){
 if(typeof id!=="string"||!id)throw new TypeError("Photo inconnue.");
 await transact("readwrite",store=>store.delete(id));
}
