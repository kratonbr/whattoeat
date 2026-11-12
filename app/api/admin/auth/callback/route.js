import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { isAdminUser } from "@/lib/auth/admin-access.mjs";
import { applyAdminNoStoreHeaders } from "@/lib/auth/admin-routing.mjs";

function safeAdminPath(value) {
  return typeof value === "string" && value.startsWith("/admin/") && !value.startsWith("//")
    ? value
    : "/admin";
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeAdminPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL("/admin/login", requestUrl.origin));
  applyAdminNoStoreHeaders(response);
  if (!code) return response;

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return response;
    const { data, error } = await supabase.auth.getUser();
    if (error || !isAdminUser(data?.user)) {
      await supabase.auth.signOut({ scope: "local" });
      return response;
    }
    const success = NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    applyAdminNoStoreHeaders(success);
    return success;
  } catch {
    return response;
  }
}
