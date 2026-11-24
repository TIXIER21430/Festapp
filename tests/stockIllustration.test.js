import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stockIllustrationKind} from '../src/lib/stockIllustration.js';
test('stock names map to distinct illustrations with accents and plurals',()=>{
 for(const [name,kind] of Object.entries({'Fûts de bière 30 L':'keg','Bière blonde':'beer','Vin chaud':'wine','Bouteilles de gaz':'gas','Écocups 25 cl':'cups','Serviettes papier':'napkins','Sacs poubelle':'bags','Coca-Cola':'soda','Eau Cristaline':'water','Sirop de grenadine':'syrup','Café moulu':'coffee','Chocolat chaud':'chocolate','Crème fraîche':'milk','Huile de friture':'oil','Frites surgelées':'fries','Sauce mayonnaise':'sauce','Andouillettes':'meat','Pains panini':'bread','Emmental':'cheese','Œufs':'eggs','Farine':'flour','Sucre en poudre':'sugar','Chamallows':'candy','Oignons':'vegetable','Piles AA':'battery','Article inconnu':'box'}))assert.equal(stockIllustrationKind(name),kind,name);
});
test('stock artwork is local and real photos retain priority',()=>{
 const cards=readFileSync(new URL('../src/RecordCardGrid.jsx',import.meta.url),'utf8');
 const art=readFileSync(new URL('../src/StockIllustration.jsx',import.meta.url),'utf8');
 assert.match(cards,/image\?<img[^>]+\/>:category==='stock'\?<StockIllustration/);
 assert.match(cards,/Quantité : /);
 assert.doesNotMatch(art,/fetch\(|https?:\/\/(?!www\.w3\.org)/);
 for(const kind of ['gas','cups','napkins','bags','cleaning','cutlery','keg','beer','wine','syrup','soda','water','coffee','tea','chocolate','milk','oil','fries','sauce','meat','bread','cheese','eggs','flour','sugar','candy','fruit','vegetable','battery','paper','box'])assert.match(art,new RegExp('\\b'+kind+':'));
});
