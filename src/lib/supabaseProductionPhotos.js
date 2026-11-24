import {FESTAPP_SPACE_ID,FESTAPP_SUPABASE_URL} from './supabaseSharedRead.js';
import {validatePhotoInput,listPhotoSyncRows,markPhotoDeleted,cacheSharedPhoto} from './photoVault.js';
export const PHOTO_BUCKET='festapp-private-photos';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export function planPhotoSync(local,remote){
 const l=new Map(local.map(p=>[p.id,p])),r=new Map(remote.map(p=>[p.id,p]));
 const upload=[],download=[],deleteRemote=[],deleteLocal=[];
 for(const p of local){
  const other=r.get(p.id);
  if(p.deletedAt){if(other&&!other.deleted_at)deleteRemote.push(p);continue;}
  if(other?.deleted_at)deleteLocal.push(other);
  else if(!other)upload.push(p);
 }
 for(const p of remote){
  if(!l.has(p.id)){if(p.deleted_at)deleteLocal.push(p);else download.push(p);}
 }
 return {upload,download,deleteRemote,deleteLocal};
}
function checkMeta(p){
 if(!UUID.test(p.id)||!Number.isFinite(Date.parse(p.addedAt)))throw Error('Identifiant photo invalide.');
 return validatePhotoInput({name:p.fileName,type:p.type,size:p.size},p.scope,p.recordId);
}
async function equalBytes(a,b){
 if(a.size!==b.size)return false;
 const [x,y]=await Promise.all([a.arrayBuffer(),b.arrayBuffer()]);
 const [hx,hy]=await Promise.all([crypto.subtle.digest('SHA-256',x),crypto.subtle.digest('SHA-256',y)]);
 return new Uint8Array(hx).every((n,i)=>n===new Uint8Array(hy)[i]);
}
export async function syncProductionPhotos(client,{spaceId,productionMode,active=()=>true,localStore={list:listPhotoSyncRows,remove:markPhotoDeleted,cache:cacheSharedPhoto}}={}){
 if(productionMode!==true||client?.supabaseUrl!==FESTAPP_SUPABASE_URL||spaceId!==FESTAPP_SPACE_ID)throw Error('Partage photo refusé hors production.');
 const {data:user,error:authError}=await client.auth.getUser();
 if(authError||!user?.user?.id||!active())throw Error('Connexion requise.');
 const {data:member,error:memberError}=await client.from('festapp_members').select('role').eq('space_id',spaceId).eq('user_id',user.user.id).maybeSingle();
 if(memberError||!member||!['admin','editor'].includes(member.role))throw Error('Droits photo insuffisants.');
 const remote=[];
 for(let start=0;;start+=500){
  const {data,error}=await client.from('festapp_photos').select('*').eq('space_id',spaceId).order('id').range(start,start+499);
  if(error||!Array.isArray(data))throw Error('Liste des photos partagées indisponible.');
  remote.push(...data);if(data.length<500)break;
 }
 const local=await localStore.list(),plan=planPhotoSync(local,remote);
 const bucket=client.storage.from(PHOTO_BUCKET);let changed=false;
 for(const p of plan.deleteLocal){if(!active())return {changed};changed=(await localStore.remove(p.id,p.deleted_at))||changed;}
 for(const p of plan.deleteRemote){
  if(!active())return {changed};
  const {error}=await client.from('festapp_photos').update({deleted_at:p.deletedAt}).eq('space_id',spaceId).eq('id',p.id).is('deleted_at',null);
  if(error)throw Error('Suppression distante non confirmée.');
 }
 for(const p of plan.upload){
  if(!active())return {changed};checkMeta(p);
  if(!(p.blob instanceof Blob)||p.blob.size!==p.size)throw Error('Photo locale illisible.');
  const path=spaceId+'/'+p.id;
  const {error:uploadError}=await bucket.upload(path,p.blob,{upsert:false,contentType:p.type,cacheControl:'0'});
  // Read back even on duplicate: a previous interrupted upload may have succeeded.
  const {data:copy,error:downloadError}=await bucket.download(path);
  if(downloadError||!(copy instanceof Blob)||!await equalBytes(p.blob,copy))throw Error(uploadError?'Envoi photo non confirmé.':'Original distant différent.');
  if(!active())return {changed};
  const {error}=await client.from('festapp_photos').insert({space_id:spaceId,id:p.id,scope:p.scope,record_id:p.recordId,file_name:p.fileName,mime_type:p.type,byte_size:p.size,added_at:p.addedAt});
  if(error&&error.code!=='23505')throw Error('Photo envoyée mais index non confirmé. Réessai automatique.');
 }
 for(const p of plan.download){
  if(!active())return {changed};
  const photo={id:p.id,scope:p.scope,recordId:p.record_id,fileName:p.file_name,type:p.mime_type,size:p.byte_size,addedAt:p.added_at};
  checkMeta(photo);
  const {data:blob,error}=await bucket.download(spaceId+'/'+p.id);
  if(error||!(blob instanceof Blob)||blob.size!==photo.size)throw Error('Original distant non téléchargé.');
  if(!active())return {changed};
  changed=(await localStore.cache({...photo,blob}))||changed;
 }
 return {changed,uploaded:plan.upload.length,downloaded:plan.download.length};
}
