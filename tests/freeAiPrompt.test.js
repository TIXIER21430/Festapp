import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildFreeAiPrompt} from '../src/lib/freeAiPrompt.js';

const event={id:'e1',values:['Marché de Noël 2026','05/12/2026, 14h–22h','Liernais']};

test('free assistant generates a reviewable event prompt without inventing dates or prices',()=>{
 const result=buildFreeAiPrompt({kind:'post',event});
 assert.match(result,/05\/12\/2026/);
 assert.match(result,/sans publier/);
 assert.match(result,/N’invente aucune date, aucun prix/);
 assert.match(buildFreeAiPrompt({kind:'event',event}),/check-list simple/);
});

test('recipe prompt requires realistic headcount and does not fabricate portions',()=>{
 const recipe={values:['Crêpes','300 g farine\n3 œufs\n50 cl lait','']};
 const result=buildFreeAiPrompt({kind:'recipe',recipe,servings:50});
 assert.match(result,/50 personnes/);
 assert.match(result,/300 g farine/);
 assert.match(result,/demande-le avant tout calcul/);
 assert.throws(()=>buildFreeAiPrompt({kind:'recipe',recipe,servings:0}),/invalide/);
 assert.throws(()=>buildFreeAiPrompt({kind:'recipe',recipe,servings:10001}),/invalide/);
});

test('unknown kinds rejected and missing data marked for human confirmation',()=>{
 assert.throws(()=>buildFreeAiPrompt({kind:'auto-publish'}),/inconnu/);
 assert.match(buildFreeAiPrompt({kind:'post'}),/à vérifier/);
});

test('free assistant is explicit copy-and-open, never an embedded paid API or automatic transmission',()=>{
 const source=readFileSync(new URL('../src/FreeAiHelper.jsx',import.meta.url),'utf8');
 assert.match(source,/navigator\.clipboard\.writeText/);
 assert.match(source,/href="https:\/\/chatgpt\.com\/"/);
 assert.match(source,/Rien n’est envoyé automatiquement/);
 assert.doesNotMatch(source,/(fetch\(|supabase|api\.openai\.com|window\.open\()/i);
});
