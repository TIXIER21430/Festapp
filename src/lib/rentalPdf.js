import {loanDocument} from './equipmentLoans.js';

// A local, self-contained PDF generator: no customer data leaves the device.
// Standard Helvetica fonts with WinAnsi encoding for French accents.
const cp1252={'€':128,'’':146,'‘':145,'“':147,'”':148,'–':150,'—':151,'œ':156,'Œ':140,'…':133,'Ÿ':159};
function pdfText(value){
 return Array.from(String(value).normalize('NFC').replace(/[\u202f\u00a0]/g,' ')).map(c=>{
  const n=cp1252[c]??c.charCodeAt(0);
  return n>=32&&n<=255?'\\'+n.toString(8).padStart(3,'0'):'?';
 }).join('');
}
function wrap(text,width=82){
 const lines=[];let line='';
 for(const word of text.split(/\s+/)){
  if(!word)continue;
  if(line&&line.length+word.length+1>width){lines.push(line);line='';}
  if(word.length>width){
   if(line){lines.push(line);line='';}
   for(let i=0;i<word.length;i+=width)lines.push(word.slice(i,i+width));
  }else line+=(line?' ':'')+word;
 }
 if(line)lines.push(line);
 return lines.length?lines:[''];
}
export function makeRentalPdf(loan){
 const pages=[];let body='',y=755;
 function text(value,x,y,size=11,bold=false,color='0.12 0.16 0.22'){
  body+=color+' rg BT /'+(bold?'F2':'F1')+' '+size+' Tf 1 0 0 1 '+x+' '+y+' Tm ('+pdfText(value)+') Tj ET\n';
 }
 function newPage(){
  if(body){pages.push(body);body='';}
  body+='0.13 0.25 0.42 rg 0 780 595 62 re f\n';
  text(loan.kind==='rental'?'CONTRAT DE LOCATION':'BON DE PRÊT',40,812,18,true,'1 1 1');
  text('Comité des fêtes de Liernais',40,791,11,false,'1 1 1');
  y=753;
 }
 newPage();
 const raw=loanDocument(loan).split('\n').slice(2);
 for(const line of raw){
  if(!line.trim()){y-=8;continue;}
  const heading=line.length>3&&line===line.toLocaleUpperCase('fr')&&/[A-ZÀÉ]/.test(line);
  const signature=line.startsWith('Signature :');
  const parts=wrap(line,heading?65:83);
  const height=parts.length*(heading?17:15)+(heading?8:0)+(signature?40:0);
  if(y-height<60)newPage();
  if(heading)y-=4;
  for(const part of parts){text(part,40,y,heading?12:10.5,heading);y-=heading?17:15;}
  if(signature)y-=40;
 }
 pages.push(body);
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const kids=[];
 pages.forEach((stream,i)=>{
  const page=objects.length+1,content=page+1;kids.push(page+' 0 R');
  stream+='0.7 0.75 0.8 RG 40 43 m 555 43 l S\n0.2 0.25 0.3 rg BT /F1 9 Tf 1 0 0 1 40 28 Tm ('+pdfText('Comité des fêtes de Liernais | cfliernais@gmail.com')+') Tj ET\nBT /F1 9 Tf 1 0 0 1 510 28 Tm ('+(i+1)+' / '+pages.length+') Tj ET\n';
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+content+' 0 R >>');
  objects.push('<< /Length '+stream.length+' >>\nstream\n'+stream+'endstream');
 });
 objects[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+pages.length+' >>';
 let pdf='%PDF-1.4\n';const offsets=[0];
 objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=(i+1)+' 0 obj\n'+obj+'\nendobj\n';});
 const xref=pdf.length;
 pdf+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 return new Blob([pdf],{type:'application/pdf'});
}
export function rentalPdfName(loan){return 'FESTAPP-'+(loan.kind==='rental'?'contrat':'pret')+'-'+loan.id+'.pdf';}
