// A changed form must not be silently discarded by navigation on a phone.
// Compare against the saved record, not merely against empty fields: opening
// an existing record without editing it should not trigger a warning.
export function hasUnsavedDraft({open=false,form=[],editingId=null,records=[],eventId='',email='',phone=''}={}) {
 if(!open)return false;
 const current=[...form].map(value=>String(value??''));
 const original=editingId?(records||[]).find(record=>record.id===editingId):null;
 if(!original)return current.some(value=>value.trim())||!!String(email).trim()||!!String(phone).trim();
 return current.some((value,index)=>value!==String(original.values?.[index]??''))
  ||String(email)!==String(original.email??'')
  ||String(phone)!==String(original.phone??'')
  ||String(eventId)!==String(original.eventId??'');
}
