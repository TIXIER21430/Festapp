import test from "node:test";
import assert from "node:assert/strict";
import {scaleIngredients,shoppingList} from "../src/recipes/calculator.js";
import {parseDelimited,importSalesHistory} from "../src/imports/sales.js";
import {taskTemplates} from "../src/imports/taskTemplates.js";
import {initialSalesHistory} from "../src/imports/initialSales.js";

test("recettes : multiplier les portions",()=>{
 const result=scaleIngredients([{name:"farine",unit:"g",quantity:200}],4,10);
 assert.equal(result[0].quantity,500);
});
test("recettes : consolider les courses",()=>{
 const list=shoppingList([{servings:2,ingredients:[{name:"sucre",unit:"g",quantity:50}]},{servings:2,ingredients:[{name:"Sucre",unit:"g",quantity:25}]}]);
 assert.equal(list.length,1);assert.equal(list[0].quantity,75);
});
test("CSV : gérer champs entre guillemets",()=>{
 assert.deepEqual(parseDelimited('Produit;Fête\n"Vin; chaud";Noël'),[["Produit","Fête"],["Vin; chaud","Noël"]]);
});
test("CSV : ignorer colonnes vides",()=>{
 const records=importSalesHistory("Produit;Noël;Carnaval\nCoca;10;\nEau;;5");
 assert.equal(records.length,2);
});
test("modèles : tâches sans doublons d'identifiant",()=>{
 assert.ok(taskTemplates.length>80);
 assert.equal(new Set(taskTemplates.map(t=>t.id)).size,taskTemplates.length);
});
test("ventes : données historiques chargées",()=>{
 assert.ok(initialSalesHistory.length>20);
 assert.ok(initialSalesHistory.some(x=>x.event==="Marché de Noël"));
});
