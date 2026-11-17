export const VOLUNTEER_NEEDS_KEY="festapp-demo-volunteer-needs-v1";
export function parseVolunteerNeeds(raw){
 if(raw==null)return {};
 try{
  const value=JSON.parse(raw);
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  const result={};
  for(const [eventId,posts] of Object.entries(value)){
   if(!eventId||eventId.length>200||!posts||typeof posts!=="object"||Array.isArray(posts))continue;
   const safe={};
   for(const [post,count] of Object.entries(posts)){
    if(post.length<=100&&Number.isSafeInteger(count)&&count>=0&&count<=1000)safe[post]=count;
   }
   result[eventId]=safe;
  }
  return result;
 }catch{return {};}
}
export function staffingStatus(count,target){
 if(!Number.isSafeInteger(target)||target<0)return {kind:"unset",label:"Besoin à définir",missing:null};
 const missing=Math.max(0,target-count);
 return {kind:missing?"missing":"complete",label:missing?missing+" personne(s) à trouver":"Équipe complète",missing};
}
