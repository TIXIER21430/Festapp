export const checklistTemplates = {
  "Manifestation générale": [
    "Réserver la salle ou le lieu",
    "Vérifier les autorisations et assurances",
    "Contacter les bénévoles et attribuer les postes",
    "Contrôler le matériel, les tables et les barnums",
    "Préparer les commandes et les achats",
    "Prévoir la communication et les affiches",
    "Organiser le nettoyage et le rangement",
    "Préparer le bilan et les remerciements"
  ],
  "Buvette et restauration": [
    "Définir la carte et estimer les quantités",
    "Contrôler les stocks et commander les boissons",
    "Prévoir les règles d'hygiène et la chaîne du froid",
    "Vérifier les équipements électriques et la cuisson",
    "Organiser les créneaux de service",
    "Préparer la caisse et les moyens de paiement",
    "Prévoir la collecte des déchets",
    "Faire l'inventaire après la manifestation"
  ],
  "Marché de Noël": [
    "Confirmer les exposants et les emplacements",
    "Prévoir l'éclairage et les branchements",
    "Définir le plan de circulation et les accès",
    "Organiser les animations et la sonorisation",
    "Préparer l'affiche et la communication",
    "Vérifier le matériel et les décorations",
    "Affecter les bénévoles à l'accueil",
    "Organiser le rangement et le bilan"
  ]
};
export const validChecklistStatus = ["À faire", "En cours", "Terminée"];
export function createChecklistItems(eventName, templateName, idFactory) {
  const event = String(eventName || "").trim();
  if (!event || !checklistTemplates[templateName]) return [];
  return checklistTemplates[templateName].map(task => ({
    id: idFactory(), values: [event, task, "", "", "À faire"]
  }));
}
export function checklistProgress(rows, eventName) {
  const entries = rows.filter(r => r?.values?.[0] === eventName);
  const total = entries.length;
  const done = entries.filter(r => r.values?.[4] === "Terminée").length;
  return { total, done, percent: total ? Math.round(done / total * 100) : 0 };
}
