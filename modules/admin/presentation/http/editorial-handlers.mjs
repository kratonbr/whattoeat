import { validateIngredientPayload } from "../../../ingredients/domain/validation.mjs";
import { validateRecipeListQuery, validateRecipePayload } from "../../../recipes/domain/validation.mjs";
import {
  adminEmptyResponse,
  adminJson,
  getAdminAuthorizationFailure,
  getAdminServiceFailure,
  readAdminJson,
} from "../../../../shared/http/admin-http.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function denied(requireAdmin) {
  try { await requireAdmin(); return null; }
  catch (error) { return getAdminAuthorizationFailure(error); }
}

function validationFailure(errors) {
  return adminJson({ error: "VALIDATION_ERROR", fields: errors }, 422);
}

export function createAdminRecipeCollectionHandlers({ requireAdmin, isReady = () => false, listRecipes, saveRecipe, logError }) {
  return {
    GET: async (request) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      const query = validateRecipeListQuery(new URL(request.url).searchParams);
      if (!query.data) return validationFailure(query.errors);
      try { return adminJson({ data: await listRecipes(query.data) }, 200); }
      catch (error) { return getAdminServiceFailure(error, logError, "GET /api/admin/recipes"); }
    },
    POST: async (request) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      const body = await readAdminJson(request);
      if (body.error) return adminJson({ error: body.error }, body.status);
      const parsed = validateRecipePayload(body.data);
      if (!parsed.data) return validationFailure(parsed.errors);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { return adminJson({ data: await saveRecipe(null, parsed.data) }, 201); }
      catch (error) { return getAdminServiceFailure(error, logError, "POST /api/admin/recipes"); }
    },
  };
}

export function createAdminRecipeItemHandlers({ requireAdmin, isReady = () => false, getRecipe, saveRecipe, deleteRecipe, logError }) {
  return {
    GET: async (_request, id) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { return adminJson({ data: await getRecipe(id) }, 200); }
      catch (error) { return getAdminServiceFailure(error, logError, "GET /api/admin/recipes/:id"); }
    },
    PATCH: async (request, id) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      const body = await readAdminJson(request);
      if (body.error) return adminJson({ error: body.error }, body.status);
      const parsed = validateRecipePayload(body.data);
      if (!parsed.data) return validationFailure(parsed.errors);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { return adminJson({ data: await saveRecipe(id, parsed.data) }, 200); }
      catch (error) { return getAdminServiceFailure(error, logError, "PATCH /api/admin/recipes/:id"); }
    },
    DELETE: async (request, id) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      const body = await readAdminJson(request, { maxBytes: 1024 });
      if (body.error) return adminJson({ error: body.error }, body.status);
      if (body.data?.confirm !== true) return adminJson({ error: "CONFIRMATION_REQUIRED" }, 422);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { await deleteRecipe(id); return adminEmptyResponse(204); }
      catch (error) { return getAdminServiceFailure(error, logError, "DELETE /api/admin/recipes/:id"); }
    },
  };
}

export function createAdminIngredientCollectionHandlers({ requireAdmin, isReady = () => false, listIngredients, saveIngredient, logError }) {
  return {
    GET: async (request) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      const search = new URL(request.url).searchParams.get("q")?.trim() || "";
      if (search.length > 100) return validationFailure([{ field: "busca", message: "A busca pode ter até 100 caracteres." }]);
      try { return adminJson({ data: await listIngredients(search) }, 200); }
      catch (error) { return getAdminServiceFailure(error, logError, "GET /api/admin/ingredients"); }
    },
    POST: async (request) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      const body = await readAdminJson(request);
      if (body.error) return adminJson({ error: body.error }, body.status);
      const parsed = validateIngredientPayload(body.data);
      if (!parsed.data) return validationFailure(parsed.errors);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { return adminJson({ data: await saveIngredient(null, parsed.data) }, 201); }
      catch (error) { return getAdminServiceFailure(error, logError, "POST /api/admin/ingredients"); }
    },
  };
}

export function createAdminIngredientItemHandlers({ requireAdmin, isReady = () => false, getIngredient, saveIngredient, deleteIngredient, logError }) {
  return {
    GET: async (_request, id) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { return adminJson({ data: await getIngredient(id) }, 200); }
      catch (error) { return getAdminServiceFailure(error, logError, "GET /api/admin/ingredients/:id"); }
    },
    PATCH: async (request, id) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      const body = await readAdminJson(request);
      if (body.error) return adminJson({ error: body.error }, body.status);
      const parsed = validateIngredientPayload(body.data);
      if (!parsed.data) return validationFailure(parsed.errors);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { return adminJson({ data: await saveIngredient(id, parsed.data) }, 200); }
      catch (error) { return getAdminServiceFailure(error, logError, "PATCH /api/admin/ingredients/:id"); }
    },
    DELETE: async (request, id) => {
      const failure = await denied(requireAdmin);
      if (failure) return failure;
      if (!UUID.test(id || "")) return adminJson({ error: "NOT_FOUND" }, 404);
      const body = await readAdminJson(request, { maxBytes: 1024 });
      if (body.error) return adminJson({ error: body.error }, body.status);
      if (body.data?.confirm !== true) return adminJson({ error: "CONFIRMATION_REQUIRED" }, 422);
      if (!isReady()) return adminJson({ error: "RLS_NOT_READY" }, 503);
      try { await deleteIngredient(id); return adminEmptyResponse(204); }
      catch (error) { return getAdminServiceFailure(error, logError, "DELETE /api/admin/ingredients/:id"); }
    },
  };
}
