import {zipFiles} from './photoZip.js';

const MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const euro=cents=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(cents/100);
const escapeXml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const xmlHeader='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function para(text,style='Normal'){
 const lines=String(text??'').split(/\r?\n/);
 const runs=lines.map((line,index)=>`${index?'<w:br/>':''}<w:t xml:space="preserve">${escapeXml(line)}</w:t>`).join('');
 return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r>${runs}</w:r></w:p>`;
}

function table(headers,rows){
 const header=(cells,top,index)=>`<w:tr>${cells.map(cell=>`<w:tc><w:tcPr><w:shd w:fill="${top?'DDE9F6':index%2?'F4F7FB':'FFFFFF'}"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>${para(cell,top?'TableHeading':'TableText')}</w:tc>`).join('')}</w:tr>`;
 return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(side=>`<w:${side} w:val="single" w:sz="4" w:color="D9D9D9"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid>${headers.map(()=>'<w:gridCol w:w="3000"/>').join('')}</w:tblGrid>${header(headers,true,0)}${rows.map((row,index)=>header(row,false,index)).join('')}</w:tbl>`;
}

function sectionNotes(title,notes,empty='À compléter après la manifestation.'){
 let output=para(title,'Heading1');
 if(!notes.length)return output+para(empty);
 for(const note of notes){
  output+=para(note.subject,'Heading2');
  if(note.details)output+=para(note.details);
 }
 return output;
}

function reportBody(report){
 const {event,finance,shopping,quantities,sections,otherNotes}=report;
 let content=para('Compte rendu de manifestation','Title');
 content+=para(`Comité des fêtes de Liernais · ${event.name}`,'Subtitle');
 content+=para(`Date : ${event.date||'à préciser'}    Lieu : ${event.place||'à préciser'}`);
 content+=para('Bilan de travail pour le comité. Les chiffres sont ceux saisis dans FEST’APP sur cet appareil et restent à rapprocher des factures, de la caisse et de SumUp avant validation.');

 content+=para('Bilan financier provisoire','Heading1');
 content+=table(['Indicateur','Montant'],[
  ['Recettes enregistrées',euro(finance.revenueCents)],
  ['Dépenses saisies (factures reçues ou non)',euro(finance.expenseCents)],
  ['Dont factures en attente (déjà incluses)',euro(finance.pendingExpenseCents)],
  ['Solde provisoire',euro(finance.balanceCents)]
 ]);
 if(finance.pending.length){
  content+=para('Factures encore en attente','Heading2');
  content+=table(['Dépense','Montant saisi'],finance.pending.map(x=>[x.label,euro(x.amountCents)]));
 }
 if(finance.entries.length){
  content+=para('Détail des écritures','Heading2');
  content+=table(['Libellé','Nature','Montant'],finance.entries.map(x=>[x.label,x.nature||'À vérifier',euro(x.amountCents)]));
 }else content+=para('Aucune écriture financière enregistrée pour cette édition.');
 if(finance.unclassified.length){
  content+=para('Écritures à vérifier hors calcul','Heading2');
  content+=table(['Libellé','Montant saisi','Nature'],finance.unclassified.map(x=>[x.label,x.amountCents===null?'Invalide':euro(x.amountCents),x.nature||'Non classée']));
 }

 content+=para('Quantités vendues en caisse','Heading1');
 if(quantities.items.length)content+=table(['Produit','Quantité totale vendue'],quantities.items.map(x=>[x.name,String(x.quantity)]));
 else content+=para('Aucune quantité détaillée enregistrée en caisse pour cette édition.');
 if(quantities.unreadable.length)content+=para(`${quantities.unreadable.length} ligne(s) de vente non interprétable(s) : détail à vérifier dans la caisse.`);
 content+=para('Achats et quantités prévues','Heading1');
 if(shopping.length)content+=table(['Article','Quantité prévue','État'],shopping.map(x=>[x.article,x.quantity||'À préciser',x.status||'À vérifier']));
 else content+=para('Aucun achat rattaché à cette édition.');
 content+=sectionNotes('Quantités réellement utilisées',sections['Quantité utilisée'],'À noter après inventaire : quantités réellement consommées, indépendamment des ventes.');

 content+=sectionNotes('Points forts',sections['Point fort']);
 content+=sectionNotes('Points faibles et améliorations',sections['Point faible']);
 content+=sectionNotes('Matériel à acheter pour la prochaine fois',sections['Matériel à acheter']);
 content+=sectionNotes('Date de la prochaine réunion',sections['Date prochaine réunion'],'Date et lieu à convenir.');
 content+=sectionNotes('Prochaines manifestations',sections['Prochaines manifestations'],'Dates à confirmer.');
 content+=sectionNotes('Choses à ajouter au compte rendu',sections['À ajouter au compte rendu'],'Autres sujets à noter en réunion.');
 if(otherNotes.length)content+=sectionNotes('Autres retours de la fête',otherNotes.map(n=>({subject:n.subject+(n.type?` · ${n.type}`:''),details:n.details})));
 return content;
}

const styles=xmlHeader+`<w:styles xmlns:w="${NS}">
 <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="150" w:line="290" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:color w:val="172334"/><w:sz w:val="22"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="220"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="36"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="260"/></w:pPr><w:rPr><w:color w:val="000000"/><w:sz w:val="24"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="330" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="28"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="23"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="TableHeading"><w:name w:val="Table Heading"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="20"/></w:rPr></w:style>
 <w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>
 </w:styles>`;

export function reportDocxFileName(report){
 const name=report.event.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,75)||'manifestation';
 return `FESTAPP-compte-rendu-${name}.docx`;
}

export async function makeEventReportDocx(report){
 if(!report?.event?.id||!report?.finance||!report?.sections)throw new TypeError('Compte rendu invalide.');
 const count=report.finance.entries.length+report.finance.unclassified.length+report.shopping.length+Object.values(report.sections).reduce((sum,rows)=>sum+rows.length,0);
 if(count>3000)throw new RangeError('Trop de lignes pour un document Word. Exportez les données en CSV avant de réessayer.');
 const documentXml=xmlHeader+`<w:document xmlns:w="${NS}"><w:body>${reportBody(report)}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1000" w:bottom="1080" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
 const files=[
  {name:'[Content_Types].xml',blob:new Blob([xmlHeader+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'])},
  {name:'_rels/.rels',blob:new Blob([xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'])},
  {name:'word/_rels/document.xml.rels',blob:new Blob([xmlHeader+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'])},
  {name:'word/styles.xml',blob:new Blob([styles])},
  {name:'word/document.xml',blob:new Blob([documentXml])}
 ];
 const zip=await zipFiles(files);
 return new Blob([zip],{type:MIME});
}
