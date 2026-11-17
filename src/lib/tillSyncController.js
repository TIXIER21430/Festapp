// UI-independent controller for TEST-only shared till menus.
// Never silently replaces unsaved local edits with remote data.
export function createTillSyncController(adapter,{onState=()=>{}}={}){
 if(!adapter||typeof adapter.list!=="function"||typeof adapter.save!=="function")throw new TypeError("Invalid adapter");
 let state={status:"idle",menus:{},revisions:{},error:""};
 let dirty=new Set();
 const emit=()=>onState({...state,menus:{...state.menus},revisions:{...state.revisions},dirty:[...dirty]});
 const set=(patch)=>{state={...state,...patch};emit()};
 return Object.freeze({
  snapshot(){return {...state,menus:{...state.menus},revisions:{...state.revisions},dirty:[...dirty]}},
  edit(event,menu){
   if(typeof event!=="string"||!Array.isArray(menu))throw new TypeError("Invalid edit");
   dirty.add(event);set({menus:{...state.menus,[event]:menu},status:"unsaved",error:""});
  },
  async refresh(){
   set({status:"loading",error:""});
   try{
    const rows=await adapter.list();
    const menus={...state.menus},revisions={...state.revisions};
    for(const row of rows){
     if(dirty.has(row.eventName))continue;
     menus[row.eventName]=row.menu;
     revisions[row.eventName]=row.updatedAt;
    }
    set({menus,revisions,status:dirty.size?"unsaved":"synced"});
    return true;
   }catch{
    set({status:"offline",error:"Connexion impossible : données locales conservées."});
    return false;
   }
  },
  async save(event){
   if(!dirty.has(event))return false;
   set({status:"saving",error:""});
   try{
    const rev=await adapter.save(event,state.menus[event],{expectedUpdatedAt:state.revisions[event]??null});
    revisionsCheck(rev);
    dirty.delete(event);
    set({revisions:{...state.revisions,[event]:rev},status:dirty.size?"unsaved":"synced"});
    return true;
   }catch(e){
    const conflict=/changed elsewhere|already exist/i.test(e?.message||"");
    set({status:conflict?"conflict":"offline",error:conflict?"Ce menu a changé sur un autre appareil. Rechargez avant d'enregistrer.":"Enregistrement impossible : modifications locales conservées."});
    return false;
   }
  }
 });
}
function revisionsCheck(rev){
 if(typeof rev!=="string"||!Number.isFinite(Date.parse(rev)))throw new TypeError("Invalid server revision");
}
