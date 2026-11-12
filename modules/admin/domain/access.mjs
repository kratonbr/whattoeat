export function isAdminUser(user) {
  return Boolean(user && user.app_metadata?.role === "admin");
}

function isTemporaryAuthFailure(error) {
  return Boolean(error && (error.name === "AuthRetryableFetchError" || error.status === 0 || error.status >= 500));
}

export function createAdminAuthorizer(getAuthenticatedUser) {
  return async function authorizeAdmin() {
    let result;
    try { result = await getAuthenticatedUser(); }
    catch { return { allowed: false, status: 503, user: null }; }
    if (result?.error) return { allowed: false, status: isTemporaryAuthFailure(result.error) ? 503 : 401, user: null };
    const user = result?.data?.user ?? null;
    if (!user) return { allowed: false, status: 401, user: null };
    if (!isAdminUser(user)) return { allowed: false, status: 403, user: null };
    return { allowed: true, status: 200, user };
  };
}
