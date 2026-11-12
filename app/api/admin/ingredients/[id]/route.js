import { createAdminIngredientItemHandlers } from "@/modules/admin/presentation/http/editorial-handlers.mjs";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";
import { getAdminRecipeReadiness } from "@/services/admin/readiness";
import { deleteAdminIngredient, getAdminIngredient, saveAdminIngredient } from "@/services/admin/editorial-data";

const handlers = createAdminIngredientItemHandlers({
  requireAdmin,
  isReady: getAdminRecipeReadiness,
  getIngredient: getAdminIngredient,
  saveIngredient: saveAdminIngredient,
  deleteIngredient: deleteAdminIngredient,
});

async function withId(handler, request, context) {
  const { id } = await context.params;
  return handler(request, id);
}

export const GET = (request, context) => withId(handlers.GET, request, context);
export const PATCH = (request, context) => withId(handlers.PATCH, request, context);
export const DELETE = (request, context) => withId(handlers.DELETE, request, context);
