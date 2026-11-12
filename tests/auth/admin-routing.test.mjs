import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAdminNoStoreHeaders,
  shouldRedirectAdminLoginToPanel,
} from "../../modules/admin/application/routing.mjs";

test("only a server-authorized user with app_metadata admin role is redirected", () => {
  assert.equal(
    shouldRedirectAdminLoginToPanel({
      allowed: true,
      user: { app_metadata: { role: "admin" } },
    }),
    true,
  );
  assert.equal(shouldRedirectAdminLoginToPanel({ allowed: false, status: 401 }), false);
  assert.equal(shouldRedirectAdminLoginToPanel({ allowed: false, status: 403 }), false);
  assert.equal(shouldRedirectAdminLoginToPanel({ allowed: false, status: 503 }), false);
  assert.equal(
    shouldRedirectAdminLoginToPanel({
      allowed: true,
      user: { user_metadata: { role: "admin" } },
    }),
    false,
  );
  assert.equal(
    shouldRedirectAdminLoginToPanel({
      allowed: true,
      user: { app_metadata: { role: "editor" } },
    }),
    false,
  );
});

test("admin responses are marked private and non-cacheable", () => {
  const response = applyAdminNoStoreHeaders(new Response("ok"));

  assert.equal(
    response.headers.get("cache-control"),
    "private, no-store, max-age=0, must-revalidate",
  );
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(response.headers.get("expires"), "0");
});

test("a logged-out or invalid session leaves the login page accessible", () => {
  const accessAfterLogout = { allowed: false, status: 401, user: null };

  assert.equal(shouldRedirectAdminLoginToPanel(accessAfterLogout), false);
});
