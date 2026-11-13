import React,{useState} from "react";
import {scaleIngredients,shoppingList} from "./calculator.js";

const KEY="festapp-recipes-v1";
function read(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function parseIngredients(text){return text.split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{const m=line.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|pièces?|unités?)?\s+(.+)$/i);return m?{quantity:Number(m[1].replace(",",".")),unit:m[2]||"",name:m[3]}:{quantity:null,unit:"",name:line}})}
export default function Recipes(){
 const [recipes,setRecipes]=useState(read),[name,setName]=useState(""),[servings,setServings]=useState(20),[target,setTarget]=useState(100),[ingredients,setIngredients]=useState(""),[steps,setSteps]=useState(""),[photo,setPhoto]=useState(null),[query,setQuery]=useState("");
 function persist(next){setRecipes(next);try{localStorage.setItem(KEY,JSON.stringify(next))}catch{alert("Stockage plein : photo trop volumineuse. Réessayez avec une photo plus légère.")}}
 function upload(e){const file=e.target.files?.[0];if(!file)return;if(file.size>750000){alert("Pour cette démo, choisissez une image de moins de 750 Ko. Le stockage serveur viendra ensuite.");return}const reader=new FileReader();reader.onload=()=>setPhoto(reader.result);reader.readAsDataURL(file)}
 function add(e){e.preventDefault();if(!name.trim())return;persist([...recipes,{id:crypto.randomUUID(),name:name.trim(),servings:Number(servings),ingredients:parseIngredients(ingredients),steps,photo}]);setName("");setIngredients("");setSteps("");setPhoto(null)}
 function remove(id){if(confirm("Supprimer cette recette ?"))persist(recipes.filter(r=>r.id!==id))}
 const selected=recipes.filter(r=>r.name.toLowerCase().includes(query.toLowerCase()));
 const list=shoppingList(selected.map(r=>({...r,targetServings:Number(target)})));
 const display=q=>q==null?"à préciser":q.toLocaleString("fr-FR",{maximumFractionDigits:2});
 function copy(){navigator.clipboard?.writeText(list.map(i=>i.name+" : "+display(i.quantity)+" "+i.unit).join("\n"))}
 return <div className="recipe-module">
 <p className="note">Démo locale : les recettes et photos restent uniquement sur cet appareil. La lecture automatique par IA n'est pas encore activée. Vérifiez toujours les quantités avant une manifestation.</p>
 <form onSubmit={add} className="recipe-form">
 <label>Nom de la recette<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Tartiflette"/></label>
 <label>Recette prévue pour combien de personnes ?<input type="number" min="1" required value={servings} onChange={e=>setServings(e.target.value)}/></label>
 <label>Photo originale (facultatif)<input type="file" accept="image/*" capture="environment" onChange={upload}/></label>
 {photo&&<img className="recipe-photo" src={photo} alt="Photo de la recette à enregistrer"/>}
 <label>Ingrédients (un par ligne, ex. 5 kg pommes de terre)<textarea rows="5" value={ingredients} onChange={e=>setIngredients(e.target.value)}/></label>
 <label>Préparation<textarea rows="4" value={steps} onChange={e=>setSteps(e.target.value)}/></label>
 <button type="submit">+ Enregistrer la recette</button>
 </form>
 <h3>Calculateur de quantités</h3>
 <label>Nombre de personnes souhaité<input type="number" min="1" value={target} onChange={e=>setTarget(e.target.value)}/></label>
 <label>Rechercher une recette<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom de recette"/></label>
 <div className="records">{selected.map(r=><article key={r.id} className="recipe-card"><div><strong>{r.name}</strong><p>Base : {r.servings} personnes</p>{r.photo&&<img className="recipe-photo" src={r.photo} alt={"Recette originale : "+r.name}/>}<ul>{scaleIngredients(r.ingredients,r.servings,Math.max(1,Number(target)||1)).map((i,k)=><li key={k}>{display(i.quantity)} {i.unit} {i.name}</li>)}</ul>{r.steps&&<p className="recipe-steps">{r.steps}</p>}</div><button className="delete" onClick={()=>remove(r.id)}>Supprimer</button></article>)}</div>
 <h3>Liste de courses cumulée</h3><p className="note">Addition des ingrédients de toutes les recettes affichées. Les unités différentes ne sont pas converties automatiquement.</p>
 {list.length?<><ul>{list.map((i,k)=><li key={k}>{i.name} : {display(i.quantity)} {i.unit}</li>)}</ul><button onClick={copy}>Copier la liste</button></>:<p>Aucun ingrédient pour le moment.</p>}
 </div>
}