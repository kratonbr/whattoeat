import { selectRandomRecipe } from "../domain/recipes.mjs";

export function createGetRandomPublishedRecipe({ recipeRepository, random = Math.random }) {
  return async function getRandomPublishedRecipe({ category = null, locale, excludeId = null, recipeId = null }) {
    const candidates = await recipeRepository.findPublishedCandidates({ category, locale, recipeId });
    const selected = selectRandomRecipe(candidates, { excludeId, recipeId, random });
    if (!selected) return null;
    return recipeRepository.getPublishedRecipeById({
      id: selected.id,
      locale,
      includeImage: true,
      includePreparation: false,
    });
  };
}
