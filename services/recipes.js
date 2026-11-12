import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_RECIPE_LOCALE,
  isSupportedRecipeCategory,
  isSupportedRecipeLocale,
  resolveRecipeIdFromSlugMatches,
  selectCanonicalRecipeSlug,
  selectRandomRecipe,
} from "@/domain/recipes.mjs";


function queryError(message, cause) {
  const error = new Error(message);
  error.code = "SUPABASE_QUERY_FAILED";
  error.cause = cause;
  return error;
}


export async function getPublishedRecipe({
  category = null,
  locale = DEFAULT_RECIPE_LOCALE,
  excludeId = null,
  recipeId = null,
}) {
  const supabase = createSupabaseServerClient();

  let query = supabase
    .from("recipes")
    .select(
      `
        id,
        category,
        prep_time_minutes,
        servings,
        difficulty,
        recipe_translations!inner (
          language_code,
          slug,
          title,
          description,
          instructions
        )
      `,
    )
    .eq("status", "published")
    .eq("recipe_translations.language_code", locale);

  if (category) {
    query = query.eq("category", category);
  }
  if (recipeId) {
    query = query.eq("id", recipeId);
  }

  const { data: recipes, error: recipeError } = await query;

  if (recipeError) {
    throw queryError("Could not retrieve published recipes.", recipeError);
  }

  if (!recipes?.length) {
    return null;
  }

  const recipe = selectRandomRecipe(recipes, { excludeId, recipeId });
  const translation = recipe.recipe_translations?.find(
    (item) => item.language_code === locale,
  );

  if (!translation) {
    throw queryError("The selected recipe has no translation for this locale.");
  }

  const { data: routeTranslations, error: routeTranslationsError } =
    await supabase
      .from("recipe_translations")
      .select("language_code, slug")
      .eq("recipe_id", recipe.id);

  if (routeTranslationsError) {
    throw queryError("Could not resolve the canonical recipe slug.", routeTranslationsError);
  }

  const canonicalSlug = selectCanonicalRecipeSlug(
    routeTranslations,
    translation.slug,
  );

  const { data: recipeIngredients, error: recipeIngredientsError } =
    await supabase
      .from("recipe_ingredients")
      .select(
        "ingredient_id, quantity, quantity_text, unit_code, display_order",
      )
      .eq("recipe_id", recipe.id)
      .order("display_order", { ascending: true });

  if (recipeIngredientsError) {
    throw queryError(
      "Could not retrieve the selected recipe ingredients.",
      recipeIngredientsError,
    );
  }

  let ingredients = [];

  if (recipeIngredients?.length) {
    const ingredientIds = [
      ...new Set(recipeIngredients.map((item) => item.ingredient_id)),
    ];
    const { data: ingredientTranslations, error: translationsError } =
      await supabase
        .from("ingredient_translations")
        .select("ingredient_id, name")
        .eq("language_code", locale)
        .in("ingredient_id", ingredientIds);

    if (translationsError) {
      throw queryError(
        "Could not retrieve translated ingredient names.",
        translationsError,
      );
    }

    const namesByIngredientId = new Map(
      (ingredientTranslations ?? []).map((item) => [
        item.ingredient_id,
        item.name,
      ]),
    );

    ingredients = recipeIngredients.map((item) => {
      const name = namesByIngredientId.get(item.ingredient_id);

      if (!name) {
        throw queryError(
          "A recipe ingredient is missing its requested translation.",
        );
      }

      return {
        id: item.ingredient_id,
        name,
        quantity: item.quantity,
        quantity_text: item.quantity_text,
        unit_code: item.unit_code,
      };
    });
  }

  return {
    id: recipe.id,
    category: recipe.category,
    prep_time_minutes: recipe.prep_time_minutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    slug: canonicalSlug,
    title: translation.title,
    description: translation.description,
    instructions: translation.instructions,
    ingredients,
  };
}

export async function getPublishedRecipeBySlug({
  slug,
  locale = DEFAULT_RECIPE_LOCALE,
}) {
  const supabase = createSupabaseServerClient();

  const { data: slugMatches, error: slugError } = await supabase
    .from("recipe_translations")
    .select("recipe_id, language_code, slug")
    .eq("slug", slug);

  if (slugError) {
    throw queryError("Could not resolve the recipe slug.", slugError);
  }

  const recipeId = resolveRecipeIdFromSlugMatches(slugMatches);

  if (!recipeId) {
    return null;
  }

  const canonicalSlug = selectCanonicalRecipeSlug(slugMatches, slug);

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select(
      `
        id,
        category,
        image_path,
        prep_time_minutes,
        servings,
        difficulty,
        recipe_translations!inner (
          language_code,
          slug,
          title,
          description,
          instructions,
          image_alt
        )
      `,
    )
    .eq("id", recipeId)
    .eq("status", "published")
    .eq("recipe_translations.language_code", locale)
    .maybeSingle();

  if (recipeError) {
    throw queryError("Could not retrieve the published recipe.", recipeError);
  }

  if (!recipe) {
    return null;
  }

  const translation = recipe.recipe_translations?.find(
    (item) => item.language_code === locale,
  );

  if (!translation) {
    throw queryError("The recipe translation could not be resolved.");
  }

  const { data: recipeIngredients, error: recipeIngredientsError } =
    await supabase
      .from("recipe_ingredients")
      .select(
        "ingredient_id, quantity, quantity_text, unit_code, preparation_note, display_order, ingredients(default_unit)",
      )
      .eq("recipe_id", recipe.id)
      .order("display_order", { ascending: true });

  if (recipeIngredientsError) {
    throw queryError(
      "Could not retrieve the recipe ingredients.",
      recipeIngredientsError,
    );
  }

  let ingredients = [];

  if (recipeIngredients?.length) {
    const ingredientIds = [
      ...new Set(recipeIngredients.map((item) => item.ingredient_id)),
    ];
    const { data: ingredientTranslations, error: translationsError } =
      await supabase
        .from("ingredient_translations")
        .select("ingredient_id, name")
        .eq("language_code", locale)
        .in("ingredient_id", ingredientIds);

    if (translationsError) {
      throw queryError(
        "Could not retrieve translated ingredient names.",
        translationsError,
      );
    }

    const namesByIngredientId = new Map(
      (ingredientTranslations ?? []).map((item) => [
        item.ingredient_id,
        item.name,
      ]),
    );

    ingredients = recipeIngredients.map((item) => {
      const name = namesByIngredientId.get(item.ingredient_id);

      if (!name) {
        throw queryError(
          "A recipe ingredient is missing its requested translation.",
        );
      }

      return {
        id: item.ingredient_id,
        name,
        quantity: item.quantity,
        quantity_text: item.quantity_text,
        unit_code: item.unit_code ?? item.ingredients?.default_unit ?? null,
        preparation_note: item.preparation_note,
      };
    });
  }

  return {
    id: recipe.id,
    category: recipe.category,
    image_path: recipe.image_path,
    image_alt: translation.image_alt,
    prep_time_minutes: recipe.prep_time_minutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    slug: canonicalSlug,
    title: translation.title,
    description: translation.description,
    instructions: translation.instructions,
    ingredients,
  };
}
