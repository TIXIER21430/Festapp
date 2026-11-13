import React, { useState } from "react";
import { eventDate } from "./domain.js";
import { checklistTemplates, createChecklistItems, checklistProgress, validChecklistStatus } from "./checklists.js";

export default function EventChecklists({ events = [], rows = [], onChange }) {
  const [eventId, setEventId] = useState("");
  const [templateName, setTemplateName] = useState(Object.keys(checklistTemplates)[0]);
  const [taskName, setTaskName] = useState("");
  const [owner, setOwner] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const selectedEvent = events.find(e => e.id === eventId);
  const eventName = selectedEvent?.values?.[0] || "";
  const eventEntries = rows.filter(r => r?.values?.[0] === eventName && eventName);
  const progress = checklistProgress(rows, eventName);

  function addTemplate() {
    if (!eventName) { setMessage("Choisissez d'abord une manifestation."); return; }
    const generated = createChecklistItems(eventName, templateName, () => crypto.randomUUID());
    const existing = new Set(eventEntries.map(r => String(r.values?.[1] || "").trim().toLocaleLowerCase("fr")));
    const newItems = generated.filter(r => !existing.has(r.values[1].toLocaleLowerCase("fr")));
    if (!newItems.length) { setMessage("Toutes les tâches de ce modèle sont déjà présentes."); return; }
    onChange(previous => [...previous, ...newItems]);
    setMessage(newItems.length + " nouvelle(s) tâche(s) ajoutée(s) au programme.");
  }
  function addTask(e) {
    e.preventDefault();
    if (!eventName || !taskName.trim()) return;
    if (deadline && !eventDate(deadline)) { setMessage("L'échéance est invalide."); return; }
    if (eventEntries.some(r => String(r.values?.[1] || "").trim().toLocaleLowerCase("fr") === taskName.trim().toLocaleLowerCase("fr"))) {
      setMessage("Cette tâche existe déjà pour cette manifestation."); return;
    }
    onChange(previous => [...previous, { id: crypto.randomUUID(), values: [eventName, taskName.trim(), owner.trim(), deadline, "À faire"] }]);
    setTaskName(""); setOwner(""); setDeadline(""); setMessage("Tâche ajoutée.");
  }
  function setStatus(id, status) {
    if (!validChecklistStatus.includes(status)) return;
    onChange(previous => previous.map(r => r.id === id ? { ...r, values: [...r.values.slice(0, 4), status] } : r));
  }
  function remove(id) {
    if (!window.confirm("Supprimer cette tâche de préparation ?")) return;
    onChange(previous => previous.filter(r => r.id !== id));
  }
  return <section className="checklist-panel">
    <div className="heading"><h2>🎉 Préparation des manifestations</h2><span className="draft-pill">Fiche locale</span></div>
    <p className="note">Check-lists enregistrées seulement sur cet appareil. Les événements sans date peuvent être préparés aussi. Pour travailler à plusieurs, une base partagée sera nécessaire.</p>
    <label>Choisir une manifestation
      <select value={eventId} onChange={e => { setEventId(e.target.value); setMessage(""); }}>
        <option value="">Sélectionner…</option>
        {events.filter(r => r?.id && r.values?.[0]).map(e => <option key={e.id} value={e.id}>{e.values[0]}{e.values[1] ? " — " + e.values[1] : ""}</option>)}
      </select>
    </label>
    {selectedEvent ? <>
      <div className="event-detail">
        <div><h3>{eventName}</h3><p>{selectedEvent.values[1] || "Date à préciser"} · {selectedEvent.values[2] || "Lieu à préciser"}</p></div>
        <div className="event-progress"><strong>{progress.percent} %</strong><span>{progress.done}/{progress.total} tâches terminées</span></div>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Préparation terminée"><span style={{width: progress.percent + "%"}}/></div>
      <div className="checklist-template">
        <h3>📋 Utiliser un modèle de préparation</h3>
        <div className="checklist-actions">
          <label>Modèle
            <select value={templateName} onChange={e => setTemplateName(e.target.value)}>
              {Object.keys(checklistTemplates).map(name => <option key={name}>{name}</option>)}
            </select>
          </label>
          <button type="button" onClick={addTemplate}>+ Ajouter ce modèle</button>
        </div>
        <small>Les tâches identiques déjà présentes sont ignorées, pour éviter les doublons.</small>
      </div>
      <form className="checklist-form" onSubmit={addTask}>
        <h3>Ajouter une tâche personnalisée</h3>
        <div className="checklist-fields">
          <label>Tâche<input required value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Ex. Contacter la mairie"/></label>
          <label>Responsable<input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Nom du responsable"/></label>
          <label>Échéance<input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}/></label>
        </div>
        <button type="submit">+ Ajouter la tâche</button>
      </form>
      {message && <p className="note" role="status">{message}</p>}
      <h3>Liste de préparation ({progress.total})</h3>
      {eventEntries.length ? <div className="checklist-items">{eventEntries.map(r => <article key={r.id} className={r.values[4] === "Terminée" ? "is-complete" : ""}>
        <label className="checklist-check"><input type="checkbox" checked={r.values[4] === "Terminée"} onChange={e => setStatus(r.id, e.target.checked ? "Terminée" : "À faire")}/><span><strong>{r.values[1]}</strong>{(r.values[2] || r.values[3]) && <small>{[r.values[2], r.values[3]].filter(Boolean).join(" · ")}</small>}</span></label>
        <div className="checklist-item-actions"><select aria-label={"Statut : " + r.values[1]} value={validChecklistStatus.includes(r.values[4]) ? r.values[4] : "À faire"} onChange={e => setStatus(r.id, e.target.value)}>{validChecklistStatus.map(s => <option key={s}>{s}</option>)}</select><button className="delete" type="button" onClick={() => remove(r.id)}>Supprimer</button></div>
      </article>)}</div> : <p>Commencez par ajouter un modèle ou une tâche.</p>}
    </> : <p className="note">Sélectionnez une manifestation ci-dessus. Vous pouvez en créer une dans l'onglet Manifestations.</p>}
  </section>;
}
