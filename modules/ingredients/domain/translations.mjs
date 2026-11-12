export function mapIngredientTranslations(recipeIngredients, ingredientTranslations, locale) {
  const names = new Map((ingredientTranslations ?? []).map(({ ingredient_id, name }) => [ingredient_id, name]));
  return (recipeIngredients ?? []).map((item) => {
    const name = names.get(item.ingredient_id);
    if (!name) {
      const error = new Error("A recipe ingredient is missing its requested translation.");
      error.code = "MISSING_INGREDIENT_TRANSLATION";
      error.locale = locale;
      throw error;
    }
    return {
      id: item.ingredient_id,
      name,
      quantity: item.quantity,
      quantity_text: item.quantity_text,
      unit_code: item.unit_code ?? item.ingredients?.default_unit ?? null,
      preparation_note: item.preparation_note ?? null,
    };
  });
}
