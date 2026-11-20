// Prêts de la démonstration locale : journal append-only, sans Supabase.
// Chaque ligne reste compatible avec les sauvegardes FEST'APP (3 valeurs texte).
// values = [equipmentId, emprunteur, JSON({quantity,destination,outDate,dueDate,returns})]
const MAX_QUANTITY = 1000000;
const isDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const text = (value, limit = 200) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= limit;
const quantity = value => Number.isSafeInteger(value) && value >= 1 && value <= MAX_QUANTITY;

export function readEquipmentLoan(row) {
  if (!row || typeof row.id !== 'string' || !row.id || !Array.isArray(row.values) || row.values.length !== 3 ||
      !text(row.values[0]) || !text(row.values[1])) throw new TypeError('Prêt de matériel invalide');
  let info;
  try { info = JSON.parse(row.values[2]); } catch { throw new TypeError('Historique de prêt illisible'); }
  if (!info || typeof info !== 'object' || Array.isArray(info) ||
      Object.keys(info).sort().join(',') !== 'destination,dueDate,outDate,quantity,returns' ||
      !quantity(info.quantity) || !text(info.destination) || !isDate(info.outDate) ||
      (info.dueDate !== null && (!isDate(info.dueDate) || info.dueDate < info.outDate)) ||
      !Array.isArray(info.returns) || info.returns.length > 1000) throw new TypeError('Prêt de matériel incohérent');
  const seen = new Set();
  let returned = 0;
  for (const entry of info.returns) {
    if (!entry || Object.keys(entry).sort().join(',') !== 'date,id,quantity' ||
        !text(entry.id) || seen.has(entry.id) || !quantity(entry.quantity) ||
        !isDate(entry.date) || entry.date < info.outDate) throw new TypeError('Retour de matériel incohérent');
    seen.add(entry.id);
    returned += entry.quantity;
    if (!Number.isSafeInteger(returned) || returned > info.quantity) throw new RangeError('Retours supérieurs au prêt');
  }
  return { id: row.id, equipmentId: row.values[0], borrower: row.values[1],
    ...info, returned, remaining: info.quantity - returned };
}

export function availableEquipment(equipment, loans) {
  if (!equipment || typeof equipment.id !== 'string' || !Array.isArray(equipment.values)) throw new TypeError('Fiche matériel invalide');
  const count = Number(equipment.values[1]);
  if (!/^\d+$/.test(String(equipment.values[1] || '').trim()) || !Number.isSafeInteger(count) || count < 0 || count > MAX_QUANTITY) {
    throw new TypeError('Quantité totale du matériel à préciser');
  }
  let outside = 0;
  for (const row of loans) {
    const loan = readEquipmentLoan(row);
    if (loan.equipmentId === equipment.id) outside += loan.remaining;
  }
  if (!Number.isSafeInteger(outside) || outside > count) throw new RangeError('Prêts supérieurs au matériel enregistré');
  return { total: count, outside, available: count - outside };
}

export function createEquipmentLoan(input, equipment, existingLoans, id) {
  if (!text(id) || existingLoans.some(row => row.id === id)) throw new TypeError('Identifiant de prêt déjà utilisé');
  if (!input || !text(input.borrower) || !text(input.destination) || !quantity(input.quantity) ||
      !isDate(input.outDate) || (input.dueDate !== null && (!isDate(input.dueDate) || input.dueDate < input.outDate))) {
    throw new TypeError('Renseignez qui, où, les dates et une quantité entière positive');
  }
  const item = equipment.find(row => row.id === input.equipmentId);
  if (!item) throw new TypeError('Matériel introuvable');
  if (availableEquipment(item, existingLoans).available < input.quantity) throw new RangeError('Quantité disponible insuffisante');
  const info = { quantity: input.quantity, destination: input.destination.trim(), outDate: input.outDate,
    dueDate: input.dueDate, returns: [] };
  return { id, values: [item.id, input.borrower.trim(), JSON.stringify(info)] };
}

export function recordEquipmentReturn(row, input) {
  const loan = readEquipmentLoan(row);
  if (!input || !text(input.id) || !quantity(input.quantity) || !isDate(input.date) ||
      input.date < loan.outDate) throw new TypeError('Retour invalide : quantité et date à vérifier');
  if (loan.returns.some(item => item.id === input.id)) throw new TypeError('Retour déjà enregistré');
  if (input.quantity > loan.remaining) throw new RangeError('Retour supérieur au restant à rendre');
  const { returned, remaining, id, equipmentId, borrower, ...info } = loan;
  return { ...row, values: [equipmentId, borrower, JSON.stringify({
    quantity: info.quantity, destination: info.destination, outDate: info.outDate,
    dueDate: info.dueDate, returns: [...info.returns, { id: input.id, quantity: input.quantity, date: input.date }]
  })] };
}
