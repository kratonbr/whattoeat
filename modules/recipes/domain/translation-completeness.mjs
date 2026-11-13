import { SUPPORTED_RECIPE_LOCALES } from "./recipes.mjs";

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getMissingTranslationFields(translation) {
  const missing = [];
  if (typeof translation?.title !== "string" || !translation.title.trim()) missing.push("title");
  if (typeof translation?.slug !== "string" || !VALID_SLUG.test(translation.slug.trim())) missing.push("slug");
  if (!Array.isArray(translation?.instructions) || !translation.instructions.some((step) => typeof step === "string" && step.trim())) {
    missing.push("instructions");
  }
  return missing;
}

export function getRecipeTranslationStatus(translations) {
  const byLocale = new Map((Array.isArray(translations) ? translations : [])
    .map((translation) => [translation.language_code, translation]));
  const pending = SUPPORTED_RECIPE_LOCALES.flatMap((language_code) => {
    const missingFields = getMissingTranslationFields(byLocale.get(language_code));
    return missingFields.length ? [{ language_code, missingFields }] : [];
  });
  return { complete: pending.length === 0, pending };
}

export function isRecipeTranslationComplete(translation) {
  return getMissingTranslationFields(translation).length === 0;
}
