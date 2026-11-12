import assert from "node:assert/strict";
import test from "node:test";

import { createAdminDashboardSummaryService } from "../../services/admin/dashboard-summary.mjs";

function createCountClient({ count = 7, error = null } = {}) {
  const calls = [];
  const client = {
    from(table) {
      calls.push({ table });
      const query = {
        select(columns, options) {
          calls.at(-1).select = { columns, options };
          return query;
        },
        eq(column, value) {
          calls.at(-1).eq = { column, value };
          return query;
        },
        then(resolve, reject) {
          return Promise.resolve({ count, error }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { client, calls };
}

test("without verified admin RLS, returns only the exact published count", async () => {
  const { client, calls } = createCountClient({ count: 7 });
  const getSummary = createAdminDashboardSummaryService({
    createClient: async () => client,
  });

  assert.deepEqual(await getSummary(), {
    complete: false,
    unavailableReason: "ADMIN_RLS_REQUIRED",
    metrics: {
      total: null,
      published: 7,
      drafts: null,
      withoutImage: null,
      translationsPending: null,
    },
  });
  assert.deepEqual(calls, [{
    table: "recipes",
    select: { columns: "id", options: { count: "exact", head: true } },
    eq: { column: "status", value: "published" },
  }]);
});

test("fails closed when the published count query fails", async () => {
  const { client } = createCountClient({ error: { message: "RLS/query details" } });
  const getSummary = createAdminDashboardSummaryService({
    createClient: async () => client,
  });

  await assert.rejects(getSummary(), { code: "ADMIN_DASHBOARD_QUERY_FAILED" });
});

test("calculates complete metrics from paginated rows after RLS is verified", async () => {
  const recipeRows = [
    { id: "r1", status: "published", image_path: "r1.jpg" },
    { id: "r2", status: "draft", image_path: null },
  ];
  const translationRows = [
    { recipe_id: "r1", language_code: "pt-BR", title: "Sopa", instructions: ["Cozinhe"] },
    { recipe_id: "r1", language_code: "en", title: "Soup", instructions: ["Cook"] },
    { recipe_id: "r2", language_code: "pt-BR", title: "Arroz", instructions: ["Prepare"] },
  ];
  const client = {
    from(table) {
      const rows = table === "recipes" ? recipeRows : translationRows;
      const query = {
        select() { return query; },
        in() { return query; },
        order() { return query; },
        range(from, to) {
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
        },
      };
      return query;
    },
  };
  const getSummary = createAdminDashboardSummaryService({
    createClient: async () => client,
    adminReadPoliciesReady: true,
    pageSize: 2,
  });

  assert.deepEqual(await getSummary(), {
    complete: true,
    unavailableReason: null,
    metrics: {
      total: 2,
      published: 1,
      drafts: 1,
      withoutImage: 1,
      translationsPending: 1,
    },
  });
});
