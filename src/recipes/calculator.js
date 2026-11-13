export function scaleIngredients(ingredients, originalServings, targetServings) {
  if (!Number.isFinite(originalServings) || originalServings <= 0 || !Number.isFinite(targetServings) || targetServings <= 0) {
    throw new Error("Le nombre de portions doit être positif.");
  }
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: ingredient.quantity == null || !Number.isFinite(Number(ingredient.quantity))
      ? null
      : Math.round(Number(ingredient.quantity) * targetServings / originalServings * 100) / 100,
  }));
}

export function shoppingList(recipes) {
  const items = new Map();
  for (const recipe of recipes) {
    const scaled = scaleIngredients(recipe.ingredients, recipe.servings, recipe.targetServings ?? recipe.servings);
    for (const ingredient of scaled) {
      const key = [ingredient.name.trim().toLocaleLowerCase("fr"), ingredient.unit?.trim().toLocaleLowerCase("fr") ?? ""].join("|");
      const current = items.get(key);
      if (current && current.quantity != null && ingredient.quantity != null) {
        current.quantity = Math.round((current.quantity + ingredient.quantity) * 100) / 100;
      } else if (!current) {
        items.set(key, { ...ingredient });
      }
    }
  }
  return [...items.values()];
}
