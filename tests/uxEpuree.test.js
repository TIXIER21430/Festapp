import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const app=read('main.jsx');
const hub=read('ManifestationHub.jsx');
const till=read('EventTill.jsx');
const bottom=read('BottomNavigation.jsx');
const css=read('style.css');

test('home is reserved for manifestations and technical tools live under Plus',()=>{
 assert.match(app,/!settingsOpen&&<>\s*<ManifestationHub/);
 assert.match(app,/settingsOpen&&<>\s*<section className="festapp-settings-head"/);
 assert.doesNotMatch(hub,/festapp-owner-cta/);
 assert.match(bottom,/\['settings','⚙️','Plus',onSettings\]/);
});

test('each event shows six main actions and keeps secondary actions behind disclosure',()=>{
 assert.match(hub,/const features=\[[\s\S]*?\['posts','📣','Communication'\]/);
 assert.match(hub,/const secondaryFeatures=\[[\s\S]*?\['feedback','📝','Retours'\]/);
 assert.match(hub,/<details className="festapp-event-more" key=\{chosen.id\}>/);
 assert.match(hub,/onOpenModule\(key,chosen.id\)/);
});

test('a module opens full screen with a back action and preserves its event',()=>{
 assert.match(app,/data-event-scoped=\{!!scopeEvent\}/);
 assert.match(app,/← Retour à \{activeManifestation\?\.values\[0\]/);
 assert.match(css,/\.festapp-workbench\[open\]\{position:fixed/);
 assert.match(app,/Les nouvelles fiches sont automatiquement rattachées à cette fête/);
});

test('till stays in the event and advanced controls do not crowd the payment grid',()=>{
 assert.match(app,/activeManifestation&&tillOpen&&<EventTill/);
 assert.match(till,/onClick=\{onClose\}>← Retour à la fête/);
 assert.match(till,/<details className="festapp-till-settings">/);
 assert.match(till,/elle n’encaisse rien elle-même/);
 assert.match(till,/Enregistrer cette vente/);
});
