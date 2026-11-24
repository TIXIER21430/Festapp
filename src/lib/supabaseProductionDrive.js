// PRODUCTION-only private Drive metadata. Never serve the catalog as a public JSON asset.
// File contents and permissions remain in Google Drive.
import {FESTAPP_SUPABASE_URL,FESTAPP_SPACE_ID} from './supabaseSharedRead.js';

const PAGE_SIZE=500;
const MAX_FILES=10000;
const SAFE_DRIVE_URL=/^https:\/\/(?:drive|docs)\.google\.com\//;

function documentType(mime){
 if(mime.startsWith('image/'))return 'image';
 if(mime.startsWith('audio/'))return 'audio';
 if(mime.startsWith('video/'))return 'video';
 if(mime==='application/pdf')return 'pdf';
 if(/spreadsheet|excel|csv|sheet/.test(mime))return 'spreadsheet';
 if(/document|word|text|presentation|powerpoint/.test(mime))return 'document';
 return 'other';
}

export async function readProductionPrivateDriveCatalog(client,{spaceId,productionMode}={}){
 if(productionMode!==true||client?.supabaseUrl!==FESTAPP_SUPABASE_URL||spaceId!==FESTAPP_SPACE_ID)
  throw new Error('Catalogue Drive privé indisponible hors de Supabase PRODUCTION.');
 if(!client.auth?.getUser||!client.from)throw new TypeError('Client Supabase incomplet.');
 const {data:auth,error:authError}=await client.auth.getUser();
 if(authError||!auth?.user?.id)throw new Error('Connectez-vous pour chercher dans le Drive du comité.');
 const {data:member,error:membershipError}=await client.from('festapp_members').select('space_id').eq('space_id',spaceId).eq('user_id',auth.user.id).maybeSingle();
 if(membershipError||!member||member.space_id!==spaceId)throw new Error('Accès aux documents du comité non autorisé.');

 const files=[];
 const seen=new Set();
 let indexedAt='';
 for(let start=0;start<=MAX_FILES;start+=PAGE_SIZE){
  const {data:page,error}=await client.from('festapp_drive_files')
   .select('file_id,name,mime_type,folder_path,web_url,indexed_at')
   .eq('space_id',spaceId).order('file_id',{ascending:true})
   .range(start,start+PAGE_SIZE-1);
  if(error||!Array.isArray(page))throw new Error('Impossible de charger le catalogue privé du Drive.');
  for(const row of page){
   if(!row||typeof row.file_id!=='string'||!row.file_id||seen.has(row.file_id)
    ||typeof row.name!=='string'||!row.name||typeof row.folder_path!=='string'
    ||typeof row.mime_type!=='string'||typeof row.web_url!=='string'||!SAFE_DRIVE_URL.test(row.web_url))
    throw new Error('Inventaire Drive invalide : aucun document n’a été chargé.');
   if(files.length>=MAX_FILES)throw new Error('Inventaire Drive trop volumineux : chargement arrêté.');
   seen.add(row.file_id);
   files.push({id:row.file_id,title:row.name,folder:row.folder_path,url:row.web_url,type:documentType(row.mime_type)});
   if(row.indexed_at&&(!indexedAt||row.indexed_at>indexedAt))indexedAt=row.indexed_at;
  }
  if(page.length<PAGE_SIZE)break;
 }
 return {
  version:1,
  asOf:indexedAt?new Date(indexedAt).toLocaleDateString('fr-FR'):'date inconnue',
  files,
  stats:{documents:files.filter(f=>!['image','audio','video'].includes(f.type)).length,
   images:files.filter(f=>f.type==='image').length,
   audio:files.filter(f=>f.type==='audio').length,
   videos:files.filter(f=>f.type==='video').length},
  seed:null
 };
}
