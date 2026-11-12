import "server-only";

export function getAdminRecipeReadiness() {
  return process.env.ADMIN_EDITORIAL_RLS_READY === "true";
}

export function getAdminStorageReadiness() {
  return process.env.ADMIN_STORAGE_READY === "true";
}
