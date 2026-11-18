// Local-only contact export selection. Never uploads contact information.
function filteredContacts(contacts,category="tous",search=""){
 if(!Array.isArray(contacts)||typeof category!=="string"||typeof search!=="string")throw new TypeError("Invalid contact selection");
 const normalized=value=>String(value??"").trim().normalize("NFC").toLocaleLowerCase("fr");
 const type=normalized(category),query=normalized(search);
 return contacts.filter(row=>Array.isArray(row?.values)&&row.values.length===3&&(type==="tous"||normalized(row.values[1])===type)&&[...row.values,row.email,row.phone].some(value=>normalized(value).includes(query)));
}
export function selectContactsForExport(contacts,category="tous",search=""){
 return filteredContacts(contacts,category,search).map(row=>[...row.values]);
}

// Additive export: preserve the legacy free-text contact alongside typed fields.
export const CONTACT_EXPORT_COLUMNS=Object.freeze(["Nom","Catégorie","Contact libre / ancien","E-mail","Téléphone"]);
export function selectContactsWithDetailsForExport(contacts,category="tous",search=""){
 return filteredContacts(contacts,category,search).map(row=>[...row.values,row.email??"",row.phone??""]);
}
