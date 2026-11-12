import assert from "node:assert/strict";
import test from "node:test";

import {
  createLoginPostHandler,
  createLogoutPostHandler,
} from "../../lib/api/admin-auth.mjs";

function makeRequest(path, body, headers = {}) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-type": "application/json",
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function makeLoginHandler({ result, signOut = async () => ({ error: null }), error }) {
  let credentialsReceived;
  const handler = createLoginPostHandler({
    createClient: async () => ({
      auth: {
        signInWithPassword: async (credentials) => {
          credentialsReceived = credentials;
          return error ? { data: null, error } : result;
        },
        signOut,
      },
    }),
  });
  return { handler, getCredentials: () => credentialsReceived };
}

test("login forwards credentials only to the server auth client and accepts an admin", async () => {
  const { handler, getCredentials } = makeLoginHandler({
    result: { data: { user: { app_metadata: { role: "admin" } } }, error: null },
  });
  const response = await handler(makeRequest("/api/admin/auth/login", {
    email: "admin@example.com",
    password: "secret-password",
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(getCredentials(), {
    email: "admin@example.com",
    password: "secret-password",
  });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.deepEqual(await response.json(), { authenticated: true });
});

test("login returns a generic credential error without exposing Auth details", async () => {
  const { handler } = makeLoginHandler({
    error: Object.assign(new Error("specific email exists"), { status: 400 }),
  });
  const response = await handler(makeRequest("/api/admin/auth/login", {
    email: "person@example.com",
    password: "wrong-password",
  }));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "INVALID_CREDENTIALS" });
});

test("login clears a valid session for an authenticated non-admin", async () => {
  let signedOut = false;
  const { handler } = makeLoginHandler({
    result: { data: { user: { app_metadata: { role: "editor" } } }, error: null },
    signOut: async (options) => {
      signedOut = options.scope === "local";
      return { error: null };
    },
  });
  const response = await handler(makeRequest("/api/admin/auth/login", {
    email: "editor@example.com",
    password: "correct-password",
  }));

  assert.equal(response.status, 403);
  assert.equal(signedOut, true);
  assert.deepEqual(await response.json(), { error: "ADMIN_ACCESS_REQUIRED" });
});

test("login rejects cross-origin requests before calling Supabase", async () => {
  let called = false;
  const handler = createLoginPostHandler({
    createClient: async () => {
      called = true;
      throw new Error("must not be called");
    },
  });
  const response = await handler(makeRequest("/api/admin/auth/login", {
    email: "admin@example.com",
    password: "secret-password",
  }, { origin: "https://attacker.example" }));

  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("login rejects malformed requests and oversized credentials", async () => {
  const { handler } = makeLoginHandler({
    result: { data: { user: { app_metadata: { role: "admin" } } }, error: null },
  });
  const malformed = await handler(new Request("http://localhost/api/admin/auth/login", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: "{",
  }));
  assert.equal(malformed.status, 400);

  const oversized = await handler(makeRequest("/api/admin/auth/login", {
    email: "admin@example.com",
    password: "x".repeat(1025),
  }));
  assert.equal(oversized.status, 400);
});

test("login returns a generic throttling response", async () => {
  const { handler } = makeLoginHandler({
    error: Object.assign(new Error("provider rate limit detail"), { status: 429 }),
  });
  const response = await handler(makeRequest("/api/admin/auth/login", {
    email: "admin@example.com",
    password: "secret-password",
  }));

  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { error: "SIGN_IN_TEMPORARILY_UNAVAILABLE" });
});

test("logout rejects cross-origin requests and signs out only the current session", async () => {
  let options;
  const handler = createLogoutPostHandler({
    createClient: async () => ({
      auth: { signOut: async (value) => { options = value; return { error: null }; } },
    }),
  });

  const forbidden = await handler(makeRequest("/api/admin/auth/logout", undefined, {
    origin: "https://attacker.example",
  }));
  assert.equal(forbidden.status, 403);
  assert.equal(options, undefined);

  const response = await handler(makeRequest("/api/admin/auth/logout"));
  assert.equal(response.status, 204);
  assert.deepEqual(options, { scope: "local" });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});
