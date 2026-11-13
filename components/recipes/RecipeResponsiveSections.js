"use client";

import { useSyncExternalStore } from "react";
import RecipePortionAdjuster from "@/components/recipes/RecipePortionAdjuster";
import CookingMode from "@/components/recipes/CookingMode";

const TABLET_BREAKPOINT = "(min-width: 768px)";

function subscribeToViewport(callback) {
  const mediaQuery = window.matchMedia(TABLET_BREAKPOINT);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getViewportSnapshot() {
  return window.matchMedia(TABLET_BREAKPOINT).matches;
}

function getServerSnapshot() {
  return true;
}

export default function RecipeResponsiveSections({ recipeId, ingredients, servings, instructions, locale, labels }) {
  const tabletOrLarger = useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getServerSnapshot,
  );

  const ingredientsSection = ingredients.length > 0 ? (
    <RecipePortionAdjuster
      key="recipe-ingredients"
      sectionId="recipe-ingredients"
      recipeId={recipeId}
      ingredients={ingredients}
      originalServings={servings}
      units={labels.units}
      locale={locale}
      labels={labels.ingredients}
    />
  ) : null;

  const preparationSection = instructions.length > 0 ? (
    <section
      key="recipe-preparation"
      id="recipe-preparation"
      className="mt-9 scroll-mt-24 border-t border-[#E8E6DC] pt-7 sm:mt-11 sm:pt-9"
      aria-labelledby="recipe-method-heading"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#B45F3E]">{labels.recipeDetails}</p>
        <h2 id="recipe-method-heading" className="mt-2 font-serif text-2xl font-semibold text-[#20352A] sm:text-3xl">{labels.methodHeading}</h2>
      </div>
      <ol className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
        {instructions.map((step, index) => (
          <li key={`${recipeId}-step-${index}`} className="flex min-w-0 gap-3.5 rounded-2xl border border-[#ECEAE2] bg-white px-4 py-4 text-sm leading-6 text-[#536257] shadow-[0_8px_22px_-20px_rgba(32,53,42,0.32)] sm:gap-4 sm:px-5 sm:py-5 sm:text-base sm:leading-7">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#E7EEE2] text-sm font-extrabold tabular-nums text-[#365541] sm:size-10">{index + 1}</span>
            <span className="min-w-0 break-words pt-1">{step}</span>
          </li>
        ))}
      </ol>
      <CookingMode
        key={recipeId}
        instructions={instructions}
        labels={{
          startCookingMode: labels.startCookingMode,
          cookingMode: labels.cookingMode,
          stepProgress: labels.stepProgress,
          cookingProgress: labels.cookingProgress,
          previousStep: labels.previousStep,
          nextStep: labels.nextStep,
          exitCookingMode: labels.exitCookingMode,
        }}
      />
    </section>
  ) : null;

  return <>{tabletOrLarger ? [ingredientsSection, preparationSection] : [preparationSection, ingredientsSection]}</>;
}
