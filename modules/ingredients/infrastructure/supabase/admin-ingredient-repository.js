function fail(error) {
  const safe = new Error("A operação administrativa de ingredientes falhou.");
  safe.code = error?.code || "DATABASE_ERROR";
  throw safe;
}

function missing() {
  const error = new Error("Registro inexistente.");
  error.code = "P0002";
  return error;
}

export function createSupabaseAdminIngredientRepository(supabase) {
  return {
    async list(search = "") {
      let query = supabase.from("ingredients")
        .select("id, ingredient_key, default_unit, ingredient_translations(language_code, name)")
        .order("ingredient_key", { ascending: true }).limit(500);
      if (search) query = query.ilike("ingredient_key", `%${search.replace(/[%_]/g, "\\$&")}%`);
      const { data, error } = await query;
      if (error) fail(error);
      return data ?? [];
    },
    async getById(id) {
      const { data, error } = await supabase.from("ingredients")
        .select("id, ingredient_key, default_unit, ingredient_translations(language_code, name)").eq("id", id).maybeSingle();
      if (error) fail(error);
      if (!data) throw missing();
      return data;
    },
    async save(id, value) {
      const { data, error } = await supabase.rpc("admin_save_ingredient", {
        p_ingredient_id: id, p_ingredient_key: value.ingredient_key, p_default_unit: value.default_unit, p_translations: value.translations,
      });
      if (error) fail(error);
      return { id: data };
    },
    async delete(id) {
      const { data, error } = await supabase.from("ingredients").delete().eq("id", id).select("id").maybeSingle();
      if (error) fail(error);
      if (!data) throw missing();
    },
  };
}
