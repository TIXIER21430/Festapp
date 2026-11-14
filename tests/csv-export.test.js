import test from 'node:test';
import assert from 'node:assert/strict';
import { exportCsv, FESTAPP_CSV_COLUMNS } from '../src/csv-export.js';
test('CSV Excel FR: BOM, semicolon, CRLF and accents', () => {
  const csv=exportCsv([{key:'name',label:'Nom'}],[{name:'Marché de Noël'}]);
  assert.equal(csv,'\uFEFF"Nom"\r\n'.replace('"Nom"\r\n','"Nom"\r\n') .replace('"Nom"\r\n','"Nom"\r\n') && '\uFEFF"Nom"\r\n"Marché de Noël"\r\n');
});
test('quotes and separators escaped',()=>{
  assert.match(exportCsv([{key:'v',label:'Valeur'}],[{v:'a;"b"'}]), /"a;""b"""/);
});
test('spreadsheet formula injection neutralized',()=>{
  for(const v of ['=1+1','+cmd','-2+3','@SUM(A1)',' \t=HYPERLINK(1)']) {
    assert.ok(exportCsv([{key:'v',label:'V'}],[{v}]).includes('"\''+v+'"'));
  }
});
test('no mutation of source rows',()=>{
  const rows=[Object.freeze({v:'=1'})];
  exportCsv([{key:'v',label:'V'}],rows);
  assert.equal(rows[0].v,'=1');
});
test('exports have stable identifiers for linking',()=>{
  for(const cols of Object.values(FESTAPP_CSV_COLUMNS)) assert.equal(cols[0].key,'id');
  assert.ok(FESTAPP_CSV_COLUMNS.tasks.some(c=>c.key==='event_id'));
});
test('invalid inputs rejected',()=>{
  assert.throws(()=>exportCsv([],[]),TypeError);
  assert.throws(()=>exportCsv([{key:'a',label:'A'}],null),TypeError);
});
