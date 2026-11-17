import {scaleRecipeIngredients} from "./recipeScale.js";
// Expected format: one ingredient per line, e.g. "250 g farine" or "3 œufs".
export function scaleRecipeText(text,originalServings,targetServings){
 if(typeof text!=="string"||text.length>20000)throw new TypeError("Invalid ingredients");
 const lines=text.split(/\r?\n/).filter(line=>line.trim());
 if(lines.length===0)throw new TypeError("Enter ingredients, one per line");
 const parsed=lines.map(line=>{
  const match=line.trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|cl|ml|pièces?|unités?)?\s+(.+)$/i);
  if(!match)throw new TypeError("Unrecognized ingredient: "+line.slice(0,60));
  return {quantity:Number(match[1].replace(",",".")),unit:match[2]||"",name:match[3]};
 });
 return scaleRecipeIngredients(parsed,originalServings,targetServings).map(x=>[x.quantity,String(x.unit).trim(),x.name].filter(Boolean).join(" ")).join("\n");
}
