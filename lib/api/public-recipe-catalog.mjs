import { parsePublicRecipeCatalogQuery } from "../../modules/recipes/domain/public-catalog.mjs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export function createPublicRecipeCatalogGetHandler({
  listPublishedRecipes,
  logError = (...args) => console.error(...args),
}) {
  if (typeof listPublishedRecipes !== "function") {
    throw new TypeError("listPublishedRecipes must be a function.");
  }

  return async function GET(request) {
    const parsed = parsePublicRecipeCatalogQuery(new URL(request.url).searchParams);
    if (parsed.error) {
      return Response.json({ error: parsed.error }, { status: parsed.status, headers: NO_STORE_HEADERS });
    }

    try {
      const result = await listPublishedRecipes(parsed.params);
      return Response.json(result, { headers: NO_STORE_HEADERS });
    } catch (error) {
      const notConfigured = error?.code === "SUPABASE_NOT_CONFIGURED";
      logError("[GET /api/recipes]", error?.code ?? "UNKNOWN_ERROR");
      return Response.json(
        { error: notConfigured ? "SUPABASE_NOT_CONFIGURED" : "RECIPE_LOOKUP_FAILED" },
        { status: notConfigured ? 503 : 500, headers: NO_STORE_HEADERS },
      );
    }
  };
}
