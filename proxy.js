import { refreshSupabaseAuthSession } from "@/lib/supabase/auth-proxy";
import { applyAdminNoStoreHeaders } from "@/lib/auth/admin-routing.mjs";

export async function proxy(request) {
  const response = await refreshSupabaseAuthSession(request);
  return applyAdminNoStoreHeaders(response);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
