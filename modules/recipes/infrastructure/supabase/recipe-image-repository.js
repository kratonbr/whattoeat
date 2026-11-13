import "server-only";

function repositoryError(error) {
  const failure = new Error("Recipe image operation failed.");
  failure.code = error?.code || "STORAGE_OPERATION_FAILED";
  throw failure;
}

export function createSupabaseRecipeImageRepository(supabase) {
  const storage = supabase.storage.from("recipe-images");
  return {
    async getRecipeImagePath(recipeId) {
      const { data, error } = await supabase.from("recipes").select("image_path").eq("id", recipeId).maybeSingle();
      if (error) repositoryError(error);
      if (!data) { const missing = new Error("Recipe not found."); missing.code = "P0002"; throw missing; }
      return data.image_path;
    },
    async isImageReferencedByAnotherRecipe(imagePath, recipeId) {
      if (!imagePath) return false;
      const { count, error } = await supabase.from("recipes")
        .select("id", { count: "exact", head: true })
        .eq("image_path", imagePath)
        .neq("id", recipeId);
      if (error) repositoryError(error);
      return (count ?? 0) > 0;
    },
    async upload(path, bytes, contentType) {
      const { error } = await storage.upload(path, bytes, { contentType, cacheControl: "3600", upsert: false });
      if (error) repositoryError(error);
    },
    async attach(recipeId, imagePath) {
      const { data, error } = await supabase.rpc("admin_set_recipe_image", { p_recipe_id: recipeId, p_image_path: imagePath });
      if (error) repositoryError(error);
      return data;
    },
    async remove(paths) {
      if (!paths.length) return;
      const { error } = await storage.remove(paths);
      if (error) repositoryError(error);
    },
    async createSignedUrl(path, expiresIn = 3600) {
      if (!path) return null;
      const { data, error } = await storage.createSignedUrl(path, expiresIn);
      if (error) repositoryError(error);
      return data?.signedUrl ?? null;
    },
  };
}
