export const SUPPORTED_RECIPE_LOCALES = Object.freeze(["en", "pt-BR"]);
export const DEFAULT_RECIPE_LOCALE = "pt-BR";
export const SUPPORTED_RECIPE_CATEGORIES = Object.freeze(["breakfast", "lunch", "dinner", "snack", "dessert"]);
export const SUPPORTED_RECIPE_DIFFICULTIES = Object.freeze(["easy", "medium", "hard"]);

export function isSupportedRecipeLocale(locale) {
  return SUPPORTED_RECIPE_LOCALES.includes(locale);
}

export function isSupportedRecipeCategory(category) {
  return SUPPORTED_RECIPE_CATEGORIES.includes(category);
}

export function createRecipeSlugFromTitle(title) {
  return typeof title === "string"
    ? title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    : "";
}

export function resolveRecipeIdFromSlugMatches(matches) {
  const recipeIds = [...new Set((matches ?? []).map((match) => match.recipe_id).filter(Boolean))];
  return recipeIds.length === 1 ? recipeIds[0] : null;
}

export function selectCanonicalRecipeSlug(translations, fallbackSlug) {
  const preferred = translations?.find((translation) => translation.language_code === DEFAULT_RECIPE_LOCALE);
  if (preferred?.slug) return preferred.slug;
  return translations?.find((translation) => translation.slug)?.slug ?? fallbackSlug ?? null;
}

export function selectRandomRecipe(recipes, { excludeId = null, recipeId = null, random = Math.random } = {}) {
  if (!recipes?.length) return null;
  const alternatives = !recipeId && excludeId && recipes.length > 1
    ? recipes.filter((recipe) => recipe.id !== excludeId)
    : recipes;
  const pool = alternatives.length ? alternatives : recipes;
  return pool[Math.floor(random() * pool.length)];
}
