// Pure offline calculator. Keeps original recipe unchanged.
export function scaleRecipeIngredients(ingredients,originalServings,targetServings){
 if(!Number.isSafeInteger(originalServings)||originalServings<1||!Number.isSafeInteger(targetServings)||targetServings<1||targetServings>100000)throw new RangeError("Invalid servings");
 if(!Array.isArray(ingredients)||ingredients.length>200)throw new TypeError("Invalid ingredients");
 return ingredients.map(item=>{
   if(!item||typeof item.name!=="string"||!item.name.trim()||typeof item.quantity!=="number"||!Number.isFinite(item.quantity)||item.quantity<0||typeof item.unit!=="string")throw new TypeError("Invalid ingredient");
   const quantity=item.quantity*targetServings/originalServings;
   if(!Number.isFinite(quantity))throw new RangeError("Quantity overflow");
   return {...item,quantity:Math.round((quantity+Number.EPSILON)*100)/100};
 });
}
