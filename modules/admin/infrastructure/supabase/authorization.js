import "server-only";

import { io } from "next/cache";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createAdminAuthorizer } from "../../domain/access.mjs";

export async function getAdminAccess() {
  await io();
  try {
    const supabase = await createSupabaseAuthServerClient();
    return await createAdminAuthorizer(() => supabase.auth.getUser())();
  } catch {
    return { allowed: false, status: 503, user: null };
  }
}

export async function requireAdmin() {
  const access = await getAdminAccess();
  if (!access.allowed) {
    const error = new Error("ADMIN_AUTHORIZATION_REQUIRED");
    error.status = access.status;
    throw error;
  }
  return access.user;
}
