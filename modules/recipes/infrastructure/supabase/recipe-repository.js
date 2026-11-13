import { mapIngredientTranslations } from "@/modules/ingredients/domain/translations.mjs";
import { selectCanonicalRecipeSlug } from "@/modules/recipes/domain/recipes.mjs";
import {
  escapeRecipeTitleSearch,
  SUPPORTED_RECIPE_LOCALES,
  uniqueIds,
} from "@/modules/recipes/domain/public-catalog.mjs";

function queryError(message, cause) {
  const error = new Error(message);
  error.code = "SUPABASE_QUERY_FAILED";
  error.cause = cause;
  return error;
}

export function createSupabaseRecipeRepository(supabase) {
  return {
    async listPublishedRecipes({ locale, category, difficulty, maxPrepTime, search, sort, page, pageSize }) {
      let matchingIds = null;
      if (search) {
        const { data: matches, error: searchError } = await supabase
          .from("recipe_translations")
          .select("recipe_id")
          .in("language_code", SUPPORTED_RECIPE_LOCALES)
          .ilike("title", `%${escapeRecipeTitleSearch(search)}%`);
        if (searchError) throw queryError("Could not search published recipe titles.", searchError);
        matchingIds = uniqueIds(matches);
        if (!matchingIds.length) return { recipes: [], total: 0, page, pageSize };
      }

      let query = supabase
        .from("recipes")
        .select("id, category, image_path, prep_time_minutes, difficulty, recipe_translations!inner(language_code, slug, title, description, image_alt)", { count: "exact" })
        .eq("status", "published")
        .eq("recipe_translations.language_code", locale);

      if (matchingIds) query = query.in("id", matchingIds);
      if (category) query = query.eq("category", category);
      if (difficulty) query = query.eq("difficulty", difficulty);
      if (maxPrepTime) query = query.lte("prep_time_minutes", maxPrepTime);

      if (sort === "fastest") {
        query = query.order("prep_time_minutes", { ascending: true }).order("created_at", { ascending: false }).order("id", { ascending: true });
      } else if (sort === "alphabetical") {
        query = query.order("title", { referencedTable: "recipe_translations", ascending: true }).order("created_at", { ascending: false }).order("id", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false }).order("id", { ascending: true });
      }

      const start = (page - 1) * pageSize;
      const { data, count, error } = await query.range(start, start + pageSize - 1);
      if (error) throw queryError("Could not retrieve the published recipe catalog.", error);

      const rows = data ?? [];
      if (!rows.length) return { recipes: [], total: count ?? 0, page, pageSize };

      const recipeIds = rows.map((recipe) => recipe.id);
      const imagePaths = [...new Set(rows.map((recipe) => recipe.image_path).filter(Boolean))];
      const [canonicalResult, signedImagesResult] = await Promise.all([
        supabase.from("recipe_translations").select("recipe_id, slug")
          .eq("language_code", "pt-BR").in("recipe_id", recipeIds),
        imagePaths.length
          ? supabase.storage.from("recipe-images").createSignedUrls(imagePaths, 3600)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (canonicalResult.error) throw queryError("Could not resolve canonical recipe URLs.", canonicalResult.error);

      const canonicalSlugs = new Map((canonicalResult.data ?? []).map((row) => [row.recipe_id, row.slug]));
      const signedUrls = new Map();
      if (!signedImagesResult.error) {
        for (const image of signedImagesResult.data ?? []) {
          if (image.signedUrl && !image.error) signedUrls.set(image.path, image.signedUrl);
        }
      }

      return {
        recipes: rows.flatMap((recipe) => {
          const translation = recipe.recipe_translations?.find((entry) => entry.language_code === locale);
          if (!translation) return [];
          return [{
            id: recipe.id,
            slug: canonicalSlugs.get(recipe.id) ?? translation.slug,
            category: recipe.category,
            title: translation.title,
            description: translation.description,
            image_alt: translation.image_alt,
            image_url: recipe.image_path ? signedUrls.get(recipe.image_path) ?? null : null,
            prep_time_minutes: recipe.prep_time_minutes,
            difficulty: recipe.difficulty,
          }];
        }),
        total: count ?? 0,
        page,
        pageSize,
      };
    },

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
      const { data: exactMatches, error } = await supabase
        .from("recipe_translations")
        .select("recipe_id, language_code, slug")
        .eq("slug", slug);
      if (error) throw queryError("Could not resolve the recipe slug.", error);
      const recipeIds = [...new Set((exactMatches ?? []).map((match) => match.recipe_id))];
      if (!recipeIds.length) return [];
      const { data, error: translationsError } = await supabase
        .from("recipe_translations")
        .select("recipe_id, language_code, slug")
        .in("recipe_id", recipeIds);
      if (translationsError) throw queryError("Could not resolve the canonical recipe slug.", translationsError);
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
        result.image_url = null;
        if (recipe.image_path) {
          try {
            const { data, error } = await supabase.storage.from("recipe-images").createSignedUrl(recipe.image_path, 3600);
            if (!error) result.image_url = data?.signedUrl ?? null;
          } catch {
            result.image_url = null;
          }
        }
      }
      return result;
    },
  };
}
