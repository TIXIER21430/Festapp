// Offline originals. Images are never sent to Supabase, Facebook, or an AI provider.
export const MAX_PHOTO_BYTES=12_000_000;
const DB_NAME="festapp-original-photos-v1";
const STORE="originals";
const SCOPES=new Set(["recipes","posts","archives"]);
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

export async function savePhotoOriginal(file,scope,recordId=""){
 const meta=validatePhotoInput(file,scope,recordId);
 const row={...meta,id:crypto.randomUUID(),addedAt:new Date().toISOString(),blob:file};
 await transact("readwrite",store=>store.add(row));
 return row;
}

export async function deletePhotoOriginal(id){
 if(typeof id!=="string"||!id)throw new TypeError("Photo inconnue.");
 await transact("readwrite",store=>store.delete(id));
}
