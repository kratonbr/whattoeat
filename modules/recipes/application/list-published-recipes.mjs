export function createListPublishedRecipes({ recipeRepository }) {
  return async function listPublishedRecipes(query) {
    return recipeRepository.listPublishedRecipes(query);
  };
}
