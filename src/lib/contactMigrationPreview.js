// Read-only migration assessment for the offline demo's three-column annuaire.
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
 * contact data: the demo has one free-text contact field, whereas the durable
 * schema separates email and phone. Any ambiguous contact requires review.
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
    let email = null, phone = null;
    if (contact) {
      if (emailPattern.test(contact)) email = contact;
      else if (phonePattern.test(contact)) phone = contact;
      else reasons.push("Coordonnées ambiguës");
    }
    if (reasons.length) review.push({sourceId:row.id,reasons,original:[...row.values]});
    else accepted.push({sourceId:row.id,kind,name,email,phone});
  }
  return {accepted,review,total:accepted.length+review.length,ready:review.length===0};
}
