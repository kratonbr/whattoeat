import test from "node:test";
import assert from "node:assert/strict";
import { MAX_RECIPE_IMAGE_BYTES, validateRecipeImage } from "../../modules/recipes/domain/image-validation.mjs";

test("accepts a JPEG only when signature and MIME type agree", () => {
  assert.deepEqual(validateRecipeImage({ type: "image/jpeg", size: 3, bytes: new Uint8Array([0xff, 0xd8, 0xff]) }), { valid: true, extension: "jpg" });
  assert.equal(validateRecipeImage({ type: "image/png", size: 3, bytes: new Uint8Array([0xff, 0xd8, 0xff]) }).valid, false);
});

test("accepts PNG and WebP signatures", () => {
  assert.equal(validateRecipeImage({ type: "image/png", size: 8, bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) }).extension, "png");
  assert.equal(validateRecipeImage({ type: "image/webp", size: 12, bytes: new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]) }).extension, "webp");
});

test("rejects empty, oversized, unsupported, and incomplete images", () => {
  assert.equal(validateRecipeImage({ type: "image/jpeg", size: 0, bytes: new Uint8Array([0xff, 0xd8, 0xff]) }).error, "IMAGE_SIZE_INVALID");
  assert.equal(validateRecipeImage({ type: "image/jpeg", size: MAX_RECIPE_IMAGE_BYTES + 1, bytes: new Uint8Array([0xff, 0xd8, 0xff]) }).error, "IMAGE_SIZE_INVALID");
  assert.equal(validateRecipeImage({ type: "image/svg+xml", size: 4, bytes: new Uint8Array([60, 115, 118, 103]) }).error, "IMAGE_FORMAT_INVALID");
  assert.equal(validateRecipeImage({ type: "image/png", size: 4, bytes: new Uint8Array([137, 80, 78, 71]) }).error, "IMAGE_FORMAT_INVALID");
});
