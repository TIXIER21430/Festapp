// Comparison only. No reservation, subtraction, or movement of physical stock.
function normalized(value){return String(value||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("fr");}
function amount(value){const raw=String(value??"").trim().replace(",",".");return /^(0|[1-9]\d*)(?:\.\d+)?$/.test(raw)&&Number.isFinite(Number(raw))?Number(raw):null;}
export function compareShoppingWithStock(shopping,stock,eventId){
 if(!Array.isArray(shopping)||!Array.isArray(stock)||typeof eventId!=="string")throw new TypeError("Invalid inventory");
 return shopping.filter(row=>row?.eventId===eventId).map(row=>{
  const name=String(row.values?.[0]||"");
  const matches=stock.filter(item=>normalized(item?.values?.[0])===normalized(name));
  const needed=amount(row.values?.[1]);
  const available=matches.length===1?amount(matches[0].values?.[1]):null;
  let status="À vérifier",toBuy=null;
  if(matches.length>1)status="Doublons dans le stock";
  else if(matches.length===0)status="Non trouvé dans le stock";
  else if(needed===null||available===null)status="Quantité à préciser";
  else{toBuy=Math.max(0,needed-available);status=toBuy===0?"Stock théoriquement suffisant":"Complément à prévoir";}
  return {id:row.id,name,needed,available,toBuy,status};
 });
}

export function summarizeStockComparison(rows){
 if(!Array.isArray(rows))throw new TypeError("Invalid stock comparison");
 return rows.reduce((summary,row)=>{
  summary.total++;
  if(row.status==="Stock théoriquement suffisant")summary.sufficient++;
  else if(row.status==="Complément à prévoir")summary.shortage++;
  else summary.verify++;
  return summary;
 },{total:0,sufficient:0,shortage:0,verify:0});
}
