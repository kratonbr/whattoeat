import { createRecipeImageHandlers } from "@/modules/admin/presentation/http/recipe-image-handlers.mjs";
import { getAdminStorageReadiness } from "@/services/admin/readiness";
import { createAdminRecipeImageRepository } from "@/services/admin/recipe-images";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";

const handlers = createRecipeImageHandlers({
  requireAdmin,
  isReady: getAdminStorageReadiness,
  createRepository: createAdminRecipeImageRepository,
});

export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
