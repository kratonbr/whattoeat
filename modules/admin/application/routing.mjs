import { applyAdminNoStoreHeaders } from "../../../shared/http/admin-http.mjs";

export function shouldRedirectAdminLoginToPanel(access) {
  return Boolean(access?.allowed === true && access.user?.app_metadata?.role === "admin");
}

export { applyAdminNoStoreHeaders };
