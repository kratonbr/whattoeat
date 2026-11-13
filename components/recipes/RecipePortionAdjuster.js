"use client";

import { useState } from "react";
import { formatPortionQuantity } from "@/modules/recipes/domain/portions.mjs";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 100;

export default function RecipePortionAdjuster({
  recipeId,
  ingredients,
  originalServings,
  units,
  locale,
  labels,
  sectionId,
}) {
  const canAdjust = Number.isSafeInteger(originalServings) && originalServings > 0 && originalServings <= MAX_SERVINGS;
  const [servings, setServings] = useState(originalServings);
  const [checkedIngredients, setCheckedIngredients] = useState(() => new Set());
  const selectedServings = canAdjust ? servings : originalServings;

  function changeServings(delta) {
    setServings((current) => Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, current + delta)));
  }

  function toggleIngredient(ingredientId) {
    setCheckedIngredients((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  return (
    <section id={sectionId} className="mt-8 scroll-mt-24 sm:mt-10" aria-labelledby={`recipe-ingredients-${recipeId}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`recipe-ingredients-${recipeId}`} className="font-serif text-2xl font-semibold text-[#20352A] sm:text-3xl">
            {labels.ingredientHeading}
          </h2>
          <p className="mt-1 text-xs font-semibold text-[#879186]">{labels.ingredientCount}</p>
        </div>
      </div>

      <fieldset disabled={!canAdjust} className="mb-4 w-fit max-w-full rounded-2xl border border-[#E8E6DC] bg-[#F8F7F2] px-4 pb-4 pt-2 sm:mb-5 sm:px-5 sm:pb-5">
        <legend className="px-1 text-xs font-extrabold uppercase tracking-[0.1em] text-[#68766A]">
          {labels.portionPrompt}
        </legend>
        <div className="flex items-center justify-center gap-5 sm:justify-start">
          <button
            aria-label={labels.decreaseServings}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-[#C9D6C5] bg-white text-2xl font-semibold text-[#315B42] shadow-sm transition hover:border-[#91AC8E] hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canAdjust || selectedServings <= MIN_SERVINGS}
            onClick={() => changeServings(-1)}
            type="button"
          >
            <span aria-hidden="true">−</span>
          </button>
          <p aria-live="polite" aria-atomic="true" className="min-w-16 text-center">
            <span className="block text-2xl font-extrabold tabular-nums text-[#254936]">{selectedServings}</span>
            <span className="block text-xs font-semibold text-[#68766A]">
              {selectedServings === 1 ? labels.personLabel : labels.peopleLabel}
            </span>
          </p>
          <button
            aria-label={labels.increaseServings}
            className="grid size-12 shrink-0 place-items-center rounded-full border border-[#C9D6C5] bg-white text-2xl font-semibold text-[#315B42] shadow-sm transition hover:border-[#91AC8E] hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canAdjust || selectedServings >= MAX_SERVINGS}
            onClick={() => changeServings(1)}
            type="button"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <p className="sr-only">{labels.servingsLimit}</p>
      </fieldset>

      <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
        {ingredients.map((ingredient) => {
          const amount = ingredient.quantity_text ??
            (ingredient.quantity === null || ingredient.quantity === undefined
              ? null
              : formatPortionQuantity(
                  ingredient.quantity,
                  originalServings,
                  selectedServings,
                  locale,
                ) ?? String(ingredient.quantity));
          const unitNames = units[ingredient.unit_code];
          const unit = amount
            ? unitNames
              ? unitNames[Number(amount) === 1 ? 0 : 1]
              : ingredient.unit_code
            : null;
          const quantity = [amount, unit]
            .filter((value) => value !== null && value !== undefined && value !== "")
            .join(" ");
          const checked = checkedIngredients.has(ingredient.id);

          return (
            <li key={ingredient.id} className="min-w-0">
              <button
                aria-pressed={checked}
                className={`flex min-h-[3.75rem] w-full items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left text-sm leading-6 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 ${checked ? "border-[#BFD2B8] bg-[#EDF4E9] text-[#68766A] shadow-inner" : "border-[#ECEAE2] bg-white text-[#405447] shadow-[0_7px_20px_-18px_rgba(32,53,42,0.45)] hover:border-[#B9CBB3] hover:bg-[#FCFDFB]"}`}
                onClick={() => toggleIngredient(ingredient.id)}
                type="button"
              >
                <span aria-hidden="true" className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border text-xs font-bold transition-colors ${checked ? "border-[#315B42] bg-[#315B42] text-white" : "border-[#BCC8B8] bg-white text-transparent"}`}>
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`break-words font-semibold ${checked ? "line-through decoration-[#879186]" : ""}`}>{ingredient.name}</span>
                  {quantity && <span className={`ml-1.5 text-xs font-semibold ${checked ? "text-[#879186]" : "text-[#657368]"}`}>{quantity}</span>}
                  {ingredient.preparation_note && (
                    <span className="mt-1 block break-words text-xs text-[#879186]">
                      {labels.ingredientNote}: {ingredient.preparation_note}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
