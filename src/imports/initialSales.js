// Relevés historiques saisis dans le tableau « Quantités vendues 2025-2026 ».
// Les valeurs ambiguës restent du texte ; aucune conversion ou estimation automatique.
export const initialSalesHistory=[
["Bière bouteille","Halloween","107"],["Coca","Halloween","29"],["Ice tea","Halloween","11"],["Orangina","Halloween","10"],["Oasis","Halloween","16"],["Perrier","Halloween","2"],["Eau (50cl)","Halloween","24"],["Blanc (cubi)","Halloween","5L"],["Chocolat chaud","Halloween","7L"],["Hot Dog","Halloween","70"],["Crêpes","Halloween","10L"],
["Bière bouteille","Marché de Noël","43 blonde 16 ambrée"],["Coca","Marché de Noël","17"],["Ice tea","Marché de Noël","29"],["Orangina","Marché de Noël","11"],["Oasis","Marché de Noël","3"],["Perrier","Marché de Noël","15"],["Eau (50cl)","Marché de Noël","8"],["Vin chaud","Marché de Noël","40L"],["Hot Dog","Marché de Noël","50"],["Frites","Marché de Noël","35kg"],["Crêpes","Marché de Noël","à peine 10L"],
["Bière bouteille","Belote (2)","161"],["Coca","Belote (2)","1"],["Orangina","Belote (2)","4"],["Perrier","Belote (2)","3"],["Eau (50cl)","Belote (2)","13"],["Hot Dog","Belote (2)","23 + 8 sandwichs"],
["Bière bouteille","Carnaval","38"],["Coca","Carnaval","10"],["Ice tea","Carnaval","8"],["Orangina","Carnaval","7"],["Oasis","Carnaval","11"],["Perrier","Carnaval","8"],["Eau (50cl)","Carnaval","3"]
].map(([product,event,quantityText])=>({product,event,quantityText,source:"Quantités vendues 2025-2026.xlsx"}));
