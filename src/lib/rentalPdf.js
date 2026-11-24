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
export function makeRentalPdf(loan,{signature=null,logo=null}={}){
 const pages=[];let body='',y=755;
 const validImage=i=>i&&Number.isInteger(i.width)&&Number.isInteger(i.height)&&i.width>0&&i.height>0&&i.width<=1600&&i.height<=1600&&typeof i.hex==='string'&&i.hex.length<=2000000&&/^[0-9a-f]+$/.test(i.hex);
 signature=validImage(signature)?signature:null;logo=validImage(logo)?logo:null;
 function image(name,img,x,y,w,h){const scale=Math.min(w/img.width,h/img.height);body+='q '+(img.width*scale).toFixed(2)+' 0 0 '+(img.height*scale).toFixed(2)+' '+x+' '+y+' cm /'+name+' Do Q\n';}
 function text(value,x,y,size=11,bold=false,color='0.12 0.16 0.22'){
  body+=color+' rg BT /'+(bold?'F2':'F1')+' '+size+' Tf 1 0 0 1 '+x+' '+y+' Tm ('+pdfText(value)+') Tj ET\n';
 }
 function newPage(){
  if(body){pages.push(body);body='';}
  body+='0.13 0.25 0.42 rg 0 780 595 62 re f\n';
  text(loan.kind==='rental'?'CONTRAT DE LOCATION':'BON DE PRÊT',40,812,18,true,'1 1 1');
  text('Comité des fêtes de Liernais',40,791,11,false,'1 1 1');
  if(logo)image('Logo',logo,460,787,95,45);
  else {text('CF',488,805,23,true,'1 1 1');text('LIERNAIS',475,790,9,true,'1 1 1');}
  y=753;
 }
 newPage();
 const raw=loanDocument(loan).split('\n').slice(2);
 for(const line of raw){
  if(!line.trim()){y-=8;continue;}
  const heading=line.length>3&&line===line.toLocaleUpperCase('fr')&&/[A-ZÀÉ]/.test(line);
  const ownerSignature=line.startsWith('Signature du propriétaire :');
  const signatureLine=ownerSignature||line.startsWith('Signature :');
  const parts=wrap(line,heading?65:83);
  const height=parts.length*(heading?17:15)+(heading?8:0)+(signatureLine?60:0);
  if(y-height<60)newPage();
  if(heading)y-=4;
  for(const part of parts){text(part,40,y,heading?12:10.5,heading);y-=heading?17:15;}
  if(ownerSignature&&signature)image('Signature',signature,40,y-45,210,48);
  if(signatureLine)y-=60;
 }
 pages.push(body);
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const images=[];
 for(const [name,img] of [['Logo',logo],['Signature',signature]])if(img){const stream=img.hex+'>\n';images.push('/'+name+' '+(objects.length+1)+' 0 R');objects.push('<< /Type /XObject /Subtype /Image /Width '+img.width+' /Height '+img.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length '+stream.length+' >>\nstream\n'+stream+'endstream');}
 const resources=images.length?' /XObject << '+images.join(' ')+' >>':'';
 const kids=[];
 pages.forEach((stream,i)=>{
  const page=objects.length+1,content=page+1;kids.push(page+' 0 R');
  stream+='0.7 0.75 0.8 RG 40 43 m 555 43 l S\n0.2 0.25 0.3 rg BT /F1 9 Tf 1 0 0 1 40 28 Tm ('+pdfText('Comité des fêtes de Liernais | cfliernais@gmail.com')+') Tj ET\nBT /F1 9 Tf 1 0 0 1 510 28 Tm ('+(i+1)+' / '+pages.length+') Tj ET\n';
  objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'+resources+' >> /Contents '+content+' 0 R >>');
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

// Images stay in the current browser session, never in Git or the shared snapshot.
export async function loadRentalImage(file){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5000000)throw Error('Choisis une image PNG, JPEG ou WebP de 5 Mo maximum.');
 const bitmap=await createImageBitmap(file);
 try{const scale=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',0.86).split(',')[1];const hex=Array.from(atob(data),s=>s.charCodeAt(0).toString(16).padStart(2,'0')).join('');return {width:canvas.width,height:canvas.height,hex};}finally{bitmap.close();}
}
