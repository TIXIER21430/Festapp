// Local-only contact export selection. Never uploads contact information.
export function selectContactsForExport(contacts,category="tous",search=""){
 if(!Array.isArray(contacts)||typeof category!=="string"||typeof search!=="string")throw new TypeError("Invalid contact selection");
 const normalized=value=>String(value??"").trim().normalize("NFC").toLocaleLowerCase("fr");
 const type=normalized(category),query=normalized(search);
 return contacts.filter(row=>Array.isArray(row?.values)&&row.values.length===3&&(type==="tous"||normalized(row.values[1])===type)&&row.values.some(value=>normalized(value).includes(query))).map(row=>[...row.values]);
}
