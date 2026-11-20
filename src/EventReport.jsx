import React,{useEffect,useMemo,useState} from 'react';
import {buildEventReport,REPORT_NOTE_TYPES} from './lib/eventReport.js';
import {makeEventReportDocx,reportDocxFileName} from './lib/reportDocx.js';

const euro=cents=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(cents/100);
const DOCX_TYPE='application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function downloadFile(blob,name){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30_000);
}

export default function EventReport({data,eventId,readOnly=false,onAddNote,onAddExpense,onClose,onDraftChange}){
 const report=useMemo(()=>buildEventReport(data,eventId),[data,eventId]);
 const [noteType,setNoteType]=useState(REPORT_NOTE_TYPES[0]);
 const [subject,setSubject]=useState('');
 const [details,setDetails]=useState('');
 const [expenseLabel,setExpenseLabel]=useState('');
 const [expenseAmount,setExpenseAmount]=useState('');
 const [email,setEmail]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const dirty=!!(subject.trim()||details.trim()||expenseLabel.trim()||expenseAmount.trim());
 useEffect(()=>{onDraftChange(dirty);return ()=>onDraftChange(false);},[dirty,onDraftChange]);

 function saveNote(e){
  e.preventDefault();
  try{onAddNote({type:noteType,subject,details});setSubject('');setDetails('');setStatus('Note ajoutée au compte rendu et à la sauvegarde locale.');}
  catch(error){setStatus('⚠ '+error.message);}
 }
 function saveExpense(e){
  e.preventDefault();
  try{onAddExpense({label:expenseLabel,amount:expenseAmount});setExpenseLabel('');setExpenseAmount('');setStatus('Dépense provisoire ajoutée aux finances de cette fête.');}
  catch(error){setStatus('⚠ '+error.message);}
 }
 async function makeFile(){
  const blob=await makeEventReportDocx(report);
  return new File([blob],reportDocxFileName(report),{type:DOCX_TYPE});
 }
 async function downloadWord(){
  if(busy)return;setBusy(true);
  try{const file=await makeFile();downloadFile(file,file.name);setStatus('Word téléchargé. Tu peux le modifier et le compléter avant envoi.');}
  catch(error){setStatus('⚠ Export Word impossible : '+error.message);}
  finally{setBusy(false);}
 }
 async function shareWord(){
  if(busy)return;setBusy(true);
  let file;
  try{
   file=await makeFile();
   if(typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:[file]})){
    await navigator.share({files:[file],title:'Compte rendu · '+report.event.name});
    setStatus('Fichier proposé au partage du téléphone. Vérifie le destinataire dans ton application de messagerie.');
   }else{downloadFile(file,file.name);setStatus('Le partage de fichier n’est pas disponible ici. Word téléchargé : joins-le manuellement à un e-mail.');}
  }catch(error){if(error?.name!=='AbortError'){
   if(file){downloadFile(file,file.name);setStatus('Partage indisponible sur ce téléphone : le Word a été téléchargé pour un envoi manuel.');}
   else setStatus('⚠ Export Word impossible : '+error.message);
  }}
  finally{setBusy(false);}
 }
 async function prepareEmail(){
  if(busy)return;
  const recipient=email.trim();
  if(recipient&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)){setStatus('⚠ Adresse e-mail invalide.');return;}
  setBusy(true);
  try{
   const file=await makeFile();downloadFile(file,file.name);
   const subject='Compte rendu '+report.event.name;
   const body=`Bonjour,\n\nVoici le compte rendu de ${report.event.name}.\n\nJoindre le fichier Word téléchargé : ${file.name}\n\nÀ compléter et modifier librement.\n\nComité des fêtes de Liernais`;
   setStatus('Word téléchargé. Un brouillon d’e-mail va s’ouvrir : ajoute le fichier en pièce jointe avant d’envoyer. Aucun message n’est envoyé automatiquement.');
   window.location.href=`mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }catch(error){setStatus('⚠ Préparation impossible : '+error.message);}
  finally{setBusy(false);}
 }

 return <section className="festapp-event-report" aria-label="Compte rendu de la manifestation" id="festapp-event-report">
  <div className="festapp-event-report-heading"><div><small>Compte rendu après la fête</small><h2>{report.event.name}</h2><p>Un bilan Word modifiable pour les réunions du comité.</p></div><button type="button" className="secondary" onClick={onClose}>Fermer</button></div>
  <div className="festapp-report-metrics">
   <div><small>Recettes saisies</small><strong>{euro(report.finance.revenueCents)}</strong></div>
   <div><small>Dépenses saisies</small><strong>{euro(report.finance.expenseCents)}</strong></div>
   <div><small>Solde provisoire</small><strong>{euro(report.finance.balanceCents)}</strong></div>
   <div className="warning"><small>Dont factures en attente</small><strong>{euro(report.finance.pendingExpenseCents)}</strong></div>
  </div>
  <p className="festapp-report-caution">Montants enregistrés sur cet appareil, non rapprochés des justificatifs ni du terminal SumUp. Les dépenses encore inconnues ne sont pas incluses. Ce n’est pas un bilan comptable définitif.</p>
  <div className="festapp-report-columns">
   <div className="festapp-report-section"><h3>Quantités passées</h3><p>Produits vendus en caisse, hors ventes annulées :</p>
    {report.quantities.items.length?<ul>{report.quantities.items.map(row=><li key={row.name}><span>{row.name}</span><strong>{row.quantity}</strong></li>)}</ul>:<p className="muted">Aucune quantité vendue enregistrée.</p>}
    {report.quantities.unreadable.length>0&&<p className="muted">{report.quantities.unreadable.length} ligne(s) de caisse à vérifier.</p>}
    <h3>Achats prévus</h3>{report.shopping.length?<ul>{report.shopping.map((row,index)=><li key={index}><span>{row.article} · {row.status||'À vérifier'}</span><strong>{row.quantity||'?'}</strong></li>)}</ul>:<p className="muted">Aucun achat lié à cette édition.</p>}
   </div>
   <div className="festapp-report-section"><h3>Points notés</h3>
    {[['Point fort','Points forts'],['Point faible','Points faibles'],['Matériel à acheter','Matériel à acheter'],['Quantité utilisée','Quantités réellement utilisées'],['Date prochaine réunion','Prochaine réunion'],['Prochaines manifestations','Prochaines fêtes'],['À ajouter au compte rendu','Autres sujets']].map(([type,title])=><div key={type}><h4>{title} · {report.sections[type].length}</h4>{report.sections[type].map((row,index)=><p key={index}><strong>{row.subject}</strong>{row.details?' — '+row.details:''}</p>)}</div>)}
   </div>
  </div>
  <details className="festapp-report-add" open><summary>＋ Choses à ajouter au compte rendu</summary>
   <p>Points forts, points faibles, matériel à acheter, quantités réellement utilisées, prochaine réunion, prochaines fêtes… Chaque note est conservée dans les Retours de cette fête et dans les sauvegardes.</p>
   <form onSubmit={saveNote}><label>Rubrique<select value={noteType} onChange={e=>setNoteType(e.target.value)}>{REPORT_NOTE_TYPES.map(type=><option key={type} value={type}>{type}</option>)}</select></label><label>Sujet<input value={subject} onChange={e=>setSubject(e.target.value)} maxLength={200} required placeholder={noteType==='Date prochaine réunion'?'Ex. Réunion du bureau le 12 décembre':'Ex. Prévoir deux réchauds supplémentaires'}/></label><label>Précisions<textarea value={details} onChange={e=>setDetails(e.target.value)} maxLength={20000} rows={3} placeholder="Date, lieu, quantité, observations…"/></label><button type="submit" disabled={readOnly||busy}>＋ Enregistrer cette note</button></form>
  </details>
  <details className="festapp-report-add"><summary>＋ Ajouter une dépense sans facture</summary><p>Pour une dépense déjà connue mais dont la facture n’est pas encore arrivée. Elle entre dans le solde provisoire et reste signalée « facture en attente ». Quand la facture arrive, modifie cette écriture dans Bilan financier : ne la saisis pas deux fois.</p><form onSubmit={saveExpense}><label>Libellé<input value={expenseLabel} onChange={e=>setExpenseLabel(e.target.value)} maxLength={200} required placeholder="Ex. Location de la sono"/></label><label>Montant connu ou estimé (€)<input inputMode="decimal" value={expenseAmount} onChange={e=>setExpenseAmount(e.target.value)} required placeholder="Ex. 180,00"/></label><button type="submit" disabled={readOnly||busy}>＋ Ajouter aux dépenses provisoires</button></form></details>
  <div className="festapp-report-export"><h3>Exporter et envoyer</h3><p>Le fichier Word (.docx) peut être corrigé par le destinataire. Il ne contient pas les coordonnées privées de l’annuaire.</p>
   <div className="festapp-report-actions"><button type="button" onClick={downloadWord} disabled={busy}>📄 Télécharger Word</button><button type="button" className="secondary" onClick={shareWord} disabled={busy}>📤 Partager le Word</button></div>
   <label>Adresse e-mail du destinataire (facultatif)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nom@exemple.fr" autoComplete="off"/></label>
   <button type="button" className="secondary" onClick={prepareEmail} disabled={busy}>✉ Préparer l’e-mail</button>
   <p className="festapp-report-caution">Le bouton e-mail ouvre un brouillon : il faut joindre le Word téléchargé. FEST’APP n’envoie aucun message directement. Sur les téléphones compatibles, « Partager le Word » transmet la pièce jointe à l’application choisie.</p>
  </div>
  {status&&<p role="status" className="festapp-report-status">{status}</p>}
 </section>;
}
