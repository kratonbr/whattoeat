import test from "node:test";
import assert from "node:assert/strict";
import { createRecipeImageHandlers } from "../../modules/admin/presentation/http/recipe-image-handlers.mjs";

const recipeId = "0f4c2779-8240-4de5-9ca1-9ba32debb4cc";
const url = `http://localhost/api/admin/recipes/${recipeId}/image`;
const context = { params: Promise.resolve({ id: recipeId }) };

function createRequest({ method = "POST", origin = "http://localhost", bytes = [137, 80, 78, 71, 13, 10, 26, 10], type = "image/png" } = {}) {
  if (method === "DELETE") return new Request(url, { method, headers: { origin } });
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(bytes)], { type }), "photo.png");
  return new Request(url, { method, headers: { origin }, body: form });
}

function createRepository(overrides = {}) {
  const calls = [];
  const repository = {
    getRecipeImagePath: async () => { calls.push("get-path"); return "old/path.jpg"; },
    upload: async (...args) => { calls.push(["upload", ...args]); },
    attach: async (...args) => { calls.push(["attach", ...args]); },
    remove: async (...args) => { calls.push(["remove", ...args]); },
    createSignedUrl: async () => "https://signed.example/photo.png",
    ...overrides,
  };
  return { repository, calls };
}

test("image endpoints reject anonymous and non-admin requests before storage", async () => {
  let repositoryCalls = 0;
  const anonymous = createRecipeImageHandlers({ requireAdmin: async () => { throw Object.assign(new Error(), { status: 401 }); }, isReady: () => true, createRepository: async () => { repositoryCalls += 1; } });
  const common = createRecipeImageHandlers({ requireAdmin: async () => { throw Object.assign(new Error(), { status: 403 }); }, isReady: () => true, createRepository: async () => { repositoryCalls += 1; } });
  assert.equal((await anonymous.POST(createRequest(), context)).status, 401);
  assert.equal((await common.POST(createRequest(), context)).status, 403);
  assert.equal(repositoryCalls, 0);
});

test("image endpoints reject cross-origin calls before authorization", async () => {
  let authorizationCalls = 0;
  const handlers = createRecipeImageHandlers({ requireAdmin: async () => { authorizationCalls += 1; }, isReady: () => true, createRepository: async () => createRepository().repository });
  assert.equal((await handlers.POST(createRequest({ origin: "https://attacker.example" }), context)).status, 403);
  assert.equal(authorizationCalls, 0);
});

test("image storage stays unavailable until its policy readiness flag is enabled", async () => {
  const handlers = createRecipeImageHandlers({ requireAdmin: async () => {}, isReady: () => false, createRepository: async () => { throw new Error("must not call repository"); } });
  const response = await handlers.POST(createRequest(), context);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "IMAGE_NOT_READY");
});

test("image validation rejects unsupported formats before touching Storage", async () => {
  let repositoryCalls = 0;
  const handlers = createRecipeImageHandlers({ requireAdmin: async () => {}, isReady: () => true, createRepository: async () => { repositoryCalls += 1; } });
  const response = await handlers.POST(createRequest({ type: "image/svg+xml", bytes: [60, 115, 118, 103] }), context);
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error, "IMAGE_FORMAT_INVALID");
  assert.equal(repositoryCalls, 0);
});

test("an authorized upload links a fresh object and cleans up the replaced object", async () => {
  const { repository, calls } = createRepository();
  const handlers = createRecipeImageHandlers({ requireAdmin: async () => ({ id: "admin" }), isReady: () => true, createRepository: async () => repository, randomId: () => "new-image-id" });
  const response = await handlers.POST(createRequest(), context);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { image_path: `${recipeId}/new-image-id.png`, image_url: "https://signed.example/photo.png" } });
  assert.equal(calls[1][0], "upload");
  assert.deepEqual(calls[2], ["attach", recipeId, `${recipeId}/new-image-id.png`]);
  assert.deepEqual(calls[3], ["remove", ["old/path.jpg"]]);
});

test("a failed database attachment removes the newly uploaded object", async () => {
  const { repository, calls } = createRepository({ attach: async () => { throw Object.assign(new Error(), { code: "42501" }); } });
  const handlers = createRecipeImageHandlers({ requireAdmin: async () => {}, isReady: () => true, createRepository: async () => repository, randomId: () => "new-image-id" });
  const response = await handlers.POST(createRequest(), context);
  assert.equal(response.status, 503);
  assert.deepEqual(calls.at(-1), ["remove", [`${recipeId}/new-image-id.png`]]);
});

test("image removal detaches the recipe before deleting the object", async () => {
  const { repository, calls } = createRepository();
  const handlers = createRecipeImageHandlers({ requireAdmin: async () => {}, isReady: () => true, createRepository: async () => repository });
  const response = await handlers.DELETE(createRequest({ method: "DELETE" }), context);
  assert.equal(response.status, 200);
  assert.deepEqual(calls[1], ["attach", recipeId, null]);
  assert.deepEqual(calls[2], ["remove", ["old/path.jpg"]]);
  assert.equal((await response.json()).data.cleanupComplete, true);
});
