import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminAuthorizer,
  isAdminUser,
} from "../../modules/admin/domain/access.mjs";
import { getAuthCookieOptions } from "../../lib/supabase/auth-config.mjs";

test("auth cookies are HttpOnly, same-site, and secure in production", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.deepEqual(getAuthCookieOptions(), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
  } finally {
    process.env.NODE_ENV = previousEnvironment;
  }
});

test("only trusted app_metadata grants the admin role", () => {
  assert.equal(isAdminUser({ app_metadata: { role: "admin" } }), true);
  assert.equal(isAdminUser({ user_metadata: { role: "admin" } }), false);
  assert.equal(isAdminUser({ app_metadata: { role: "editor" } }), false);
  assert.equal(isAdminUser(null), false);
});

test("authorization denies a missing or invalid session", async () => {
  const authorize = createAdminAuthorizer(async () => ({
    data: { user: null },
    error: { status: 401 },
  }));

  assert.deepEqual(await authorize(), { allowed: false, status: 401, user: null });
});

test("authorization denies an authenticated non-admin", async () => {
  const authorize = createAdminAuthorizer(async () => ({
    data: { user: { id: "user-1", app_metadata: {}, user_metadata: { role: "admin" } } },
    error: null,
  }));

  assert.deepEqual(await authorize(), { allowed: false, status: 403, user: null });
});

test("authorization accepts an admin returned by the authenticated server client", async () => {
  const user = { id: "admin-1", app_metadata: { role: "admin" } };
  const authorize = createAdminAuthorizer(async () => ({ data: { user }, error: null }));

  assert.deepEqual(await authorize(), { allowed: true, status: 200, user });
});

test("authorization fails closed when Supabase is unavailable", async () => {
  const authorize = createAdminAuthorizer(async () => {
    throw new Error("network detail must not leak");
  });

  assert.deepEqual(await authorize(), { allowed: false, status: 503, user: null });
});
