import React, { useEffect, useMemo, useState } from "react";

const tones = ["Chaleureux", "Festif", "Professionnel", "Remerciements"];
const purposes = ["Annonce", "Rappel", "Bilan", "Remerciement"];
function normalize(text) { return String(text || "").trim(); }

/**
 * Générateur de brouillons 100 % local, basé sur des modèles.
 * Aucune API IA, aucune connexion à Facebook et aucune photo enregistrée.
 */
export function composePost({ event, date, place, tone, purpose, details }) {
  const name = normalize(event);
  if (!name) return "";
  const intro = {
    Chaleureux: "❤️ On se retrouve bientôt à Liernais !",
    Festif: "🎉 La fête se prépare à Liernais !",
    Professionnel: "📣 Le Comité des fêtes de Liernais vous informe.",
    Remerciements: "💛 Un grand merci à toutes et à tous !"
  }[tone] || "🎉 À bientôt à Liernais !";
  const action = {
    Annonce: `Nous avons le plaisir de vous annoncer : ${name}.`,
    Rappel: `Petit rappel : ${name} approche !`,
    Bilan: `Retour sur ${name} : un beau moment partagé !`,
    Remerciement: `Merci à toutes les personnes qui ont participé à ${name} !`
  }[purpose] || `Rendez-vous pour ${name}.`;
  const when = normalize(date) ? `📅 ${normalize(date)}` : "";
  const where = normalize(place) ? `📍 ${normalize(place)}` : "";
  const extra = normalize(details);
  const ending = purpose === "Remerciement" || purpose === "Bilan"
    ? "Merci aux bénévoles, partenaires et participants. À très bientôt !"
    : "Partagez l'information autour de vous !";
  return [intro, action, when, where, extra, ending, "#Liernais #ComitéDesFêtes"].filter(Boolean).join("\n\n");
}

export default function Communication({ events = [] }) {
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [tone, setTone] = useState(tones[0]);
  const [purpose, setPurpose] = useState(purposes[0]);
  const [details, setDetails] = useState("");
  const [post, setPost] = useState("");
  const [photos, setPhotos] = useState([]);
  const [copyStatus, setCopyStatus] = useState("");
  const sourceEvents = useMemo(() => events.filter(r => r && Array.isArray(r.values)), [events]);

  useEffect(() => () => photos.forEach(p => URL.revokeObjectURL(p.url)), [photos]);

  function selectEvent(value) {
    setEvent(value);
    const found = sourceEvents.find(r => r.values[0] === value);
    setDate(found?.values[1] || "");
    setPlace(found?.values[2] || "");
  }

  function setSelectedPhotos(files) {
    const list = Array.from(files || []).slice(0, 6);
    const safe = list.filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 8_000_000);
    if (list.length !== safe.length) window.alert("Maximum 6 images JPG, PNG ou WebP de 8 Mo chacune. Certains fichiers ont été ignorés.");
    setPhotos(safe.map(file => ({ name: file.name, url: URL.createObjectURL(file) })));
  }

  async function copyPost() {
    if (!post.trim()) return;
    try {
      await navigator.clipboard.writeText(post);
      setCopyStatus("Texte copié. Vérifiez-le avant de le publier.");
    } catch {
      setCopyStatus("Copie impossible : sélectionnez le texte ci-dessous pour le copier manuellement.");
    }
  }

  return <section className="communication-panel">
    <div className="heading"><h2>📸 Communication</h2><span className="draft-pill">Brouillon local</span></div>
    <p className="note">Préparez une publication avec un modèle local. <strong>Il ne s'agit pas encore d'une génération par IA.</strong> Aucune publication automatique ni sauvegarde de photos.</p>
    <div className="communication-grid">
      <label>Manifestation
        <input list="communication-event-list" value={event} onChange={e => selectEvent(e.target.value)} placeholder="Ex. Marché de Noël" />
        <datalist id="communication-event-list">{sourceEvents.map(r => <option key={r.id} value={r.values[0]}/>)}</datalist>
      </label>
      <label>Date (optionnelle)<input value={date} onChange={e => setDate(e.target.value)} placeholder="Ex. Samedi 12 décembre"/></label>
      <label>Lieu (optionnel)<input value={place} onChange={e => setPlace(e.target.value)} placeholder="Ex. Salle des fêtes de Liernais"/></label>
      <label>Objectif<select value={purpose} onChange={e => setPurpose(e.target.value)}>{purposes.map(p => <option key={p}>{p}</option>)}</select></label>
      <label>Ton<select value={tone} onChange={e => setTone(e.target.value)}>{tones.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="communication-wide">Détails à inclure<textarea rows="3" value={details} onChange={e => setDetails(e.target.value)} placeholder="Programme, horaires, partenaires, tarifs… (vérifiez toutes les informations)"/></label>
    </div>
    <div className="communication-actions"><button type="button" disabled={!event.trim()} onClick={() => {setPost(composePost({event,date,place,tone,purpose,details}));setCopyStatus("");}}>✨ Préparer le texte</button></div>
    {post && <div className="communication-preview"><label htmlFor="festapp-post">Texte modifiable avant publication</label><textarea id="festapp-post" rows="11" value={post} onChange={e => setPost(e.target.value)}/><div className="communication-actions"><button type="button" onClick={copyPost}>📋 Copier le texte</button><a className="communication-link" href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Ouvrir Facebook ↗</a></div>{copyStatus && <p role="status" className="note">{copyStatus}</p>}</div>}
    <div className="photo-preview"><h3>📷 Photos pour la publication</h3><label>Choisir des photos (aperçu uniquement)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => {setSelectedPhotos(e.target.files);e.target.value = "";}} /></label>{photos.length > 0 && <div className="photo-grid">{photos.map(p => <figure key={p.url}><img src={p.url} alt={p.name}/><figcaption>{p.name}</figcaption></figure>)}</div>}<p className="note">Les photos ne quittent pas cet appareil et disparaissent en changeant de session. Vérifiez les autorisations des personnes photographiées, particulièrement les mineurs, avant toute publication.</p></div>
  </section>;
}
