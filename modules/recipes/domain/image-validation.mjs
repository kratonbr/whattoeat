export const MAX_RECIPE_IMAGE_BYTES = 5 * 1024 * 1024;

const FORMATS = Object.freeze({
  "image/jpeg": { extension: "jpg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", matches: (bytes) => bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte) },
  "image/webp": { extension: "webp", matches: (bytes) => bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP" },
});

export function validateRecipeImage({ type, size, bytes }) {
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_RECIPE_IMAGE_BYTES) {
    return { valid: false, error: "IMAGE_SIZE_INVALID" };
  }
  const format = FORMATS[type];
  if (!format || !(bytes instanceof Uint8Array) || !format.matches(bytes)) {
    return { valid: false, error: "IMAGE_FORMAT_INVALID" };
  }
  return { valid: true, extension: format.extension };
}
