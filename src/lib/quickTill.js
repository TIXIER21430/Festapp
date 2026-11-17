// Demonstration catalog. Prices are examples and must be confirmed before taking payments.
export const TILL_PRODUCTS=[
 {id:"biere",name:"Bière",priceCents:300,icon:"🍺"},
 {id:"coca",name:"Coca",priceCents:250,icon:"🥤"},
 {id:"oasis",name:"Oasis",priceCents:250,icon:"🧃"},
 {id:"fuze-tea",name:"Fuze Tea",priceCents:250,icon:"🧋"},
 {id:"perrier",name:"Perrier",priceCents:250,icon:"🫧"},
 {id:"petite-eau",name:"Petite eau",priceCents:150,icon:"💧"},
 {id:"grande-eau",name:"Grande eau",priceCents:250,icon:"🚰"},
 {id:"kir",name:"Kir",priceCents:300,icon:"🍷"},
 {id:"vin-chaud",name:"Vin chaud",priceCents:300,icon:"🍷"},
 {id:"chocolat-chaud",name:"Chocolat chaud",priceCents:300,icon:"☕"},
 {id:"crepe",name:"Crêpe",priceCents:300,icon:"🥞"},
 {id:"hot-dog",name:"Hot-dog",priceCents:500,icon:"🌭"},
 {id:"andouillette-frite",name:"Andouillette-frites",priceCents:900,icon:"🍟"},
 {id:"panini",name:"Panini",priceCents:500,icon:"🥪"},
 {id:"cafe",name:"Café",priceCents:150,icon:"☕"}
];
export const TILL_EVENT_PRESETS={
 "Marché de Noël":["vin-chaud","chocolat-chaud","crepe","panini","cafe","petite-eau","grande-eau","coca","oasis","fuze-tea","perrier"],
 "Saint-Laurent":["biere","kir","hot-dog","andouillette-frite","panini","coca","oasis","fuze-tea","perrier","petite-eau","grande-eau","cafe"],
 "Fanfare":["biere","kir","hot-dog","panini","coca","oasis","fuze-tea","perrier","petite-eau","grande-eau","cafe"],
 "Vide-grenier":["biere","kir","hot-dog","panini","cafe","coca","oasis","fuze-tea","perrier","petite-eau","grande-eau"],
 "Carnaval":["biere","coca","oasis","fuze-tea","perrier","petite-eau","grande-eau","crepe","cafe"]
};
export function productsForEvent(eventName,products=TILL_PRODUCTS,presets=TILL_EVENT_PRESETS){
 const ids=presets[eventName];
 return ids?ids.map(id=>products.find(p=>p.id===id)).filter(Boolean):products;
}
export function calculateTill(cart,products=TILL_PRODUCTS){
 if(!cart||typeof cart!=="object"||Array.isArray(cart))throw new TypeError("Invalid cart");
 let totalCents=0;
 for(const [id,qty] of Object.entries(cart)){
  if(!Number.isSafeInteger(qty)||qty<0||qty>999)throw new RangeError("Invalid quantity");
  const product=products.find(p=>p.id===id);
  if(!product||!Number.isSafeInteger(product.priceCents)||product.priceCents<0)throw new TypeError("Unknown product");
  totalCents+=qty*product.priceCents;
  if(!Number.isSafeInteger(totalCents))throw new RangeError("Total overflow");
 }
 return totalCents;
}
export function changeQuantity(cart,id,delta,products=TILL_PRODUCTS){
 if(!products.some(p=>p.id===id)||!Number.isSafeInteger(delta))throw new TypeError("Invalid item");
 const next=Math.max(0,Math.min(999,(cart[id]||0)+delta));
 return {...cart,[id]:next};
}
