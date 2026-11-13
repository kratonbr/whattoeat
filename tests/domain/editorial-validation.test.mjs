import assert from "node:assert/strict";
import test from "node:test";

import { validateRecipeListQuery, validateRecipePayload } from "../../modules/recipes/domain/validation.mjs";
import { validateIngredientPayload } from "../../modules/ingredients/domain/validation.mjs";

const uuid = "d9428888-122b-4f35-8b33-7b3a7d32d934";

test("draft validation allows missing translations while validating stored fields", () => {
  const result = validateRecipePayload({ category: "dinner", prep_time_minutes: "25", servings: "2", status: "draft", translations: [], ingredients: [] });
  assert.deepEqual(result.errors, []);
  assert.equal(result.data.recipe.prep_time_minutes, 25);
});

test("publication requires both locales, instructions and at least one ingredient", () => {
  const result = validateRecipePayload({ category: "lunch", prep_time_minutes: 20, servings: 2, status: "published", translations: [], ingredients: [] });
  assert.equal(result.data, null);
  assert.ok(result.errors.some((error) => error.field === "tradução pt-BR"));
  assert.ok(result.errors.some((error) => error.field === "tradução en"));
  assert.ok(result.errors.some((error) => error.field === "ingredientes"));
});


test("recipe validation rejects malformed ingredient UUIDs and duplicate ingredient links", () => {
  const base = { category: "dinner", prep_time_minutes: 30, servings: 2, status: "draft", translations: [] };
  const invalid = validateRecipePayload({ ...base, ingredients: [{ ingredient_id: "not-a-uuid", quantity: 1 }] });
  assert.equal(invalid.data, null);
  const duplicate = validateRecipePayload({ ...base, ingredients: [
    { ingredient_id: uuid, quantity: 1 }, { ingredient_id: uuid, quantity: 2 },
  ] });
  assert.equal(duplicate.data, null);
  assert.ok(duplicate.errors.some((error) => error.field === "ingredientes"));
});

test("recipe list query applies pagination defaults and rejects invalid filters", () => {
  const valid = validateRecipeListQuery(new URLSearchParams("q=sopa&category=dinner"));
  assert.deepEqual(valid.data, { page: 1, pageSize: 20, category: "dinner", status: "", search: "sopa" });
  const invalid = validateRecipeListQuery(new URLSearchParams("page=0&status=hidden"));
  assert.equal(invalid.data, null);
  assert.equal(invalid.errors.length, 2);
});

test("ingredient validation accepts supported locales and normalizes the key", () => {
  const result = validateIngredientPayload({ ingredient_key: "  Tomato-Red ", default_unit: "g", translations: [
    { language_code: "pt-BR", name: "Tomate" }, { language_code: "en", name: "Tomato" },
  ] });
  assert.equal(result.errors.length, 0);
  assert.equal(result.data.ingredient_key, "tomato-red");
});

test("ingredient validation rejects duplicate or unsupported language entries", () => {
  const result = validateIngredientPayload({ ingredient_key: "tomato", translations: [
    { language_code: "en", name: "Tomato" }, { language_code: "en", name: "Tomate" },
  ] });
  assert.equal(result.data, null);
  assert.ok(result.errors.some((error) => error.field === "traduções"));
});
