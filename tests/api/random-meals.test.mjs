import assert from "node:assert/strict";
import test from "node:test";

import { createRandomMealGetHandler } from "../../lib/api/random-meals.mjs";
import { selectRandomRecipe } from "../../domain/recipes.mjs";

const validId = "10000000-0000-4000-8000-000000000001";
const otherId = "20000000-0000-4000-8000-000000000002";
const sampleMeal = {
  id: validId,
  category: "dinner",
  prep_time_minutes: 25,
  servings: 2,
  difficulty: "easy",
  slug: "simple-dinner",
  title: "Simple dinner",
  description: null,
  instructions: ["Prepare the ingredients.", "Cook and serve."],
  ingredients: [],
};

function makeRequest(query = "") {
  const suffix = query ? "?" + query : "";
  return new Request("http://localhost/api/meals/random" + suffix);
}

function makeHandler(getPublishedRecipe, logError = () => {}) {
  return createRandomMealGetHandler({ getPublishedRecipe, logError });
}

test("uses Brazilian Portuguese and all categories by default", async () => {
  let received;
  const handler = makeHandler(async (params) => {
    received = params;
    return sampleMeal;
  });

  const response = await handler(makeRequest());

  assert.equal(response.status, 200);
  assert.deepEqual(received, {
    category: null,
    locale: "pt-BR",
    excludeId: null,
    recipeId: null,
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { meal: sampleMeal });
});

test("normalizes category and preserves the requested supported locale", async () => {
  let received;
  const handler = makeHandler(async (params) => {
    received = params;
    return sampleMeal;
  });

  const response = await handler(
    makeRequest("category=BREAKFAST&locale=pt-BR"),
  );

  assert.equal(response.status, 200);
  assert.equal(received.category, "breakfast");
  assert.equal(received.locale, "pt-BR");
});

test("treats category=ALL as no category filter", async () => {
  let received;
  const handler = makeHandler(async (params) => {
    received = params;
    return sampleMeal;
  });

  await handler(makeRequest("category=ALL"));

  assert.equal(received.category, null);
});

test("rejects invalid categories before calling the recipe service", async () => {
  let called = false;
  const handler = makeHandler(async () => {
    called = true;
    return sampleMeal;
  });

  const response = await handler(makeRequest("category=brunch"));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "INVALID_CATEGORY" });
  assert.equal(called, false);
});

test("rejects unsupported and incorrectly cased locales", async () => {
  for (const locale of ["fr", "pt-br"]) {
    const response = await makeHandler(async () => sampleMeal)(
      makeRequest("locale=" + locale),
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "INVALID_LOCALE" });
  }
});

test("rejects malformed exclude and recipeId UUIDs before calling the service", async () => {
  const handler = makeHandler(async () => {
    assert.fail("The service must not be called for invalid UUID parameters.");
  });

  const excludeResponse = await handler(makeRequest("exclude=not-a-uuid"));
  assert.equal(excludeResponse.status, 400);
  assert.deepEqual(await excludeResponse.json(), {
    error: "INVALID_EXCLUDE_ID",
  });

  const recipeResponse = await handler(makeRequest("recipeId=not-a-uuid"));
  assert.equal(recipeResponse.status, 400);
  assert.deepEqual(await recipeResponse.json(), {
    error: "INVALID_RECIPE_ID",
  });
});

test("passes valid exclusion and recipe IDs to the service", async () => {
  let received;
  const handler = makeHandler(async (params) => {
    received = params;
    return sampleMeal;
  });

  const response = await handler(
    makeRequest("exclude=" + validId + "&recipeId=" + otherId),
  );

  assert.equal(response.status, 200);
  assert.equal(received.excludeId, validId);
  assert.equal(received.recipeId, otherId);
});

test("returns 404 and no-store when no published recipe matches", async () => {
  const response = await makeHandler(async () => null)(makeRequest());

  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { error: "NO_RECIPES" });
});

test("returns 503 for missing Supabase configuration", async () => {
  const error = Object.assign(new Error("Missing environment"), {
    code: "SUPABASE_NOT_CONFIGURED",
  });
  const logged = [];
  const response = await makeHandler(
    async () => {
      throw error;
    },
    (...args) => logged.push(args),
  )(makeRequest());

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: "SUPABASE_NOT_CONFIGURED",
  });
  assert.deepEqual(logged, [
    ["[GET /api/meals/random]", "SUPABASE_NOT_CONFIGURED"],
  ]);
});

test("returns a sanitized 500 for other lookup failures", async () => {
  const response = await makeHandler(async () => {
    throw Object.assign(new Error("Database detail"), {
      code: "SUPABASE_QUERY_FAILED",
    });
  })(makeRequest());

  assert.equal(response.status, 500);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: "RECIPE_LOOKUP_FAILED",
  });
});

test("selects a different recipe when an alternative exists", () => {
  const recipes = [{ id: validId }, { id: otherId }];

  assert.deepEqual(
    selectRandomRecipe(recipes, {
      excludeId: validId,
      random: () => 0,
    }),
    { id: otherId },
  );
});

test("falls back to the only candidate when it is excluded", () => {
  const recipes = [{ id: validId }];

  assert.deepEqual(
    selectRandomRecipe(recipes, {
      excludeId: validId,
      random: () => 0,
    }),
    { id: validId },
  );
});

test("does not apply exclusion to an ID-specific lookup", () => {
  const recipes = [{ id: validId }, { id: otherId }];

  assert.deepEqual(
    selectRandomRecipe(recipes, {
      excludeId: validId,
      recipeId: validId,
      random: () => 0,
    }),
    { id: validId },
  );
});

test("returns null for an empty candidate list", () => {
  assert.equal(selectRandomRecipe([]), null);
});
test("accepts every documented recipe category", async () => {
  for (const category of [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "dessert",
  ]) {
    let received;
    const response = await makeHandler(async (params) => {
      received = params;
      return sampleMeal;
    })(makeRequest("category=" + category));

    assert.equal(response.status, 200, category);
    assert.equal(received.category, category);
  }
});
