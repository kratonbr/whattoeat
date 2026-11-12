import { resolveRecipeIdFromSlugMatches, selectCanonicalRecipeSlug } from "../domain/recipes.mjs";

export function createGetPublishedRecipeBySlug({ recipeRepository }) {
  return async function getPublishedRecipeBySlug({ slug, locale }) {
    const slugMatches = await recipeRepository.findSlugMatches(slug);
    const recipeId = resolveRecipeIdFromSlugMatches(slugMatches);
    if (!recipeId) return null;

    const canonicalSlug = selectCanonicalRecipeSlug(slugMatches, slug);
    const recipe = await recipeRepository.getPublishedRecipeById({
      id: recipeId,
      locale,
      includeImage: true,
      includePreparation: true,
    });
    return recipe ? { ...recipe, slug: canonicalSlug } : null;
  };
}
