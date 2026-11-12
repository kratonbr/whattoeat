import { createAdminIngredientCollectionHandlers } from "@/modules/admin/presentation/http/editorial-handlers.mjs";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";
import { getAdminRecipeReadiness } from "@/services/admin/readiness";
import { listAdminIngredients, saveAdminIngredient } from "@/services/admin/editorial-data";

const handlers = createAdminIngredientCollectionHandlers({
  requireAdmin,
  isReady: getAdminRecipeReadiness,
  listIngredients: listAdminIngredients,
  saveIngredient: saveAdminIngredient,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
