import { getRecipeTranslationStatus } from "./translation-completeness.mjs";

export function isRecipeMissingImage(recipe) {
  return typeof recipe?.image_path !== "string" || !recipe.image_path.trim();
}

export function getRecipeEditorialStatus(recipe, translations) {
  return {
    imageMissing: isRecipeMissingImage(recipe),
    translationStatus: getRecipeTranslationStatus(translations),
  };
}

export function filterRecipesByEditorialStatus(recipes, filters = {}) {
  return recipes.filter((recipe) => {
    if (typeof filters.withoutImage === "boolean" && recipe.imageMissing !== filters.withoutImage) return false;
    if (typeof filters.translationsPending === "boolean"
      && recipe.translationStatus?.complete === filters.translationsPending) return false;
    return true;
  });
}
