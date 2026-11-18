// Portable uncompressed ZIP of offline original photos; never uploads data.
const MAX_FILES=100;
const MAX_ARCHIVE_SIZE=2_000_000_000;
const encoder=new TextEncoder();
const CRC_TABLE=Uint32Array.from({length:256},(_,n)=>{
 let c=n;
 for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});

export function photoCrc32(bytes){
 let crc=0xffffffff;
 for(const byte of bytes)crc=CRC_TABLE[(crc^byte)&255]^(crc>>>8);
 return (crc^0xffffffff)>>>0;
}

function header(size){return new DataView(new ArrayBuffer(size));}
function zipName(value){
 const basename=String(value||'photo').split(/[\\/]/).pop().replace(/[\x00-\x1f<>:"|?*]/g,'_').replace(/^\.+/,'').slice(0,120);
 return basename||'photo';
}
function localHeader(nameLength,crc,size){
 const view=header(30);
 view.setUint32(0,0x04034b50,true);
 view.setUint16(4,20,true);
 view.setUint16(6,0x0800,true);
 view.setUint16(8,0,true);
 view.setUint32(14,crc,true);
 view.setUint32(18,size,true);
 view.setUint32(22,size,true);
 view.setUint16(26,nameLength,true);
 return view.buffer;
}
function centralHeader(entry){
 const view=header(46);
 view.setUint32(0,0x02014b50,true);
 view.setUint16(4,20,true);
 view.setUint16(6,20,true);
 view.setUint16(8,0x0800,true);
 view.setUint32(16,entry.crc,true);
 view.setUint32(20,entry.size,true);
 view.setUint32(24,entry.size,true);
 view.setUint16(28,entry.nameBytes.byteLength,true);
 view.setUint32(42,entry.offset,true);
 return view.buffer;
}

function collectPhotos(photos,{scope=null,limit=MAX_FILES}={}){
 if(!Array.isArray(photos)||photos.length>limit)throw new TypeError('Liste de photos invalide.');
 const files=[],manifest=[];
 for(let i=0;i<photos.length;i++){
  const photo=photos[i];
  if(!photo||typeof photo.scope!=='string'||!/^[a-z]+$/.test(photo.scope)||(scope&&photo.scope!==scope)||!(photo.blob instanceof Blob)||!Number.isSafeInteger(photo.size)||photo.size!==photo.blob.size||photo.size<=0||photo.size>12_000_000)throw new TypeError('Photo locale incompatible avec le téléchargement.');
  const name=`photos/${scope?'':photo.scope+'/'}${String(i+1).padStart(3,'0')}-${zipName(photo.fileName)}`;
  files.push({name,blob:photo.blob});
  manifest.push({fichier:name,nomOriginal:photo.fileName,rubrique:photo.scope,ficheAssociee:photo.recordId||'',date:photo.addedAt||''});
 }
 return {files,manifest};
}

async function zipFiles(files){
 if(files.length>65535)throw new RangeError('Trop de fichiers pour ce ZIP.');
 const chunks=[],central=[];
 let offset=0;
 for(const file of files){
  const nameBytes=encoder.encode(file.name);
  if(nameBytes.byteLength>65535)throw new TypeError('Nom de photo trop long.');
  const size=file.blob.size;
  if(size>=0xffffffff||offset+size+nameBytes.byteLength+100>MAX_ARCHIVE_SIZE)throw new RangeError('Photos trop volumineuses pour un seul ZIP. Exportez-les par rubrique.');
  const crc=photoCrc32(new Uint8Array(await file.blob.arrayBuffer()));
  const entry={nameBytes,crc,size,offset};
  central.push(entry);
  chunks.push(localHeader(nameBytes.byteLength,crc,size),nameBytes,file.blob);
  offset+=30+nameBytes.byteLength+size;
 }
 const cdOffset=offset;
 for(const entry of central){chunks.push(centralHeader(entry),entry.nameBytes);offset+=46+entry.nameBytes.byteLength;}
 const end=header(22);
 end.setUint32(0,0x06054b50,true);
 end.setUint16(8,central.length,true);
 end.setUint16(10,central.length,true);
 end.setUint32(12,offset-cdOffset,true);
 end.setUint32(16,cdOffset,true);
 chunks.push(end.buffer);
 return new Blob(chunks,{type:'application/zip'});
}

export async function makePhotoZip(photos,scope){
 if(typeof scope!=='string'||!/^[a-z]+$/.test(scope))throw new TypeError('Liste de photos invalide.');
 const {files,manifest}=collectPhotos(photos,{scope});
 const info=JSON.stringify({format:'festapp-photos-originales',version:1,rubrique:scope,exportLe:new Date().toISOString(),photos:manifest},null,2);
 files.push({name:'FESTAPP-liste-des-photos.json',blob:new Blob([info],{type:'application/json'})});
 return zipFiles(files);
}

export async function makeCompleteBackupZip({backupJSON,menuJSON,reviewJSON,photos}={}){
 if(typeof backupJSON!=='string'||encoder.encode(backupJSON).byteLength>10_000_000)throw new TypeError('Sauvegarde JSON absente ou trop volumineuse.');
 if(typeof menuJSON!=='string'||encoder.encode(menuJSON).byteLength>100_000||typeof reviewJSON!=='string'||encoder.encode(reviewJSON).byteLength>100_000)throw new TypeError('Réglages de l’application invalides.');
 for(const value of [backupJSON,menuJSON,reviewJSON]){try{JSON.parse(value);}catch{throw new TypeError('Une des sauvegardes JSON est invalide.');}}
 const {files,manifest}=collectPhotos(photos,{limit:500});
 const info=JSON.stringify({format:'festapp-photos-originales',version:1,rubrique:'toutes',exportLe:new Date().toISOString(),photos:manifest},null,2);
 files.unshift(
  {name:'FESTAPP-sauvegarde.json',blob:new Blob([backupJSON],{type:'application/json'})},
  {name:'FESTAPP-menus-caisse.json',blob:new Blob([menuJSON],{type:'application/json'})},
  {name:'FESTAPP-verifications.json',blob:new Blob([reviewJSON],{type:'application/json'})},
  {name:'FESTAPP-liste-des-photos.json',blob:new Blob([info],{type:'application/json'})}
 );
 return zipFiles(files);
}
