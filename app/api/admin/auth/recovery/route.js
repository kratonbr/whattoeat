import { createPasswordRecoveryHandler } from "@/modules/admin/presentation/http/password-recovery-handlers.mjs";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export const POST = createPasswordRecoveryHandler({ createClient: createSupabaseAuthServerClient });
