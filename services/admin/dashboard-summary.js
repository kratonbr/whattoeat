import "server-only";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createAdminDashboardSummaryService } from "./dashboard-summary.mjs";

const getSummary = createAdminDashboardSummaryService({
  createClient: createSupabaseAuthServerClient,
  adminReadPoliciesReady: process.env.ADMIN_DASHBOARD_RLS_READY === "true",
});

export function getAdminDashboardSummary() {
  return getSummary();
}
