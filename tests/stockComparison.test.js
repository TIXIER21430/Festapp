import test from "node:test";
import assert from "node:assert/strict";
import {compareShoppingWithStock} from "../src/lib/stockComparison.js";
test("calculates theoretical shortage only for exact named numeric items",()=>{
 const shopping=[{id:"a",eventId:"event",values:["Écocups","100","À prévoir"]},{id:"b",eventId:"event",values:["Pain","10","À prévoir"]},{id:"c",eventId:"other",values:["Pain","50","À prévoir"]}];
 const stock=[{values:["Ecocups","60","10"]},{values:["Pain","12","0"]}];
 const result=compareShoppingWithStock(shopping,stock,"event");
 assert.equal(result.length,2);
 assert.equal(result[0].toBuy,40);
 assert.equal(result[1].toBuy,0);
});
test("unclear quantities and duplicate stock cannot claim sufficiency",()=>{
 const shopping=[{id:"a",eventId:"e",values:["Gaz","À préciser","À prévoir"]}];
 assert.equal(compareShoppingWithStock(shopping,[{values:["Gaz","5",""]}],"e")[0].status,"Quantité à préciser");
 assert.equal(compareShoppingWithStock(shopping,[{values:["Gaz","5",""]},{values:["Gaz","4",""]}],"e")[0].status,"Doublons dans le stock");
 assert.equal(compareShoppingWithStock(shopping,[],"e")[0].status,"Non trouvé dans le stock");
});
test("invalid input is rejected",()=>assert.throws(()=>compareShoppingWithStock([],null,"e")));
