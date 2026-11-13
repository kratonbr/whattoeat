export function getAdminBaseOrigin(request) {
  try {
    const configuredBaseUrl = process.env.APP_BASE_URL;
    if (configuredBaseUrl) {
      const configuredUrl = new URL(configuredBaseUrl);
      if (configuredUrl.protocol !== "https:" && process.env.NODE_ENV === "production") return null;
      if (configuredUrl.username || configuredUrl.password || configuredUrl.pathname !== "/" || configuredUrl.search || configuredUrl.hash) return null;
      return configuredUrl.origin;
    }

    const requestUrl = new URL(request.url);
    if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(requestUrl.hostname)) return null;
    return requestUrl.origin;
  } catch {
    return null;
  }
}
