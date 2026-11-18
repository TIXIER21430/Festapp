// A no-cost prompt composer. It never contacts an AI service.
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,4000);
const knownKinds=new Set(['post','recipe','event']);
export function buildFreeAiPrompt({kind='post',event=null,recipe=null,servings=50}={}){
 if(!knownKinds.has(kind))throw new TypeError('Type d’aide inconnu.');
 const eventName=clean(event?.values?.[0]);
 const eventDate=clean(event?.values?.[1]);
 const eventPlace=clean(event?.values?.[2]);
 const eventInfo=`Manifestation : ${eventName||'à préciser'}\nDate et horaires : ${eventDate||'à vérifier'}\nLieu : ${eventPlace||'à vérifier'}`;
 const footer='N’invente aucune date, aucun prix, aucun nom ni aucune quantité. Mets « à vérifier » si une information manque. Réponds en français, clairement, pour une petite association bénévole.';
 if(kind==='post')return `Tu aides le Comité des fêtes de Liernais à préparer un brouillon Facebook chaleureux. Propose un titre, un texte court et trois hashtags pertinents, sans publier quoi que ce soit.\n${eventInfo}\n${footer}`;
 if(kind==='event')return `Tu aides le Comité des fêtes de Liernais à organiser sa manifestation. Prépare une check-list simple : avant, veille, jour J, lendemain. Ajoute les postes bénévoles et le matériel à contrôler. Ne considère rien comme déjà acheté ou réservé.\n${eventInfo}\n${footer}`;
 const target=Number(servings);
 if(!Number.isSafeInteger(target)||target<1||target>10000)throw new RangeError('Nombre de convives invalide.');
 const name=clean(recipe?.values?.[0])||'recette à préciser';
 const body=clean(recipe?.values?.[1]);
 return `Tu aides le Comité des fêtes de Liernais à adapter une recette pour ${target} personnes. Conserve les unités et distingue les ingrédients des étapes. Si le nombre de portions de la recette originale est inconnu, demande-le avant tout calcul.\nRecette : ${name}\nTexte original : ${body||'[Colle ici le texte de la recette ou joins une photo directement dans ChatGPT.]'}\n${footer}`;
}
