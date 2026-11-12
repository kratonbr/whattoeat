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
    async list({ page, pageSize, category, status, search }) {
      let matchingIds = null;
      if (search) {
        const { data, error } = await supabase.from("recipe_translations").select("recipe_id")
          .in("language_code", ["pt-BR", "en"]).ilike("title", `%${search.replace(/[%_]/g, "\\$&")}%`);
        if (error) fail(error);
        matchingIds = [...new Set((data ?? []).map((row) => row.recipe_id))];
        if (!matchingIds.length) return { items: [], page, pageSize, total: 0 };
      }
      let query = supabase.from("recipes")
        .select("id, category, prep_time_minutes, servings, difficulty, status, image_path, created_at, updated_at", { count: "exact" })
        .order("updated_at", { ascending: false });
      if (category) query = query.eq("category", category);
      if (status) query = query.eq("status", status);
      if (matchingIds) query = query.in("id", matchingIds);
      const offset = (page - 1) * pageSize;
      const { data: recipes, count, error } = await query.range(offset, offset + pageSize - 1);
      if (error) fail(error);
      const ids = (recipes ?? []).map((recipe) => recipe.id);
      if (!ids.length) return { items: [], page, pageSize, total: count ?? 0 };
      const { data: translations, error: translationError } = await supabase.from("recipe_translations")
        .select("recipe_id, language_code, slug, title, description").in("recipe_id", ids).in("language_code", ["pt-BR", "en"]);
      if (translationError) fail(translationError);
      const byRecipe = new Map();
      for (const translation of translations ?? []) {
        const value = byRecipe.get(translation.recipe_id) ?? {};
        value[translation.language_code] = translation;
        byRecipe.set(translation.recipe_id, value);
      }
      return { items: (recipes ?? []).map((recipe) => ({ ...recipe, translations: byRecipe.get(recipe.id) ?? {} })), page, pageSize, total: count ?? 0 };
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
      return { ...recipe, translations: translations.data ?? [], ingredients: ingredients.data ?? [] };
    },

    async save(id, value) {
      const { data, error } = await supabase.rpc("admin_save_recipe", {
        p_recipe_id: id, p_recipe: value.recipe, p_translations: value.translations, p_ingredients: value.ingredients,
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
