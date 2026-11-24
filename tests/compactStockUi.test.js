import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=file=>readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
test('stock cards use small fixed thumbnails with responsive compact rows',()=>{
 const css=source('style.css'),cards=source('RecordCardGrid.jsx');
 assert.match(cards,/className="festapp-record-copy"/);
 assert.match(css,/\[data-category="stock"\] \.festapp-record-preview\{display:grid;grid-template-columns:60px minmax\(0,1fr\)/);
 assert.match(css,/\[data-category="stock"\] \.festapp-record-image\{width:60px;height:60px/);
 assert.match(css,/@media\(min-width:1000px\)\{\[?\.festapp-card-catalog\[data-category="stock"\] \.festapp-record-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test('stock workbench reserves bottom navigation space and general todo drawer stays accessible',()=>{
 const css=source('style.css'),app=source('main.jsx');
 assert.match(app,/data-module=\{tab\}/);
 assert.match(css,/\.festapp-workbench\[open\]\[data-module="stock"\]\{bottom:calc\(88px \+ env\(safe-area-inset-bottom\)\);height:auto/);
 assert.match(css,/main:has\(\.festapp-workbench\[open\]\[data-module="stock"\]\) \.festapp-bottom-nav\{z-index:225\}/);
 assert.match(css,/main:has\(\.festapp-workbench\[open\]\[data-module="stock"\]\) \.festapp-org-overlay\{z-index:224\}/);
});
