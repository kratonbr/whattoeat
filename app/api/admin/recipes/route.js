import { createAdminRecipeCollectionHandlers } from "@/modules/admin/presentation/http/editorial-handlers.mjs";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";
import { getAdminRecipeReadiness } from "@/services/admin/readiness";
import { listAdminRecipes, saveAdminRecipe } from "@/services/admin/editorial-data";

const handlers = createAdminRecipeCollectionHandlers({
  requireAdmin,
  isReady: getAdminRecipeReadiness,
  listRecipes: listAdminRecipes,
  saveRecipe: saveAdminRecipe,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
