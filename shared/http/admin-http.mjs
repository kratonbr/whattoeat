export const ADMIN_NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
});

const AUTH_NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
});

export function adminJson(body, status, { relaxedCacheHeader = false } = {}) {
  return Response.json(body, { status, headers: relaxedCacheHeader ? AUTH_NO_STORE_HEADERS : ADMIN_NO_STORE_HEADERS });
}

export function adminEmptyResponse(status, { relaxedCacheHeader = false } = {}) {
  return new Response(null, { status, headers: relaxedCacheHeader ? AUTH_NO_STORE_HEADERS : ADMIN_NO_STORE_HEADERS });
}

export function applyAdminNoStoreHeaders(response) {
  for (const [name, value] of Object.entries(ADMIN_NO_STORE_HEADERS)) response.headers.set(name, value);
  return response;
}

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export function getAdminAuthorizationFailure(error, options) {
  const status = [401, 403].includes(error?.status) ? error.status : 503;
  const code = status === 401 ? "UNAUTHENTICATED" : status === 403 ? "ADMIN_REQUIRED" : "AUTH_UNAVAILABLE";
  return adminJson({ error: code }, status, options);
}

export async function readAdminJson(request, { maxBytes = 200_000, originFailureStatus = 403 } = {}) {
  if (!isSameOrigin(request)) return { error: "INVALID_ORIGIN", status: originFailureStatus };
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) return { error: "INVALID_REQUEST", status: 400 };
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes) return { error: "INVALID_REQUEST", status: 413 };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) return { error: "INVALID_REQUEST", status: 413 };
    return { data: JSON.parse(text) };
  } catch { return { error: "INVALID_REQUEST", status: 400 }; }
}

export function getAdminServiceFailure(error, logError = (...args) => console.error(...args), context = "admin") {
  const code = error?.code;
  logError(`[${context}]`, typeof code === "string" ? code : "UNKNOWN_ERROR");
  if (code === "P0002") return adminJson({ error: "NOT_FOUND" }, 404);
  if (code === "23505") return adminJson({ error: "DUPLICATE" }, 409);
  if (code === "23503") return adminJson({ error: "IN_USE" }, 409);
  if (["22023", "23514", "INVALID_INPUT"].includes(code)) return adminJson({ error: "VALIDATION_ERROR" }, 422);
  if (code === "42501") return adminJson({ error: "RLS_NOT_READY" }, 503);
  return adminJson({ error: "OPERATION_UNAVAILABLE" }, 503);
}
