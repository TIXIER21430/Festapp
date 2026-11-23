// Complete, immutable ZIP archives in a private TEST Storage bucket only.
// The bucket and member-only Storage policies must be provisioned and tested
// separately before this feature can be enabled. Never use a service key here.
import {FESTAPP_TEST_SPACE_ID,FESTAPP_TEST_URL} from './supabaseClient.js';

export const TEST_BACKUP_BUCKET='festapp-private-backups-test';
export const MAX_TEST_BACKUP_BYTES=40_000_000;
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

async function sha256(blob){
 if(!globalThis.crypto?.subtle)throw new Error('Vérification cryptographique indisponible sur cet appareil.');
 const hash=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
 return Array.from(new Uint8Array(hash),value=>value.toString(16).padStart(2,'0')).join('');
}

export async function saveTestFullBackup(client,{spaceId,backup,testMode}={}){
 // Reject a wrong project/space before even asking for a session or touching Storage.
 if(testMode!==true||client?.supabaseUrl!==FESTAPP_TEST_URL||spaceId!==FESTAPP_TEST_SPACE_ID)
  throw new Error('Archive cloud refusée hors du projet et de l’espace Supabase TEST.');
 if(!(backup instanceof Blob)||backup.type!=='application/zip'||!Number.isSafeInteger(backup.size)||backup.size<1||backup.size>MAX_TEST_BACKUP_BYTES)
  throw new Error('Archive ZIP absente ou trop volumineuse pour la sauvegarde TEST (40 Mo maximum).');
 if(!client?.auth?.getUser||!client?.from||!client?.storage?.from)throw new Error('Connexion privée Supabase indisponible.');
 const {data:userData,error:userError}=await client.auth.getUser();
 const userId=userData?.user?.id;
 if(userError||!UUID.test(userId||''))throw new Error('Connexion individuelle requise pour la sauvegarde privée.');
 const {data:member,error:memberError}=await client.from('festapp_members')
  .select('role').eq('space_id',spaceId).eq('user_id',userId).maybeSingle();
 if(memberError||!member||!['admin','editor'].includes(member.role))
  throw new Error('Ce compte ne peut pas enregistrer une sauvegarde du comité.');
 const hash=await sha256(backup);
 const path=`${spaceId}/${userId}/${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomUUID()}.zip`;
 const files=client.storage.from(TEST_BACKUP_BUCKET);
 const {error:uploadError}=await files.upload(path,backup,{upsert:false,contentType:'application/zip',cacheControl:'0'});
 if(uploadError)throw new Error('Envoi de l’archive TEST refusé : vérifie le stockage privé et les droits.');
 const {data:download,error:readError}=await files.download(path);
 if(readError||!(download instanceof Blob)||download.size!==backup.size||await sha256(download)!==hash)
  throw new Error('Archive distante non vérifiée : conserve le ZIP sur ton appareil.');
 return {path,bytes:backup.size,sha256:hash,verified:true};
}

// Recovery is a download only. Never replace local records or photographs here.
export async function downloadLatestTestFullBackup(client,{spaceId,testMode}={}){
 if(testMode!==true||client?.supabaseUrl!==FESTAPP_TEST_URL||spaceId!==FESTAPP_TEST_SPACE_ID)
  throw new Error('Récupération refusée hors du projet et de l’espace Supabase TEST.');
 if(!client?.auth?.getUser||!client?.storage?.from)throw new Error('Connexion privée Supabase indisponible.');
 const {data:userData,error:userError}=await client.auth.getUser();
 const userId=userData?.user?.id;
 if(userError||!UUID.test(userId||''))throw new Error('Connexion individuelle requise pour récupérer une archive.');
 const folder=`${spaceId}/${userId}`;
 const files=client.storage.from(TEST_BACKUP_BUCKET);
 const {data:list,error:listError}=await files.list(folder,{limit:100,sortBy:{column:'created_at',order:'desc'}});
 if(listError)throw new Error('Impossible de retrouver les archives privées du compte.');
 const latest=list?.find(item=>item?.id&&/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f-]{36}\.zip$/i.test(item.name));
 if(!latest)throw new Error('Aucune archive ZIP complète trouvée pour ce compte TEST.');
 const {data:blob,error:readError}=await files.download(`${folder}/${latest.name}`);
 if(readError||!(blob instanceof Blob)||blob.size<1||blob.size>MAX_TEST_BACKUP_BYTES)
  throw new Error('Téléchargement de l’archive privée impossible ou invalide.');
 return {blob,name:`festapp-cloud-test-${latest.name}`,createdAt:latest.created_at};
}
