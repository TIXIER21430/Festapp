export const TILL_PRODUCTS=[
 {id:"biere",name:"Bière",priceCents:300,icon:"🍺"},
 {id:"coca",name:"Coca",priceCents:250,icon:"🥤"},
 {id:"eau",name:"Eau",priceCents:150,icon:"💧"},
 {id:"crepe",name:"Crêpe",priceCents:300,icon:"🥞"},
 {id:"sandwich",name:"Sandwich",priceCents:500,icon:"🥪"},
 {id:"cafe",name:"Café",priceCents:150,icon:"☕"}
];
// Illustrative prices only. No payment provider integration or transaction submission.
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
export function changeQuantity(cart,id,delta){
 if(!TILL_PRODUCTS.some(p=>p.id===id)||!Number.isSafeInteger(delta))throw new TypeError("Invalid item");
 const next=Math.max(0,Math.min(999,(cart[id]||0)+delta));
 return {...cart,[id]:next};
}
