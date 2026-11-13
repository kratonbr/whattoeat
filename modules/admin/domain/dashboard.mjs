import { SUPPORTED_RECIPE_LOCALES } from "../../recipes/domain/recipes.mjs";
import { filterRecipesByEditorialStatus, getRecipeEditorialStatus } from "../../recipes/domain/editorial-status.mjs";

export const ADMIN_DASHBOARD_LOCALES = SUPPORTED_RECIPE_LOCALES;

function groupTranslations(translations) {
  const grouped = new Map();
  for (const translation of translations) {
    if (!grouped.has(translation.recipe_id)) grouped.set(translation.recipe_id, []);
    grouped.get(translation.recipe_id).push(translation);
  }
  return grouped;
}

export function listRecipesWithPendingTranslations({ recipes, translations }, limit = Infinity) {
  if (!Array.isArray(recipes) || !Array.isArray(translations)) throw new TypeError("Recipes and translations must be arrays.");
  const translationsByRecipe = groupTranslations(translations);
  return recipes.flatMap((recipe) => {
    const recipeTranslations = translationsByRecipe.get(recipe.id) ?? [];
    const { translationStatus } = getRecipeEditorialStatus(recipe, recipeTranslations);
    if (translationStatus.complete) return [];
    const title = recipeTranslations.find((translation) => translation.language_code === "pt-BR" && translation.title?.trim())?.title
      ?? recipeTranslations.find((translation) => translation.title?.trim())?.title
      ?? "Receita sem título";
    return [{ id: recipe.id, title, status: recipe.status, pendingTranslations: translationStatus.pending }];
  }).slice(0, limit);
}

export function calculateAdminDashboardMetrics({ recipes, translations }) {
  if (!Array.isArray(recipes) || !Array.isArray(translations)) throw new TypeError("Recipes and translations must be arrays.");
  const translationsByRecipe = groupTranslations(translations);
  const recipesWithStatus = recipes.map((recipe) => ({
    ...recipe,
    ...getRecipeEditorialStatus(recipe, translationsByRecipe.get(recipe.id) ?? []),
  }));
  const withoutImage = filterRecipesByEditorialStatus(recipesWithStatus, { withoutImage: true }).length;
  const translationsPending = filterRecipesByEditorialStatus(recipesWithStatus, { translationsPending: true }).length;
  return {
    total: recipes.length,
    published: recipes.filter((recipe) => recipe.status === "published").length,
    drafts: recipes.filter((recipe) => recipe.status === "draft").length,
    withoutImage,
    translationsPending,
  };
}
