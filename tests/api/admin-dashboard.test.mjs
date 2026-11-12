import assert from "node:assert/strict";
import test from "node:test";

import { createAdminDashboardGetHandler } from "../../lib/api/admin-dashboard.mjs";

test("rejects unauthenticated dashboard requests before reading data", async () => {
  let queried = false;
  const GET = createAdminDashboardGetHandler({
    requireAdmin: async () => { throw Object.assign(new Error(), { status: 401 }); },
    getSummary: async () => { queried = true; return {}; },
    logError: () => {},
  });
  const response = await GET();

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHENTICATED" });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0, must-revalidate");
  assert.equal(queried, false);
});

test("rejects authenticated non-admin requests before reading data", async () => {
  let queried = false;
  const GET = createAdminDashboardGetHandler({
    requireAdmin: async () => { throw Object.assign(new Error(), { status: 403 }); },
    getSummary: async () => { queried = true; return {}; },
    logError: () => {},
  });
  const response = await GET();

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "ADMIN_REQUIRED" });
  assert.equal(queried, false);
});

test("returns summary data only after server authorization succeeds", async () => {
  const summary = {
    complete: false,
    unavailableReason: "ADMIN_RLS_REQUIRED",
    metrics: { total: null, published: 7, drafts: null, withoutImage: null, translationsPending: null },
  };
  const GET = createAdminDashboardGetHandler({
    requireAdmin: async () => ({ id: "admin" }),
    getSummary: async () => summary,
    logError: () => {},
  });
  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: summary });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0, must-revalidate");
});

test("returns a generic error when dashboard queries fail", async () => {
  const GET = createAdminDashboardGetHandler({
    requireAdmin: async () => ({ id: "admin" }),
    getSummary: async () => {
      throw Object.assign(new Error("private database details"), {
        code: "ADMIN_DASHBOARD_QUERY_FAILED",
      });
    },
    logError: () => {},
  });
  const response = await GET();

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "DASHBOARD_UNAVAILABLE" });
});
