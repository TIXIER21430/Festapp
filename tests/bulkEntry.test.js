import test from 'node:test';
import assert from 'node:assert/strict';
import {planBulkEntry,appendBulkEntry} from '../src/lib/bulkEntry.js';

test('pasted spreadsheet rows preview and append without changing existing',()=>{
 const old={stock:[{id:'saved',values:['Coca','25','2']}]};
 const text='Article\tQuantité\tSeuil d\'alerte\nCoca\t25\t2\nPerrier\t8\t3\nCafé\t4\t2';
 const plan=planBulkEntry(text,{category:'stock',existing:old.stock,fields:['Article','Quantité',"Seuil d'alerte"]});
 assert.equal(plan.rows.length,2);assert.equal(plan.duplicates,1);assert.deepEqual(plan.errors,[]);
 let i=0;const added=appendBulkEntry(old,{category:'stock',values:plan.rows,newId:()=>`new-${++i}`});
 assert.equal(added.added,2);assert.deepEqual(added.data.stock[0],old.stock[0]);assert.equal(old.stock.length,1);
 assert.equal(appendBulkEntry(added.data,{category:'stock',values:plan.rows,newId:()=>`ignore`}).added,0);
});

test('quotes, semicolons and local contacts with type validation',()=>{
 const plan=planBulkEntry('"Équipe; musique";groupe;À rappeler\nJean;inconnu;note',{category:'contacts'});
 assert.deepEqual(plan.rows[0],['Équipe; musique','groupe','À rappeler']);
 assert.equal(plan.errors.length,1);
});

test('rejects unsupported categories, excessive lines and invalid records',()=>{
 assert.throws(()=>planBulkEntry('entrée;1;Noël',{category:'ecocups'}));
 assert.throws(()=>planBulkEntry('a\n'.repeat(501),{category:'stock'}));
 assert.throws(()=>appendBulkEntry({stock:[]},{category:'stock',values:[['bad']],newId:()=>1}));
});
