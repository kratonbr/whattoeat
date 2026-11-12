import { createLogoutPostHandler } from "@/modules/admin/presentation/http/auth-handlers.mjs";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export const POST = createLogoutPostHandler({
  createClient: createSupabaseAuthServerClient,
});
