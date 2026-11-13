import {
  DEFAULT_RECIPE_LOCALE,
  isSupportedRecipeCategory,
  isSupportedRecipeLocale,
} from "../../domain/recipes.mjs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export function parseRandomMealQuery(searchParams) {
  const requestedCategory = searchParams.get("category") ?? "all";
  const normalizedCategory = requestedCategory.toLowerCase();
  const category = normalizedCategory === "all" ? null : normalizedCategory;
  const locale = searchParams.get("locale") ?? DEFAULT_RECIPE_LOCALE;
  const excludeId = searchParams.get("exclude");
  const recipeId = searchParams.get("recipeId");

  if (category && !isSupportedRecipeCategory(category)) {
    return { error: "INVALID_CATEGORY", status: 400 };
  }
  if (!isSupportedRecipeLocale(locale)) {
    return { error: "INVALID_LOCALE", status: 400 };
  }
  if (excludeId && !uuidPattern.test(excludeId)) {
    return { error: "INVALID_EXCLUDE_ID", status: 400 };
  }
  if (recipeId && !uuidPattern.test(recipeId)) {
    return { error: "INVALID_RECIPE_ID", status: 400 };
  }

  return { params: { category, locale, excludeId, recipeId } };
}

export function createRandomMealGetHandler({
  getPublishedRecipe,
  logError = (...args) => console.error(...args),
}) {
  if (typeof getPublishedRecipe !== "function") {
    throw new TypeError("getPublishedRecipe must be a function.");
  }

  return async function GET(request) {
    const searchParams = new URL(request.url).searchParams;
    const parsed = parseRandomMealQuery(searchParams);

    if (parsed.error) {
      return Response.json({ error: parsed.error }, { status: parsed.status, headers: NO_STORE_HEADERS });
    }

    try {
      const meal = await getPublishedRecipe(parsed.params);
      if (!meal) {
        return Response.json(
          { error: "NO_RECIPES" },
          { status: 404, headers: NO_STORE_HEADERS },
        );
      }
      return Response.json(
        { meal },
        { headers: NO_STORE_HEADERS },
      );
    } catch (error) {
      const notConfigured = error?.code === "SUPABASE_NOT_CONFIGURED";
      logError("[GET /api/meals/random]", error?.code ?? "UNKNOWN_ERROR");
      return Response.json(
        {
          error: notConfigured
            ? "SUPABASE_NOT_CONFIGURED"
            : "RECIPE_LOOKUP_FAILED",
        },
        {
          status: notConfigured ? 503 : 500,
          headers: NO_STORE_HEADERS,
        },
      );
    }
  };
}
