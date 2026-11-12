import assert from "node:assert/strict";
import test from "node:test";

import { calculateAdminDashboardMetrics } from "../../modules/admin/domain/dashboard.mjs";

test("calculates dashboard counts and flags recipes with incomplete translations", () => {
  const recipes = [
    { id: "r1", status: "published", image_path: "recipes/r1.jpg" },
    { id: "r2", status: "draft", image_path: null },
    { id: "r3", status: "published", image_path: "   " },
  ];
  const translations = [
    { recipe_id: "r1", language_code: "pt-BR", title: "Sopa", instructions: ["Cozinhe"] },
    { recipe_id: "r1", language_code: "en", title: "Soup", instructions: ["Cook"] },
    { recipe_id: "r2", language_code: "pt-BR", title: "Arroz", instructions: ["Prepare"] },
    { recipe_id: "r3", language_code: "pt-BR", title: "Feijão", instructions: ["Cozinhe"] },
    { recipe_id: "r3", language_code: "en", title: "Beans", instructions: [] },
  ];

  assert.deepEqual(calculateAdminDashboardMetrics({ recipes, translations }), {
    total: 3,
    published: 2,
    drafts: 1,
    withoutImage: 2,
    translationsPending: 2,
  });
});

test("returns zero counts for an empty catalog", () => {
  assert.deepEqual(calculateAdminDashboardMetrics({ recipes: [], translations: [] }), {
    total: 0,
    published: 0,
    drafts: 0,
    withoutImage: 0,
    translationsPending: 0,
  });
});

test("rejects invalid metric inputs", () => {
  assert.throws(
    () => calculateAdminDashboardMetrics({ recipes: null, translations: [] }),
    /must be arrays/,
  );
});
