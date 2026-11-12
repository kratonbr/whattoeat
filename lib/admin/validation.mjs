// Legacy re-exports. Business validation lives beside each owning domain.
export { validateIngredientPayload } from "../../modules/ingredients/domain/validation.mjs";
export { validateRecipeListQuery, validateRecipePayload } from "../../modules/recipes/domain/validation.mjs";
