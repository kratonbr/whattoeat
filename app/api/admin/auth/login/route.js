import { createLoginPostHandler } from "@/modules/admin/presentation/http/auth-handlers.mjs";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { clearRecoveryCapabilityCookie } from "@/modules/admin/infrastructure/supabase/recovery-authorization";

export const POST = createLoginPostHandler({
  createClient: createSupabaseAuthServerClient,
  clearRecoveryCapability: clearRecoveryCapabilityCookie,
});
