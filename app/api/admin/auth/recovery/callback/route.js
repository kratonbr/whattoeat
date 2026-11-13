import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { applyAdminNoStoreHeaders } from "@/lib/auth/admin-routing.mjs";
import { getAdminBaseOrigin } from "@/lib/auth/admin-base-url.mjs";
import {
  ADMIN_RECOVERY_COOKIE,
  createRecoveryCapabilityForSession,
  readRecoveryCookieStore,
  setRecoveryCapabilityCookie,
} from "@/modules/admin/infrastructure/supabase/recovery-authorization";
import { isAdminUser } from "@/lib/auth/admin-access.mjs";

function recoveryRedirect(origin, path) {
  const response = NextResponse.redirect(new URL(path, origin));
  applyAdminNoStoreHeaders(response);
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request) {
  const origin = getAdminBaseOrigin(request);
  if (!origin) {
    const unavailable = NextResponse.json({ error: "RECOVERY_UNAVAILABLE" }, { status: 503 });
    applyAdminNoStoreHeaders(unavailable);
    unavailable.headers.set("Referrer-Policy", "no-referrer");
    return unavailable;
  }

  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const cookieStore = await readRecoveryCookieStore();
  cookieStore.set(ADMIN_RECOVERY_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });

  if (type !== "recovery" || typeof tokenHash !== "string" || tokenHash.length < 16 || tokenHash.length > 2048) {
    return recoveryRedirect(origin, "/admin/esqueci-senha?estado=link-invalido");
  }

  try {
    const supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (error || !data?.session || !isAdminUser(data.user)) {
      if (!error && data?.session) await supabase.auth.signOut({ scope: "local" });
      return recoveryRedirect(origin, "/admin/esqueci-senha?estado=link-invalido");
    }

    const capability = createRecoveryCapabilityForSession({ user: data.user, accessToken: data.session.access_token });
    if (!capability) {
      await supabase.auth.signOut({ scope: "local" });
      return recoveryRedirect(origin, "/admin/esqueci-senha?estado=indisponivel");
    }

    const { data: verifiedData, error: verifiedError } = await supabase.auth.getUser();
    if (verifiedError || verifiedData?.user?.id !== data.user.id || !isAdminUser(verifiedData.user)) {
      await supabase.auth.signOut({ scope: "local" });
      return recoveryRedirect(origin, "/admin/esqueci-senha?estado=link-invalido");
    }

    setRecoveryCapabilityCookie(cookieStore, capability);
    return recoveryRedirect(origin, "/admin/redefinir-senha");
  } catch {
    return recoveryRedirect(origin, "/admin/esqueci-senha?estado=indisponivel");
  }
}
