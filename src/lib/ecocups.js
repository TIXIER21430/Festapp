// Domaine écocups : fonctions pures, sans accès réseau ni stockage.
// Les mouvements sont immuables ; aucun ajustement silencieux du solde.
const kinds = new Set(["initial", "achat", "sortie", "retour", "perte", "correction_plus", "correction_moins"]);

export function validateMovement(movement) {
  if (!movement || typeof movement !== "object" || Array.isArray(movement)) throw new Error("Mouvement invalide");
  if (!kinds.has(movement.type)) throw new Error("Type de mouvement inconnu");
  if (!Number.isSafeInteger(movement.quantity) || movement.quantity <= 0) throw new Error("Quantité entière positive requise");
  if (typeof movement.id !== "string" || !movement.id.trim()) throw new Error("Identifiant requis");
  if (typeof movement.at !== "string" || !Number.isFinite(Date.parse(movement.at))) throw new Error("Date valide requise");
  if (typeof movement.author !== "string" || !movement.author.trim()) throw new Error("Auteur requis");
  if (["sortie", "retour", "perte"].includes(movement.type) && (!movement.eventId || typeof movement.eventId !== "string")) {
    throw new Error("Manifestation requise pour ce mouvement");
  }
  if (movement.type.startsWith("correction") && (!movement.reason || typeof movement.reason !== "string" || !movement.reason.trim())) {
    throw new Error("Motif de correction requis");
  }
  return movement;
}

export function calculateEcocupInventory(movements, threshold = 100) {
  if (!Array.isArray(movements)) throw new Error("Historique invalide");
  if (!Number.isSafeInteger(threshold) || threshold < 0) throw new Error("Seuil invalide");
  let balance = 0;
  let initialized = false;
  const seen = new Set();
  for (const item of movements) {
    const movement = validateMovement(item);
    if (seen.has(movement.id)) throw new Error("Mouvement en doublon");
    seen.add(movement.id);
    if (movement.type === "initial") {
      if (initialized || movements.indexOf(item) !== 0) throw new Error("Inventaire initial unique et en premier");
      initialized = true;
    } else if (!initialized) {
      throw new Error("Inventaire initial manquant");
    }
    const increase = ["initial", "achat", "retour", "correction_plus"].includes(movement.type);
    const next = balance + (increase ? movement.quantity : -movement.quantity);
    if (!Number.isSafeInteger(next) || next < 0) throw new Error("Stock insuffisant ou dépassement numérique");
    balance = next;
  }
  return { quantity: balance, threshold, lowStock: initialized && balance <= threshold, initialized, movementCount: movements.length };
}

export function appendEcocupMovement(history, movement, threshold = 100) {
  const next = [...history, validateMovement(movement)];
  const inventory = calculateEcocupInventory(next, threshold);
  return { movements: next, inventory };
}
