import { createPasswordUpdateHandler } from "@/modules/admin/presentation/http/password-recovery-handlers.mjs";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export const POST = createPasswordUpdateHandler({ requireAdmin, createClient: createSupabaseAuthServerClient });
