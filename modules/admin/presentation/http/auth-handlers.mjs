import { isAdminUser } from "../../domain/access.mjs";
import { adminJson, adminEmptyResponse, isSameOrigin, readAdminJson } from "../../../../shared/http/admin-http.mjs";

const authJson = (body, status) => adminJson(body, status, { relaxedCacheHeader: true });

async function readCredentials(request) {
  const result = await readAdminJson(request, { maxBytes: 4096, originFailureStatus: 400 });
  if (result.error) return { error: result.error };
  const email = typeof result.data.email === "string" ? result.data.email.trim() : "";
  const password = typeof result.data.password === "string" ? result.data.password : "";
  if (!email || email.length > 254 || !password || password.length > 1024) return { error: "INVALID_CREDENTIALS" };
  return { email, password };
}

export function createLoginPostHandler({ createClient, clearRecoveryCapability = async () => {} }) {
  return async function POST(request) {
    const credentials = await readCredentials(request);
    if (credentials.error) return authJson({ error: credentials.error }, 400);
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        if (error.status === 429) return authJson({ error: "SIGN_IN_TEMPORARILY_UNAVAILABLE" }, 429);
        if (error.status >= 500) return authJson({ error: "AUTH_UNAVAILABLE" }, 503);
        return authJson({ error: "INVALID_CREDENTIALS" }, 401);
      }
      if (!isAdminUser(data?.user)) {
        await supabase.auth.signOut({ scope: "local" });
        return authJson({ error: "ADMIN_ACCESS_REQUIRED" }, 403);
      }
      await clearRecoveryCapability();
      return authJson({ authenticated: true }, 200);
    } catch { return authJson({ error: "AUTH_UNAVAILABLE" }, 503); }
  };
}

export function createLogoutPostHandler({ createClient, clearRecoveryCapability = async () => {} }) {
  return async function POST(request) {
    if (!isSameOrigin(request)) return authJson({ error: "INVALID_ORIGIN" }, 403);
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) return authJson({ error: "LOGOUT_FAILED" }, 503);
      await clearRecoveryCapability();
      return adminEmptyResponse(204, { relaxedCacheHeader: true });
    } catch { return authJson({ error: "AUTH_UNAVAILABLE" }, 503); }
  };
}
