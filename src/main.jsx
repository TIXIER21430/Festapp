import React from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
const modules=["Manifestations","À faire","À acheter","Stock & écocups","Annuaire","Planning bénévoles","Retours terrain","Recettes","Finances & archives"];
function App(){return <main><header>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></header><section className="hero"><h1>Bienvenue !</h1><p>Votre comité, toutes vos manifestations, au même endroit.</p><strong>Première structure — modules à connecter</strong></section><div className="grid">{modules.map((name,i)=><article key={name} style={{borderTopColor:["#2075c9","#e6007e","#79c843","#f5d928"][i%4]}}><h2>{name}</h2><p>En préparation</p></article>)}</div></main>}
createRoot(document.getElementById("root")).render(<App/>);