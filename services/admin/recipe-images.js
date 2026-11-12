import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseRecipeImageRepository } from "@/modules/recipes/infrastructure/supabase/recipe-image-repository.js";

export async function createAdminRecipeImageRepository() {
  return createSupabaseRecipeImageRepository(await createSupabaseAuthServerClient());
}
