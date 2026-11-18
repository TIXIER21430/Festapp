// An event workspace only shows records explicitly linked to that event.
// The old Drive bilans may mention an event in free text, but that is not
// evidence that they belong to its current edition.
export const EVENT_SCOPED_MODULES=new Set(['tasks','shopping','stock','shifts','feedback','recipes','finance','equipment','posts','archives']);

export function recordsForManifestation(rows,moduleKey,eventId=''){
 if(!Array.isArray(rows))throw new TypeError('Fiches invalides.');
 if(!eventId||!EVENT_SCOPED_MODULES.has(moduleKey))return rows;
 // Les recettes originales du comité sont communes à toutes les fêtes.
 // Une recette propre à une édition ne doit pas apparaître chez les autres.
 if(moduleKey==='recipes')return rows.filter(row=>!row?.eventId||row.eventId===eventId);
 return rows.filter(row=>row?.eventId===eventId);
}

export function withRecordEventId(record,eventId=''){
 if(typeof eventId!=='string')throw new TypeError('Manifestation invalide.');
 const {eventId:previous,...rest}=record;
 return eventId?{...rest,eventId}:{...rest};
}
