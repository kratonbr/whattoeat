import { ADMIN_DASHBOARD_LOCALES, calculateAdminDashboardMetrics, listRecipesWithPendingTranslations } from "../domain/dashboard.mjs";

export function createGetDashboardSummary({ dashboardRepository, adminReadPoliciesReady = false }) {
  return async function getDashboardSummary() {
    if (!adminReadPoliciesReady) {
      const published = await dashboardRepository.countPublishedRecipes();
      return {
        complete: false,
        unavailableReason: "ADMIN_RLS_REQUIRED",
        metrics: { total: null, published, drafts: null, withoutImage: null, translationsPending: null },
        pendingRecipes: null,
      };
    }
    const [recipes, translations] = await Promise.all([
      dashboardRepository.listRecipesForMetrics(),
      dashboardRepository.listTranslationsForMetrics(ADMIN_DASHBOARD_LOCALES),
    ]);
    return {
      complete: true,
      unavailableReason: null,
      metrics: calculateAdminDashboardMetrics({ recipes, translations }),
      pendingRecipes: listRecipesWithPendingTranslations({ recipes, translations }, 5),
    };
  };
}
