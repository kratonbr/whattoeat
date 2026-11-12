export const ADMIN_DASHBOARD_LOCALES = Object.freeze(["pt-BR", "en"]);

function isTranslationComplete(translation) {
  return Boolean(translation && typeof translation.title === "string" && translation.title.trim()
    && Array.isArray(translation.instructions) && translation.instructions.length > 0);
}

export function calculateAdminDashboardMetrics({ recipes, translations }) {
  if (!Array.isArray(recipes) || !Array.isArray(translations)) throw new TypeError("Recipes and translations must be arrays.");
  const translationsByRecipe = new Map();
  for (const translation of translations) {
    if (!translationsByRecipe.has(translation.recipe_id)) translationsByRecipe.set(translation.recipe_id, new Map());
    translationsByRecipe.get(translation.recipe_id).set(translation.language_code, translation);
  }
  const translationsPending = recipes.filter((recipe) => {
    const entries = translationsByRecipe.get(recipe.id);
    return ADMIN_DASHBOARD_LOCALES.some((locale) => !isTranslationComplete(entries?.get(locale)));
  }).length;
  return {
    total: recipes.length,
    published: recipes.filter((recipe) => recipe.status === "published").length,
    drafts: recipes.filter((recipe) => recipe.status === "draft").length,
    withoutImage: recipes.filter((recipe) => typeof recipe.image_path !== "string" || !recipe.image_path.trim()).length,
    translationsPending,
  };
}
