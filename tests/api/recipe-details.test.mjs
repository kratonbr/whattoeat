import assert from "node:assert/strict";
import test from "node:test";
import { createRecipeDetailsGetHandler } from "../../lib/api/recipe-details.mjs";

const recipe = {
  slug: "roasted-tomato-pasta",
  title: "Roasted tomato pasta",
  ingredients: [],
  instructions: [],
};

function makeRequest(query = "") {
  return new Request("https://whattoeat.test/api/recipes/roasted-tomato-pasta" + (query ? "?" + query : ""));
}

function makeHandler(getPublishedRecipeBySlug, logError) {
  return createRecipeDetailsGetHandler({ getPublishedRecipeBySlug, logError });
}

function makeContext(slug = "roasted-tomato-pasta") {
  return { params: Promise.resolve({ slug }) };
}

test("uses Brazilian Portuguese by default and returns the recipe resource", async () => {
  let received;
  const response = await makeHandler(async (params) => {
    received = params;
    return recipe;
  })(makeRequest(), makeContext());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(received, { slug: "roasted-tomato-pasta", locale: "pt-BR" });
  assert.deepEqual(await response.json(), { recipe });
});

test("passes the requested Brazilian Portuguese locale to the service", async () => {
  let received;
  const response = await makeHandler(async (params) => {
    received = params;
    return recipe;
  })(makeRequest("locale=pt-BR"), makeContext());

  assert.equal(response.status, 200);
  assert.equal(received.locale, "pt-BR");
});

test("uses English only when the caller explicitly selects it", async () => {
  let received;
  const response = await makeHandler(async (params) => {
    received = params;
    return recipe;
  })(makeRequest("locale=en"), makeContext());

  assert.equal(response.status, 200);
  assert.deepEqual(received, { slug: "roasted-tomato-pasta", locale: "en" });
});

test("rejects malformed slugs before calling the service", async () => {
  const handler = makeHandler(async () => {
    assert.fail("The recipe service must not run for an invalid slug.");
  });

  for (const slug of ["", "  ", " leading-space", "nested/slug", "nested\\slug"]) {
    const response = await handler(makeRequest(), makeContext(slug));
    assert.equal(response.status, 400, JSON.stringify(slug));
    assert.deepEqual(await response.json(), { error: "INVALID_SLUG" });
  }
});

test("rejects unsupported locales before calling the service", async () => {
  const response = await makeHandler(async () => {
    assert.fail("The recipe service must not run for an unsupported locale.");
  })(makeRequest("locale=fr"), makeContext());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "INVALID_LOCALE" });
});

test("returns 404 when the slug has no published recipe in that locale", async () => {
  const response = await makeHandler(async () => null)(makeRequest(), makeContext());

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "RECIPE_NOT_FOUND" });
});

test("returns a sanitized 503 when Supabase is not configured", async () => {
  const error = Object.assign(new Error("Missing environment"), {
    code: "SUPABASE_NOT_CONFIGURED",
  });
  const logged = [];
  const response = await makeHandler(
    async () => {
      throw error;
    },
    (...args) => logged.push(args),
  )(makeRequest(), makeContext());

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: "SUPABASE_NOT_CONFIGURED",
  });
  assert.deepEqual(logged, [["[GET /api/recipes/:slug]", "SUPABASE_NOT_CONFIGURED"]]);
});

test("returns a sanitized 500 for other lookup failures", async () => {
  const response = await makeHandler(async () => {
    throw Object.assign(new Error("Database detail"), {
      code: "SUPABASE_QUERY_FAILED",
    });
  })(makeRequest(), makeContext());

  assert.equal(response.status, 500);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "RECIPE_LOOKUP_FAILED" });
});
