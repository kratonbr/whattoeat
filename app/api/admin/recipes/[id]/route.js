import { createAdminRecipeItemHandlers } from "@/modules/admin/presentation/http/editorial-handlers.mjs";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";
import { getAdminRecipeReadiness } from "@/services/admin/readiness";
import { deleteAdminRecipe, getAdminRecipe, saveAdminRecipe } from "@/services/admin/editorial-data";

const handlers = createAdminRecipeItemHandlers({
  requireAdmin,
  isReady: getAdminRecipeReadiness,
  getRecipe: getAdminRecipe,
  saveRecipe: saveAdminRecipe,
  deleteRecipe: deleteAdminRecipe,
});

async function withId(handler, request, context) {
  const { id } = await context.params;
  return handler(request, id);
}

export const GET = (request, context) => withId(handlers.GET, request, context);
export const PATCH = (request, context) => withId(handlers.PATCH, request, context);
export const DELETE = (request, context) => withId(handlers.DELETE, request, context);
