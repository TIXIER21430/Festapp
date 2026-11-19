import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/FestivalSettings.jsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');

test('Plus contains two folded menus for event settings and year-by-year balances',()=>{
 assert.match(app,/<FestivalSettings events=\{eventOptions\}/);
 assert.match(ui,/<details className="festapp-settings-menu" aria-label="Gérer les manifestations et leurs dates">/);
 assert.match(ui,/<details className="festapp-settings-menu" aria-label="Bilans des manifestations par année">/);
 assert.match(ui,/<select value=\{selected\}/);
});

test('balance edit actions use exact edition identity and do not assign old Drive files automatically',()=>{
 assert.match(ui,/onOpenFinance\(balance\.editions\[0\]\.id\)/);
 assert.match(ui,/driveBalanceLinks\(driveCatalog,group\.name,selected\)/);
 assert.match(ui,/Les anciens fichiers du Drive ne sont pas comptabilisés automatiquement/);
 assert.match(app,/createHistoricalEdition/);
 assert.match(app,/updateFestival/);
});
