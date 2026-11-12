import { createGetDashboardSummary } from "../../modules/admin/application/get-dashboard-summary.mjs";
import { createSupabaseDashboardRepository } from "../../modules/admin/infrastructure/supabase/dashboard-repository.mjs";

// Compatibility composition for existing callers and tests. It creates a
// request-scoped repository; the use case itself has no Supabase dependency.
export function createAdminDashboardSummaryService({ createClient, adminReadPoliciesReady = false, pageSize = 500 }) {
  return async function getAdminDashboardSummary() {
    const dashboardRepository = createSupabaseDashboardRepository(await createClient(), { pageSize });
    return createGetDashboardSummary({ dashboardRepository, adminReadPoliciesReady })();
  };
}
