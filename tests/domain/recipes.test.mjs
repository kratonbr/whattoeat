import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_RECIPE_LOCALE,
  resolveRecipeIdFromSlugMatches,
  selectCanonicalRecipeSlug,
} from "../../modules/recipes/domain/recipes.mjs";

test("uses Brazilian Portuguese as the default recipe locale", () => {
  assert.equal(DEFAULT_RECIPE_LOCALE, "pt-BR");
});

test("resolves the same recipe when its slug appears in multiple translations", () => {
  assert.equal(
    resolveRecipeIdFromSlugMatches([
      { recipe_id: "recipe-1" },
      { recipe_id: "recipe-1" },
    ]),
    "recipe-1",
  );
});

test("does not guess when a slug matches different recipes across languages", () => {
  assert.equal(
    resolveRecipeIdFromSlugMatches([
      { recipe_id: "recipe-1" },
      { recipe_id: "recipe-2" },
    ]),
    null,
  );
});

test("chooses one canonical slug regardless of the currently selected language", () => {
  const translations = [
    { language_code: "en", slug: "pasta-with-tomato" },
    { language_code: "pt-BR", slug: "massa-com-tomate" },
  ];

  assert.equal(
    selectCanonicalRecipeSlug(translations, "fallback"),
    "massa-com-tomate",
  );
});
