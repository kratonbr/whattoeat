import { adminJson, getAdminAuthorizationFailure } from "../../../../shared/http/admin-http.mjs";

export function createAdminDashboardGetHandler({ requireAdmin, getSummary, logError = (...args) => console.error(...args) }) {
  return async function GET() {
    try { await requireAdmin(); }
    catch (error) { return getAdminAuthorizationFailure(error); }
    try { return adminJson({ data: await getSummary() }, 200); }
    catch (error) {
      logError("[GET /api/admin/dashboard/summary]", error?.code ?? "UNKNOWN_ERROR");
      return adminJson({ error: "DASHBOARD_UNAVAILABLE" }, 503);
    }
  };
}
