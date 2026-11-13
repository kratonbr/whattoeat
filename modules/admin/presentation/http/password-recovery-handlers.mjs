import { adminJson, getAdminAuthorizationFailure, isSameOrigin, readAdminJson } from "../../../../shared/http/admin-http.mjs";
import { getAdminBaseOrigin } from "../../../../lib/auth/admin-base-url.mjs";

export function createPasswordRecoveryHandler({ createClient }) {
  return async function POST(request) {
    if (!isSameOrigin(request)) return adminJson({ error: "INVALID_ORIGIN" }, 403);
    const body = await readAdminJson(request, { maxBytes: 4096, originFailureStatus: 403 });
    if (body.error) return adminJson({ error: body.error }, body.status);
    const email = typeof body.data?.email === "string" ? body.data.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return adminJson({ accepted: true }, 202);
    try {
      const supabase = await createClient();
      const origin = getAdminBaseOrigin(request);
      if (!origin) return adminJson({ accepted: true }, 202);
      const redirectTo = new URL("/api/admin/auth/recovery/callback", origin).toString();
      await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    } catch {
      // The same acknowledgement prevents account enumeration and hides Auth internals.
    }
    return adminJson({ accepted: true }, 202);
  };
}

export function createPasswordUpdateHandler({ requireRecoveryAdmin, createClient, clearRecoveryCapability }) {
  return async function POST(request) {
    if (!isSameOrigin(request)) return adminJson({ error: "INVALID_ORIGIN" }, 403);
    try { await requireRecoveryAdmin(); }
    catch (error) { return getAdminAuthorizationFailure(error); }
    const body = await readAdminJson(request, { maxBytes: 4096, originFailureStatus: 403 });
    if (body.error) return adminJson({ error: body.error }, body.status);
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) return adminJson({ error: "INVALID_REQUEST" }, 400);
    const { password, confirmation } = body.data;
    if (typeof password !== "string" || password.length < 12 || password.length > 128) return adminJson({ error: "PASSWORD_INVALID" }, 422);
    if (password !== confirmation) return adminJson({ error: "PASSWORD_MISMATCH" }, 422);
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return adminJson({ error: "PASSWORD_UPDATE_FAILED" }, 422);
      await clearRecoveryCapability();
      return adminJson({ updated: true }, 200);
    } catch { return adminJson({ error: "AUTH_UNAVAILABLE" }, 503); }
  };
}
