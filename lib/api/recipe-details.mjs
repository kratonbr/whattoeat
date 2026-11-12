import {
  DEFAULT_RECIPE_LOCALE,
  isSupportedRecipeLocale,
} from "../../domain/recipes.mjs";

export function parseRecipeDetailsQuery(slug, searchParams) {
  const locale = searchParams.get("locale") ?? DEFAULT_RECIPE_LOCALE;

  if (
    typeof slug !== "string" ||
    !slug.trim() ||
    slug !== slug.trim() ||
    slug.includes("/") ||
    slug.includes("\\")
  ) {
    return { error: "INVALID_SLUG", status: 400 };
  }

  if (!isSupportedRecipeLocale(locale)) {
    return { error: "INVALID_LOCALE", status: 400 };
  }

  return { params: { slug, locale } };
}

export function createRecipeDetailsGetHandler({
  getPublishedRecipeBySlug,
  logError = (...args) => console.error(...args),
}) {
  if (typeof getPublishedRecipeBySlug !== "function") {
    throw new TypeError("getPublishedRecipeBySlug must be a function.");
  }

  return async function GET(request, context) {
    const { slug } = await context.params;
    const parsed = parseRecipeDetailsQuery(
      slug,
      new URL(request.url).searchParams,
    );

    if (parsed.error) {
      return Response.json({ error: parsed.error }, { status: parsed.status });
    }

    try {
      const recipe = await getPublishedRecipeBySlug(parsed.params);

      if (!recipe) {
        return Response.json(
          { error: "RECIPE_NOT_FOUND" },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }

      return Response.json(
        { recipe },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      const notConfigured = error?.code === "SUPABASE_NOT_CONFIGURED";
      logError("[GET /api/recipes/:slug]", error?.code ?? "UNKNOWN_ERROR");

      return Response.json(
        {
          error: notConfigured
            ? "SUPABASE_NOT_CONFIGURED"
            : "RECIPE_LOOKUP_FAILED",
        },
        {
          status: notConfigured ? 503 : 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  };
}
