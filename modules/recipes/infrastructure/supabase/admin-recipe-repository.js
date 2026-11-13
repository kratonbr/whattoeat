import { filterRecipesByEditorialStatus, getRecipeEditorialStatus } from "../../domain/editorial-status.mjs";

function fail(error) {
  const safe = new Error("A operação administrativa de receitas falhou.");
  safe.code = error?.code || "DATABASE_ERROR";
  throw safe;
}

function missing() {
  const error = new Error("Registro inexistente.");
  error.code = "P0002";
  return error;
}

export function createSupabaseAdminRecipeRepository(supabase) {
  return {
    async list({ page, pageSize, category, status, search, translationsPending, withoutImage }) {
      let matchingIds = null;
      if (search) {
        const { data, error } = await supabase.from("recipe_translations").select("recipe_id")
          .in("language_code", ["pt-BR", "en"]).ilike("title", `%${search.replace(/[%_]/g, "\\$&")}%`);
        if (error) fail(error);
        matchingIds = [...new Set((data ?? []).map((row) => row.recipe_id))];
        if (!matchingIds.length) return { items: [], page, pageSize, total: 0 };
      }
      const createRecipeQuery = ({ includeCount = false } = {}) => {
        let query = supabase.from("recipes")
          .select("id, category, prep_time_minutes, servings, difficulty, status, image_path, created_at, updated_at", includeCount ? { count: "exact" } : {})
          .order("updated_at", { ascending: false });
        if (category) query = query.eq("category", category);
        if (status) query = query.eq("status", status);
        if (matchingIds) query = query.in("id", matchingIds);
        return query;
      };

      const loadTranslations = async (recipes) => {
        const translations = [];
        const recipeIds = recipes.map((recipe) => recipe.id);
        for (let index = 0; index < recipeIds.length; index += 250) {
          const ids = recipeIds.slice(index, index + 250);
          const { data, error } = await supabase.from("recipe_translations")
            .select("recipe_id, language_code, slug, title, description, instructions")
            .in("recipe_id", ids).in("language_code", ["pt-BR", "en"]);
          if (error) fail(error);
          translations.push(...(data ?? []));
        }
        return translations;
      };

      const mapTranslationStatus = (recipes, translations) => {
        const byRecipe = new Map();
        for (const translation of translations) {
          const value = byRecipe.get(translation.recipe_id) ?? {};
          value[translation.language_code] = translation;
          byRecipe.set(translation.recipe_id, value);
        }
        return recipes.map((recipe) => {
          const recipeTranslations = byRecipe.get(recipe.id) ?? {};
          return {
            ...recipe,
            translations: recipeTranslations,
            ...getRecipeEditorialStatus(recipe, Object.values(recipeTranslations)),
          };
        });
      };

      if (typeof translationsPending === "boolean" || typeof withoutImage === "boolean") {
        const recipes = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await createRecipeQuery().range(offset, offset + 499);
          if (error) fail(error);
          const batch = data ?? [];
          recipes.push(...batch);
          if (batch.length < 500) break;
        }
        const translations = await loadTranslations(recipes);
        const matchingTranslations = filterRecipesByEditorialStatus(
          mapTranslationStatus(recipes, translations),
          { translationsPending, withoutImage },
        );
        const offset = (page - 1) * pageSize;
        return { items: matchingTranslations.slice(offset, offset + pageSize), page, pageSize, total: matchingTranslations.length };
      }

      const offset = (page - 1) * pageSize;
      const { data: recipes, count, error } = await createRecipeQuery({ includeCount: true }).range(offset, offset + pageSize - 1);
      if (error) fail(error);
      const currentRecipes = recipes ?? [];
      if (!currentRecipes.length) return { items: [], page, pageSize, total: count ?? 0 };
      const translations = await loadTranslations(currentRecipes);
      return { items: mapTranslationStatus(currentRecipes, translations), page, pageSize, total: count ?? 0 };
    },

    async getById(id) {
      const { data: recipe, error } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
      if (error) fail(error);
      if (!recipe) throw missing();
      const [translations, ingredients] = await Promise.all([
        supabase.from("recipe_translations").select("language_code, slug, title, description, instructions, image_alt").eq("recipe_id", id),
        supabase.from("recipe_ingredients").select("id, ingredient_id, quantity, quantity_text, unit_code, preparation_note, display_order, ingredients(id, ingredient_key, default_unit, ingredient_translations(language_code, name))")
          .eq("recipe_id", id).order("display_order", { ascending: true }),
      ]);
      if (translations.error) fail(translations.error);
      if (ingredients.error) fail(ingredients.error);
      let imageUrl = null;
      if (recipe.image_path) {
        const { data, error: imageError } = await supabase.storage.from("recipe-images").createSignedUrl(recipe.image_path, 3600);
        if (!imageError) imageUrl = data?.signedUrl ?? null;
      }
      return { ...recipe, image_url: imageUrl, translations: translations.data ?? [], ingredients: ingredients.data ?? [] };
    },

    async save(id, value) {
      const canonicalSlug = value.translations.find((translation) => translation.language_code === "pt-BR")?.slug
        ?? value.translations[0]?.slug;
      let existingTranslations = [];
      if (id) {
        const { data, error } = await supabase.from("recipe_translations")
          .select("language_code, slug").eq("recipe_id", id);
        if (error) fail(error);
        existingTranslations = data ?? [];
      }

      if (canonicalSlug) {
        let duplicateQuery = supabase.from("recipe_translations").select("recipe_id").eq("slug", canonicalSlug);
        if (id) duplicateQuery = duplicateQuery.neq("recipe_id", id);
        const { data, error } = await duplicateQuery.limit(1);
        if (error) fail(error);
        if (data?.length) {
          const duplicate = new Error("O slug canônico já está em uso.");
          duplicate.code = "23505";
          throw duplicate;
        }
      }

      const previousPortugueseSlug = existingTranslations.find((translation) => translation.language_code === "pt-BR")?.slug;
      const previousEnglishSlug = existingTranslations.find((translation) => translation.language_code === "en")?.slug;
      const translations = value.translations.map((translation) => ({ ...translation }));
      const englishTranslation = translations.find((translation) => translation.language_code === "en");
      if (englishTranslation && previousEnglishSlug && previousPortugueseSlug && previousEnglishSlug !== previousPortugueseSlug) {
        // Keep the previous English slug as a resolvable alias for existing links.
        englishTranslation.slug = previousEnglishSlug;
      }

      const { data, error } = await supabase.rpc("admin_save_recipe", {
        p_recipe_id: id, p_recipe: value.recipe, p_translations: translations, p_ingredients: value.ingredients,
      });
      if (error) fail(error);
      return { id: data };
    },

    async delete(id) {
      const { data, error } = await supabase.from("recipes").delete().eq("id", id).select("id").maybeSingle();
      if (error) fail(error);
      if (!data) throw missing();
    },
  };
}
