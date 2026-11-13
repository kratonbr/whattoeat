import { createPasswordUpdateHandler } from "@/modules/admin/presentation/http/password-recovery-handlers.mjs";
import { requireAdminRecoverySession, clearRecoveryCapabilityCookie } from "@/modules/admin/infrastructure/supabase/recovery-authorization";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export const POST = createPasswordUpdateHandler({
  requireRecoveryAdmin: requireAdminRecoverySession,
  createClient: createSupabaseAuthServerClient,
  clearRecoveryCapability: clearRecoveryCapabilityCookie,
});
