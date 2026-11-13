function queryError(cause) {
  const error = new Error("Administrative dashboard query failed.");
  error.code = "ADMIN_DASHBOARD_QUERY_FAILED";
  error.cause = cause;
  return error;
}

async function fetchAllRows(queryFactory, pageSize) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await queryFactory().range(from, from + pageSize - 1);
    if (error) throw queryError(error);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export function createSupabaseDashboardRepository(supabase, { pageSize = 500 } = {}) {
  return {
    async countPublishedRecipes() {
      const { count, error } = await supabase.from("recipes").select("id", { count: "exact", head: true }).eq("status", "published");
      if (error || count === null) throw queryError(error);
      return count;
    },
    listRecipesForMetrics() {
      return fetchAllRows(() => supabase.from("recipes").select("id, status, image_path").order("updated_at", { ascending: false }), pageSize);
    },
    listTranslationsForMetrics(locales) {
      return fetchAllRows(() => supabase.from("recipe_translations").select("recipe_id, language_code, slug, title, instructions")
        .in("language_code", locales).order("recipe_id", { ascending: true }).order("language_code", { ascending: true }), pageSize);
    },
  };
}
