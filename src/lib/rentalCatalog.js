// Source: blank contract dated 18 April 2026, committee Drive.
export const rentalCatalog=[
 ['table','Table (8 places)',600,10000,/^tables?\b/],
 ['banc','Banc (4 places)',200,5000,/^bancs?\b/],
 ['mange-debout','Mange-debout',600,5000,/^manges?[ -]?debouts?\b/],
 ['bar','Bar',2000,50000,/^bars?$/],
 ['barnum-3x3','Barnum (3 × 3 m)',2000,35000,/^(barnums?|tentes?)\b.*3\s*[x×*]\s*3\b/],
 ['barnum-4x6','Barnum (4 × 6 m)',3000,80000,/^(barnums?|tentes?)\b.*4\s*[x×*]\s*6\b/],
 ['crepiere','Crêpière',3000,40000,/^crepieres?\b/],
 ['guirlande','Guirlande lumineuse',2000,35000,/^guirlandes?\b/],
 ['sono','Sono (2 enceintes + 2 batteries)',5000,200000,/^(sono|sonorisation)\b/]
].map(([id,name,priceCents,depositCents,pattern])=>({id,name,priceCents,depositCents,pattern}));
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function rentalEquipment(records){
 return rentalCatalog.map(t=>{
  const matches=records.filter(r=>t.pattern.test(normalize(r.values?.[0])));
  const r=matches.length===1?matches[0]:null;
  return {...t,id:r?.id||'catalog-'+t.id,values:[t.name,r?.values?.[1]||'',r?.values?.[2]||''],linked:!!r};
 });
}
export const rentalTerms=[
 ['UTILISATION DU MATÉRIEL','Le matériel doit être utilisé de manière prudente et appropriée. Son utilisation doit être conforme à toutes les lois et règlementations relatives à la possession, l’utilisation ou l’entretien du matériel.'],
 ['DÉPÔT DE GARANTIE','En plus des frais de location, le locataire devra verser un dépôt de garantie avant de recevoir tout matériel. Ce dépôt sera restitué au locataire à la fin du présent contrat lors de la restitution du matériel, déduction faite des éventuels dommages.'],
 ['LIVRAISON DU MATÉRIEL','Aucune livraison ne sera effectuée. Le locataire devra venir chercher le matériel au local du Comité des Fêtes, 7 place de la fontaine, 21430 Liernais, à la date et heure convenue. Il en sera de même pour sa restitution.'],
 ['RESPONSABILITÉ ET ENTRETIEN DU MATÉRIEL','Le locataire s’engage à maintenir le matériel propre et en bon état de fonctionnement pendant la durée de la location, à ses propres frais. En cas de perte ou d’endommagement irréparable du matériel, le locataire devra payer au propriétaire le coût de remplacement du matériel.'],
 ['ASSURANCE','Le locataire doit être titulaire d’une assurance pour couvrir les dommages causés aux tiers par le matériel. Le locataire est responsable de l’utilisation du matériel et des dommages subis par ce matériel. Il assume la charge des conséquences financières de ces dommages. Le locataire doit fournir la preuve de son assurance à la signature de ce contrat.'],
 ['PROPRIÉTÉ','Le matériel est et restera la propriété exclusive du propriétaire.'],
 ['INTÉGRALITÉ DU CONTRAT','Le présent contrat constitue l’intégralité de l’accord entre les parties et remplace toute entente ou représentation antérieure de quelque nature que ce soit avant la date du présent contrat. Il n’existe aucune autre promesse, condition, entente ou autre accord, oral ou écrit, relatif à l’objet du présent contrat. Le présent contrat peut être modifié par écrit et doit être signé par le propriétaire et le locataire.']
];
