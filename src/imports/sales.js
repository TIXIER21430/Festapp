/**
 * Import local d'un export CSV Google Sheets/Excel.
 * Les données restent dans le navigateur et ne sont jamais envoyées au dépôt GitHub.
 */
export function parseDelimited(text, delimiter) {
  const firstLine=text.split(/\r?\n/,1)[0]||"";
  const sep=delimiter || (firstLine.split(";").length>firstLine.split(",").length?";":",");
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}
    else if(c===sep&&!quoted){row.push(field);field=""}
    else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=""}
    else field+=c;
  }
  row.push(field);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
export function importSalesHistory(text) {
  const rows=parseDelimited(text.replace(/^\uFEFF/,""));
  if(rows.length<2)throw new Error("Le fichier doit contenir un en-tête et des lignes.");
  // Fichier économat : première colonne produit, colonnes suivantes = manifestations.
  const headers=rows[0].map(x=>x.trim());
  const productColumn=(!headers[0] || /^unnamed:/i.test(headers[0])) && /^(boisson|produit|article)$/i.test(headers[1]||"") ? 1 : 0;
  const records=[];
  for(const row of rows.slice(1)){
    const product=(row[productColumn]||"").trim();
    if(!product||/^unnamed:/i.test(product))continue;
    for(let i=productColumn+1;i<headers.length;i++){
      const value=(row[i]||"").trim();
      if(value&&headers[i]&&!/^unnamed:/i.test(headers[i]))records.push({product,event:headers[i],quantityText:value});
    }
  }
  return records;
}
