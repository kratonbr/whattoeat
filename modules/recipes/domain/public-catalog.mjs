import {
  DEFAULT_RECIPE_LOCALE,
  SUPPORTED_RECIPE_CATEGORIES,
  SUPPORTED_RECIPE_DIFFICULTIES,
  SUPPORTED_RECIPE_LOCALES,
  isSupportedRecipeLocale,
} from "./recipes.mjs";

export const PUBLIC_RECIPE_SORTS = Object.freeze(["newest", "fastest", "alphabetical"]);
export const PUBLIC_RECIPE_DIFFICULTIES = SUPPORTED_RECIPE_DIFFICULTIES;
export const PUBLIC_RECIPE_PAGE_SIZE = 12;

export function parsePublicRecipeCatalogQuery(searchParams) {
  const locale = searchParams.get("locale") ?? DEFAULT_RECIPE_LOCALE;
  const categoryValue = (searchParams.get("category") ?? "all").toLowerCase();
  const category = categoryValue === "all" ? null : categoryValue;
  const difficulty = searchParams.get("difficulty") || null;
  const sort = searchParams.get("sort") || "newest";
  const search = (searchParams.get("q") ?? "").trim();
  const maxPrepTimeValue = searchParams.get("maxPrepTime");
  const maxPrepTime = maxPrepTimeValue === null || maxPrepTimeValue === ""
    ? null
    : Number(maxPrepTimeValue);
  const page = Number(searchParams.get("page") || 1);

  if (!isSupportedRecipeLocale(locale)) return { error: "INVALID_LOCALE", status: 400 };
  if (category && !SUPPORTED_RECIPE_CATEGORIES.includes(category)) {
    return { error: "INVALID_CATEGORY", status: 400 };
  }
  if (difficulty && !PUBLIC_RECIPE_DIFFICULTIES.includes(difficulty)) {
    return { error: "INVALID_DIFFICULTY", status: 400 };
  }
  if (!PUBLIC_RECIPE_SORTS.includes(sort)) return { error: "INVALID_SORT", status: 400 };
  if (!Number.isInteger(page) || page < 1 || page > 500) return { error: "INVALID_PAGE", status: 400 };
  if (maxPrepTime !== null && (!Number.isInteger(maxPrepTime) || maxPrepTime < 1 || maxPrepTime > 1440)) {
    return { error: "INVALID_MAX_PREP_TIME", status: 400 };
  }
  if (search.length > 100) return { error: "INVALID_SEARCH", status: 400 };

  return {
    params: {
      locale,
      category,
      difficulty,
      maxPrepTime,
      search,
      sort,
      page,
      pageSize: PUBLIC_RECIPE_PAGE_SIZE,
    },
  };
}

export function escapeRecipeTitleSearch(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function uniqueIds(rows) {
  return [...new Set((rows ?? []).map((row) => row.recipe_id).filter(Boolean))];
}

export { SUPPORTED_RECIPE_LOCALES };
