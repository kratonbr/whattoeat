import assert from "node:assert/strict";
import test from "node:test";
import { formatPortionQuantity } from "../../domain/portions.mjs";

test("scales a numeric ingredient amount proportionally", () => {
  assert.equal(formatPortionQuantity(200, 2, 1), "100");
  assert.equal(formatPortionQuantity(200, 2, 4), "400");
});

test("keeps fractional results exact and readable", () => {
  assert.equal(formatPortionQuantity(0.5, 2, 3), "¾");
  assert.equal(formatPortionQuantity(200, 3, 2), "133 ⅓");
  assert.equal(formatPortionQuantity(1, 2, 1), "½");
});

test("preserves exact decimal precision and localizes the decimal separator", () => {
  assert.equal(formatPortionQuantity(1.234, 1, 1, "en"), "1.234");
  assert.equal(formatPortionQuantity(1.234, 1, 1, "pt-BR"), "1,234");
});

test("returns null when a numeric quantity or valid serving ratio is unavailable", () => {
  assert.equal(formatPortionQuantity(null, 2, 1), null);
  assert.equal(formatPortionQuantity("to taste", 2, 1), null);
  assert.equal(formatPortionQuantity(200, null, 1), null);
  assert.equal(formatPortionQuantity(200, 2, 0), null);
});
