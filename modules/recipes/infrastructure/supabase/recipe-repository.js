import { mapIngredientTranslations } from "@/modules/ingredients/domain/translations.mjs";
import { selectCanonicalRecipeSlug } from "@/modules/recipes/domain/recipes.mjs";

function queryError(message, cause) {
  const error = new Error(message);
  error.code = "SUPABASE_QUERY_FAILED";
  error.cause = cause;
  return error;
}

export function createSupabaseRecipeRepository(supabase) {
  return {
    async findPublishedCandidates({ category, locale, recipeId }) {
      let query = supabase
        .from("recipes")
        .select("id, recipe_translations!inner(language_code)")
        .eq("status", "published")
        .eq("recipe_translations.language_code", locale);
      if (category) query = query.eq("category", category);
      if (recipeId) query = query.eq("id", recipeId);
      const { data, error } = await query;
      if (error) throw queryError("Could not retrieve published recipes.", error);
      return data ?? [];
    },

    async findSlugMatches(slug) {
      const { data, error } = await supabase
        .from("recipe_translations")
        .select("recipe_id, language_code, slug")
        .eq("slug", slug);
      if (error) throw queryError("Could not resolve the recipe slug.", error);
      return data ?? [];
    },

    async getPublishedRecipeById({ id, locale, includeImage, includePreparation }) {
      const recipeSelection = includeImage
        ? "id, category, image_path, prep_time_minutes, servings, difficulty, recipe_translations!inner(language_code, slug, title, description, instructions, image_alt)"
        : "id, category, prep_time_minutes, servings, difficulty, recipe_translations!inner(language_code, slug, title, description, instructions)";
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .select(recipeSelection)
        .eq("id", id)
        .eq("status", "published")
        .eq("recipe_translations.language_code", locale)
        .maybeSingle();
      if (recipeError) throw queryError("Could not retrieve the published recipe.", recipeError);
      if (!recipe) return null;

      const translation = recipe.recipe_translations?.find((entry) => entry.language_code === locale);
      if (!translation) throw queryError("The recipe translation could not be resolved.");

      const [slugResult, ingredientsResult] = await Promise.all([
        supabase.from("recipe_translations").select("language_code, slug").eq("recipe_id", id),
        supabase.from("recipe_ingredients")
          .select("ingredient_id, quantity, quantity_text, unit_code, preparation_note, display_order, ingredients(default_unit)")
          .eq("recipe_id", id)
          .order("display_order", { ascending: true }),
      ]);
      if (slugResult.error) throw queryError("Could not resolve the canonical recipe slug.", slugResult.error);
      if (ingredientsResult.error) throw queryError("Could not retrieve recipe ingredients.", ingredientsResult.error);

      const ingredientIds = [...new Set((ingredientsResult.data ?? []).map((item) => item.ingredient_id))];
      let translatedIngredients = [];
      if (ingredientIds.length) {
        const { data, error } = await supabase
          .from("ingredient_translations")
          .select("ingredient_id, name")
          .eq("language_code", locale)
          .in("ingredient_id", ingredientIds);
        if (error) throw queryError("Could not retrieve translated ingredient names.", error);
        translatedIngredients = data ?? [];
      }

      const ingredients = mapIngredientTranslations(ingredientsResult.data, translatedIngredients, locale)
        .map((item) => includePreparation ? item : ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          quantity_text: item.quantity_text,
          unit_code: item.unit_code,
        }));
      const result = {
        id: recipe.id,
        category: recipe.category,
        prep_time_minutes: recipe.prep_time_minutes,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        slug: selectCanonicalRecipeSlug(slugResult.data, translation.slug),
        title: translation.title,
        description: translation.description,
        instructions: translation.instructions,
        ingredients,
      };
      if (includeImage) {
        result.image_path = recipe.image_path;
        result.image_alt = translation.image_alt;
      }
      return result;
    },
  };
}
