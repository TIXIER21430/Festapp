// Read-only migration assessment for legacy and additive structured contacts.
// No network, database access, or writes. Ambiguous rows are explicitly quarantined.
import {validateDemoData} from "./demoBackup.js";

const kinds = new Map([
  ["bénévole","benevole"],["benevole","benevole"],["bénévoles","benevole"],["benevoles","benevole"],
  ["exposant","exposant"],["exposants","exposant"],
  ["groupe","groupe"],["groupes","groupe"]
]);
const normalize = value => value.trim().toLocaleLowerCase("fr-FR");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const phonePattern = /^\+?[0-9][0-9 .()\-]{5,23}$/u;

/**
 * Produce a conservative preview only. Do not automatically migrate or merge
 * contact data: the legacy demo has one free-text contact field, whereas the
 * newer demo can carry typed email/phone. Any ambiguity requires review.
 */
export function previewContactMigration(demoData) {
  const data = validateDemoData(demoData);
  const accepted = [], review = [];
  const seenIds = new Set();
  for (const row of data.contacts || []) {
    const [rawName,rawKind,rawContact] = row.values;
    const name = rawName.trim(), kind = kinds.get(normalize(rawKind));
    const contact = rawContact.trim();
    const reasons = [];
    // A repeated source ID could overwrite another contact in a later import.
    if (seenIds.has(row.id)) reasons.push("Identifiant source dupliqué");
    seenIds.add(row.id);
    if (!name || name.length > 200) reasons.push("Nom manquant ou trop long");
    if (!kind) reasons.push("Catégorie inconnue");
    let email = row.email?.trim() || null, phone = row.phone?.trim() || null;
    if (email && !emailPattern.test(email)) reasons.push("E-mail structuré invalide");
    if (phone && !phonePattern.test(phone)) reasons.push("Téléphone structuré invalide");
    if (contact) {
      if (emailPattern.test(contact)) {
        if (email && email !== contact) reasons.push("E-mails contradictoires");
        else email = contact;
      }
      else if (phonePattern.test(contact)) {
        if (phone && phone !== contact) reasons.push("Téléphones contradictoires");
        else phone = contact;
      }
      else reasons.push("Coordonnées ambiguës");
    }
    if (reasons.length) review.push({sourceId:row.id,reasons,original:[...row.values]});
    else accepted.push({sourceId:row.id,kind,name,email,phone});
  }
  return {accepted,review,total:accepted.length+review.length,ready:review.length===0};
}
