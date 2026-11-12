"use client";

import { useState } from "react";
import { formatPortionQuantity } from "@/modules/recipes/domain/portions.mjs";

const servingOptions = [1, 2, 3, 4, 5];

export default function RecipePortionAdjuster({
  recipeId,
  ingredients,
  originalServings,
  units,
  locale,
  labels,
}) {
  const canAdjust = Number.isSafeInteger(originalServings) && originalServings > 0;
  const [servings, setServings] = useState(originalServings);
  const [customServings, setCustomServings] = useState(
    String(Math.max(5, canAdjust ? originalServings : 5)),
  );
  const selectedServings = canAdjust ? servings : originalServings;
  const selectedOption = selectedServings >= 5 ? 5 : selectedServings;

  function chooseOption(option) {
    if (option === 5) {
      const customValue = Number(customServings);
      setServings(
        Number.isSafeInteger(customValue) && customValue >= 5
          ? customValue
          : 5,
      );
      return;
    }

    setServings(option);
  }

  function updateCustomServings(event) {
    const value = event.target.value;
    setCustomServings(value);
    const numericValue = Number(value);

    if (Number.isSafeInteger(numericValue) && numericValue >= 5) {
      setServings(numericValue);
    }
  }

  return (
    <section className="mt-7" aria-labelledby="recipe-ingredients">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="recipe-ingredients" className="font-serif text-2xl font-semibold text-[#20352A]">
            {labels.ingredientHeading}
          </h2>
          <p aria-live="polite" className="mt-1 text-xs font-semibold text-[#879186]">
            {labels.ingredientsFor} {selectedServings} {selectedServings === 1 ? labels.personLabel : labels.peopleLabel}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#9AA095]">
          {labels.ingredientCount}
        </span>
      </div>

      <fieldset disabled={!canAdjust}>
        <legend className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[#68766A]">
          {labels.portionPrompt}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {servingOptions.map((option, index) => {
            const selected = selectedOption === option;

            return (
              <label
                className={
                  "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-xs font-bold transition-colors focus-within:ring-2 focus-within:ring-[#D8794C] " +
                  (selected
                    ? "border-[#315B42] bg-[#315B42] text-white"
                    : "border-[#E5E4DA] bg-white text-[#68756A] hover:border-[#B8C9B5] hover:bg-[#F4F6F0]")
                }
                key={option}
              >
                <input
                  aria-label={labels.servingOptions[index]}
                  checked={selected}
                  className="sr-only"
                  name={`servings-${recipeId}`}
                  onChange={() => chooseOption(option)}
                  type="radio"
                  value={option}
                />
                {labels.servingOptions[index]}
              </label>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-[#F7F6F0] p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm font-semibold text-[#536456]" htmlFor={`custom-servings-${recipeId}`}>
            {labels.customServingsLabel}
          </label>
          <input
            aria-label={labels.customServingsLabel}
            className="min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3 text-sm font-bold text-[#365541] outline-none transition focus:border-[#8FA98A] focus:ring-4 focus:ring-[#D86F46]/15 disabled:cursor-not-allowed disabled:opacity-55 sm:w-28"
            disabled={!canAdjust || selectedOption !== 5}
            id={`custom-servings-${recipeId}`}
            min="5"
            onChange={updateCustomServings}
            step="1"
            type="number"
            value={customServings}
          />
        </div>
      </fieldset>

      <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

          return (
            <li key={ingredient.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-[#ECEAE2] bg-white/75 px-4 py-3 text-sm text-[#4E5F52]">
              <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D8794C]" />
              <span className="min-w-0">
                <span className="font-semibold">{ingredient.name}</span>
                {quantity && <span className="ml-1.5 text-xs text-[#879186]">{quantity}</span>}
                {ingredient.preparation_note && (
                  <span className="mt-1 block text-xs text-[#879186]">
                    {labels.ingredientNote}: {ingredient.preparation_note}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
