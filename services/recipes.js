import "server-only";

import { createGetRandomPublishedRecipe } from "@/modules/recipes/application/get-random-published-recipe.mjs";
import { createGetPublishedRecipeBySlug } from "@/modules/recipes/application/get-published-recipe-by-slug.mjs";
import { createListPublishedRecipes } from "@/modules/recipes/application/list-published-recipes.mjs";
import { createSupabaseRecipeRepository } from "@/modules/recipes/infrastructure/supabase/recipe-repository.js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_RECIPE_LOCALE } from "@/modules/recipes/domain/recipes.mjs";

function createRepository() {
  // The Supabase client is request-scoped and is never kept between requests.
  return createSupabaseRecipeRepository(createSupabaseServerClient());
}

export async function getPublishedRecipe({
  category = null,
  locale = DEFAULT_RECIPE_LOCALE,
  excludeId = null,
  recipeId = null,
}) {
  const getRandom = createGetRandomPublishedRecipe({ recipeRepository: createRepository() });
  return getRandom({ category, locale, excludeId, recipeId });
}

export async function getPublishedRecipeBySlug({ slug, locale = DEFAULT_RECIPE_LOCALE }) {
  const getBySlug = createGetPublishedRecipeBySlug({ recipeRepository: createRepository() });
  return getBySlug({ slug, locale });
}

export async function listPublishedRecipes(query) {
  const listPublished = createListPublishedRecipes({ recipeRepository: createRepository() });
  return listPublished(query);
}
