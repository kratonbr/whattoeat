import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminIngredientCollectionHandlers,
  createAdminRecipeCollectionHandlers,
} from "../../modules/admin/presentation/http/editorial-handlers.mjs";

function request(path, { method = "GET", body, origin = "http://localhost:3000" } = {}) {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: { origin, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const draft = {
  category: "dinner", prep_time_minutes: 20, servings: 2, difficulty: "easy", status: "draft",
  translations: [], ingredients: [],
};

test("editorial endpoints deny anonymous access before repository calls", async () => {
  let calls = 0;
  const handlers = createAdminRecipeCollectionHandlers({
    requireAdmin: async () => { throw Object.assign(new Error(), { status: 401 }); },
    listRecipes: async () => { calls += 1; },
    saveRecipe: async () => { calls += 1; },
  });
  const response = await handlers.GET(request("/api/admin/recipes"));
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test("editorial endpoints deny authenticated non-admin access before repository calls", async () => {
  let calls = 0;
  const handlers = createAdminIngredientCollectionHandlers({
    requireAdmin: async () => { throw Object.assign(new Error(), { status: 403 }); },
    listIngredients: async () => { calls += 1; },
    saveIngredient: async () => { calls += 1; },
  });
  const response = await handlers.GET(request("/api/admin/ingredients"));
  assert.equal(response.status, 403);
  assert.equal(calls, 0);
});

test("recipe writes reject a cross-origin request before authorization and validation", async () => {
  let authCalls = 0;
  const handlers = createAdminRecipeCollectionHandlers({
    requireAdmin: async () => { authCalls += 1; },
    saveRecipe: async () => assert.fail("Não deveria salvar"),
  });
  const response = await handlers.POST(request("/api/admin/recipes", { method: "POST", body: draft, origin: "https://outro.example" }));
  assert.equal(response.status, 403);
  assert.equal(authCalls, 1);
  assert.equal((await response.json()).error, "INVALID_ORIGIN");
});

test("valid recipe writes authorize, validate and delegate sanitized domain data", async () => {
  const calls = [];
  const handlers = createAdminRecipeCollectionHandlers({
    requireAdmin: async () => ({ id: "admin" }),
    isReady: () => true,
    saveRecipe: async (id, payload) => { calls.push({ id, payload }); return { id: "new-recipe" }; },
  });
  const response = await handlers.POST(request("/api/admin/recipes", { method: "POST", body: draft }));
  assert.equal(response.status, 201);
  assert.equal(calls[0].id, null);
  assert.equal(calls[0].payload.recipe.status, "draft");
  assert.equal((await response.json()).data.id, "new-recipe");
});

test("editorial writes stay unavailable until administrative RLS is ready", async () => {
  let saves = 0;
  const handlers = createAdminRecipeCollectionHandlers({
    requireAdmin: async () => ({ id: "admin" }),
    isReady: () => false,
    saveRecipe: async () => { saves += 1; },
  });
  const response = await handlers.POST(request("/api/admin/recipes", { method: "POST", body: draft }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "RLS_NOT_READY");
  assert.equal(saves, 0);
});
