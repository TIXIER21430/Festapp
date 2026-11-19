// Drafts written locally from event facts; this is not an AI service or a Facebook API.
const tidy=value=>String(value??"").trim().slice(0,180);
export function createEventPostDraft({name,date="",place="",kind="annonce",tone="chaleureux"}={}){
 const event=tidy(name);
 if(!event)throw new TypeError("Choisissez une manifestation.");
 if(!["annonce","remerciement","rappel"].includes(kind)||!["chaleureux","dynamique"].includes(tone))throw new TypeError("Type de publication invalide.");
 const where=tidy(place),when=tidy(date);
 const details=[when?`📅 ${when}`:"",where?`📍 ${where}`:""].filter(Boolean).join("\n");
 let title,body;
 if(kind==="remerciement"){
  title=`Merci pour ${event} !`;
  body=tone==="dynamique"
   ?`🎉 Quelle belle énergie pour ${event} ! Un immense MERCI aux bénévoles, aux participants et à tous ceux qui ont donné un coup de main. ❤️`
   :`❤️ Merci à toutes et tous pour ce beau moment autour de ${event}. Grâce aux bénévoles et aux participants, cette fête a pris vie !`;
 }else if(kind==="rappel"){
  title=`${event} : on vous attend !`;
  body=tone==="dynamique"
   ?`📢 C'est bientôt ${event} ! Prêts à faire la fête avec nous ? 🎊`
   :`🎈 Petit rappel : ${event} approche. On espère vous retrouver nombreux pour partager un bon moment !`;
 }else{
  title=`À venir : ${event}`;
  body=tone==="dynamique"
   ?`🎊 Rendez-vous pour ${event} ! Le Comité des fêtes de Liernais vous prépare un beau moment. Venez nombreux !`
   :`✨ Le Comité des fêtes de Liernais vous donne rendez-vous pour ${event}. Nous serons heureux de vous retrouver pour un moment convivial !`;
 }
 return {title,body:[body,details,"ℹ️ Horaires, programme et informations à vérifier avant publication.","#Liernais #ComitéDesFêtes"].filter(Boolean).join("\n\n")};
}
