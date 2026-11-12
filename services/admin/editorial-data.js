import "server-only";

import { createSupabaseAdminIngredientRepository } from "@/modules/ingredients/infrastructure/supabase/admin-ingredient-repository.js";
import { createSupabaseAdminRecipeRepository } from "@/modules/recipes/infrastructure/supabase/admin-recipe-repository.js";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

async function recipeRepository() {
  return createSupabaseAdminRecipeRepository(await createSupabaseAuthServerClient());
}

async function ingredientRepository() {
  return createSupabaseAdminIngredientRepository(await createSupabaseAuthServerClient());
}

// Compatibility service facade. Each operation gets an authenticated client
// bound to the current request, then delegates to the appropriate repository.
export async function listAdminRecipes(filters) { return (await recipeRepository()).list(filters); }
export async function getAdminRecipe(id) { return (await recipeRepository()).getById(id); }
export async function saveAdminRecipe(id, value) { return (await recipeRepository()).save(id, value); }
export async function deleteAdminRecipe(id) { return (await recipeRepository()).delete(id); }
export async function listAdminIngredients(search) { return (await ingredientRepository()).list(search); }
export async function getAdminIngredient(id) { return (await ingredientRepository()).getById(id); }
export async function saveAdminIngredient(id, value) { return (await ingredientRepository()).save(id, value); }
export async function deleteAdminIngredient(id) { return (await ingredientRepository()).delete(id); }
