import { createAdminDashboardGetHandler } from "@/modules/admin/presentation/http/dashboard-handler.mjs";
import { requireAdmin } from "@/modules/admin/infrastructure/supabase/authorization";
import { getAdminDashboardSummary } from "@/services/admin/dashboard-summary";

export const GET = createAdminDashboardGetHandler({
  requireAdmin,
  getSummary: getAdminDashboardSummary,
});
