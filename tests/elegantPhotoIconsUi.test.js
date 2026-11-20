import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=name=>readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8');
const photos=source('lib/photoVault.js');
const restore=source('lib/completeZipRestore.js');
const app=source('main.jsx');
const cards=source('RecordCardGrid.jsx');
const equipment=source('EquipmentGrid.jsx');
const hub=source('ManifestationHub.jsx');
const nav=source('BottomNavigation.jsx');
const glyphs=source('ModuleGlyph.jsx');
const css=source('style.css');

test('all record types support local photo attachment, no remote stock-image dependency',()=>{
 assert.match(cards,/PHOTO_CATEGORIES\.filter\(scope=>scope!==['"]equipment['"]\)/);
 assert.match(cards,/savePhotoOriginal\(file,category,selected\.id\)/);
 assert.match(equipment,/savePhotoOriginal\(file,'equipment',selected\.id\)/);
 assert.match(cards,/Ajouter une photo à cette fiche/);
 assert.match(equipment,/Ajouter une photo à ce matériel/);
 assert.match(photos,/festapp-original-photos-v1/);
 assert.match(photos,/db\.transaction\(STORE,"readwrite"\)/);
 assert.match(photos,/existing\.length>=MAX_PHOTOS_TOTAL/);
 assert.match(photos,/existing\.filter\(photo=>photo\.scope===scope\)\.length>=MAX_PHOTOS_PER_SCOPE/);
 assert.doesNotMatch(photos,/(?:fetch\(|https?:\/\/|supabase\.storage)/i);
 assert.match(app,/PHOTO_CATEGORIES\.includes\(tab\)&&tab!=="equipment"/);
});

test('backup restore validates the same photo scopes as the gallery',()=>{
 assert.match(restore,/import \{PHOTO_CATEGORIES/);
 assert.match(restore,/for\(const scope of PHOTO_CATEGORIES\)/);
});

test('thin original vector icons and framed photos are consistent on mobile',()=>{
 assert.match(glyphs,/strokeWidth="1\.7"/);
 for(const kind of ['events','tasks','shopping','stock','ecocups','contacts','shifts','feedback','recipes','finance','equipment','posts','archives']){
  assert.match(glyphs,new RegExp(`\\b${kind}:<>`));
 }
 assert.match(nav,/ModuleGlyph kind=\{key===/);
 assert.match(hub,/ModuleGlyph kind=\{key==='till'\?'finance':key\}/);
 assert.match(css,/\.festapp-icon-frame\{display:grid/);
 assert.match(css,/\.festapp-manif-card \.festapp-manif-icon img/);
 assert.match(css,/@media\(max-width:420px\)/);
});

test('event covers appear on home and revoke local object URLs on cleanup',()=>{
 assert.match(hub,/listPhotoOriginals\('events'\)/);
 assert.match(hub,/URL\.createObjectURL\(photo\.blob\)/);
 assert.match(hub,/URL\.revokeObjectURL\(url\)/);
 assert.match(hub,/eventCovers\.get\(event\.id\)/);
 assert.match(hub,/eventCovers\.get\(chosen\.id\)/);
 assert.match(app,/photoRevision=\{photoRefreshRevision\}/);
});
