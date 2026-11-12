import assert from "node:assert/strict";
import test from "node:test";

import { createGetRandomPublishedRecipe } from "../../modules/recipes/application/get-random-published-recipe.mjs";
import { createGetPublishedRecipeBySlug } from "../../modules/recipes/application/get-published-recipe-by-slug.mjs";
import { mapIngredientTranslations } from "../../modules/ingredients/domain/translations.mjs";

test("random recipe use case delegates data access and applies exclusion in the domain", async () => {
  const calls = [];
  const repository = {
    async findPublishedCandidates(filters) {
      calls.push(["candidates", filters]);
      return [{ id: "recipe-a" }, { id: "recipe-b" }];
    },
    async getPublishedRecipeById(input) {
      calls.push(["selected", input]);
      return { id: input.id, title: "Receita" };
    },
  };
  const getRandom = createGetRandomPublishedRecipe({ recipeRepository: repository, random: () => 0 });
  const result = await getRandom({ category: "dinner", locale: "pt-BR", excludeId: "recipe-a" });
  assert.equal(result.id, "recipe-b");
  assert.deepEqual(calls[0], ["candidates", { category: "dinner", locale: "pt-BR", recipeId: null }]);
  assert.equal(calls[1][1].includeImage, false);
});

test("random recipe use case returns null when there are no candidates", async () => {
  let detailReads = 0;
  const getRandom = createGetRandomPublishedRecipe({
    recipeRepository: { findPublishedCandidates: async () => [], getPublishedRecipeById: async () => { detailReads += 1; } },
  });
  assert.equal(await getRandom({ locale: "en" }), null);
  assert.equal(detailReads, 0);
});

test("slug use case uses the locale-independent match and canonical slug", async () => {
  const repository = {
    findSlugMatches: async () => [
      { recipe_id: "recipe-a", language_code: "en", slug: "tomato-soup" },
      { recipe_id: "recipe-a", language_code: "pt-BR", slug: "sopa-de-tomate" },
    ],
    getPublishedRecipeById: async ({ id, locale }) => ({ id, locale, slug: "wrong-local-slug" }),
  };
  const getBySlug = createGetPublishedRecipeBySlug({ recipeRepository: repository });
  assert.deepEqual(await getBySlug({ slug: "tomato-soup", locale: "en" }), {
    id: "recipe-a", locale: "en", slug: "sopa-de-tomate",
  });
});

test("slug use case does not load a recipe when a slug is ambiguous", async () => {
  let detailReads = 0;
  const getBySlug = createGetPublishedRecipeBySlug({
    recipeRepository: {
      findSlugMatches: async () => [{ recipe_id: "one" }, { recipe_id: "two" }],
      getPublishedRecipeById: async () => { detailReads += 1; },
    },
  });
  assert.equal(await getBySlug({ slug: "same-slug", locale: "pt-BR" }), null);
  assert.equal(detailReads, 0);
});

test("ingredient translation mapping preserves quantities, units and preparation notes", () => {
  const mapped = mapIngredientTranslations([
    { ingredient_id: "i1", quantity: 2, quantity_text: null, unit_code: null, preparation_note: "picado", ingredients: { default_unit: "un" } },
  ], [{ ingredient_id: "i1", name: "Tomate" }], "pt-BR");
  assert.deepEqual(mapped[0], {
    id: "i1", name: "Tomate", quantity: 2, quantity_text: null, unit_code: "un", preparation_note: "picado",
  });
});

test("ingredient translation mapping fails closed if the requested locale is missing", () => {
  assert.throws(
    () => mapIngredientTranslations([{ ingredient_id: "i1" }], [], "en"),
    (error) => error.code === "MISSING_INGREDIENT_TRANSLATION",
  );
});
