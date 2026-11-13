import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublishedRecipeBySlug } from "@/services/recipes";
import {
  DEFAULT_RECIPE_LOCALE,
  isSupportedRecipeLocale,
} from "@/domain/recipes.mjs";
import { getMessages } from "@/lib/i18n";
import RecipeResponsiveSections from "@/components/recipes/RecipeResponsiveSections";
import RecipeHeroImage from "@/components/recipes/RecipeHeroImage";
import RecipeShareButtons from "@/components/recipes/RecipeShareButtons";

function RecipePageFallback() {
  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 sm:px-8 sm:py-10">
      <div aria-hidden="true" className="mx-auto h-[48vh] max-w-5xl animate-pulse rounded-[2rem] bg-white/65 sm:h-[58vh]" />
    </main>
  );
}

function getImageSource(imagePath) {
  if (typeof imagePath !== "string" || !imagePath) return null;
  if (imagePath.startsWith("/")) return imagePath;

  try {
    const url = new URL(imagePath);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export default function RecipeDetailsPage(props) {
  const content = Promise.all([props.params, props.searchParams]).then(
    ([{ slug }, query]) => (
      <RecipeDetails slug={slug} locale={query.locale ?? DEFAULT_RECIPE_LOCALE} />
    ),
  );

  return (
    <Suspense fallback={<RecipePageFallback />}>
      {content}
    </Suspense>
  );
}

async function RecipeDetails({ slug, locale }) {
  if (typeof slug !== "string" || !slug.trim()) {
    return <RecipePageFallback />;
  }

  if (typeof locale !== "string" || !isSupportedRecipeLocale(locale)) {
    notFound();
  }

  const t = getMessages(locale);
  let recipe;

  try {
    recipe = await getPublishedRecipeBySlug({ slug, locale });
  } catch (error) {
    console.error("[RecipeDetailsPage]", error?.code ?? "UNKNOWN_ERROR");

    return (
      <main lang={locale} className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#20352A] sm:px-8 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <Link className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold text-[#49634D] hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8794C]" href={locale === "en" ? "/?locale=en" : "/"}>
            ← {t.backHome}
          </Link>
          <section role="alert" className="mt-10 rounded-[2rem] border border-[#E8C7B9] bg-[#FFFEFA] p-6 shadow-[0_20px_50px_-32px_rgba(32,53,42,0.3)] sm:p-10">
            <p className="text-sm font-bold text-[#B45F3E]">{t.recipeDetails}</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">{t.recipeLoadError}</h1>
          </section>
        </div>
      </main>
    );
  }

  if (!recipe) {
    notFound();
  }

  if (recipe.slug && recipe.slug !== slug) {
    redirect(`/recipes/${encodeURIComponent(recipe.slug)}?locale=${encodeURIComponent(locale)}`);
  }

  const imageSource = getImageSource(recipe.image_url || recipe.image_path);
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.filter((step) => typeof step === "string" && step.trim())
    : [];
  const difficulty = t.difficultyLevels[recipe.difficulty] ?? recipe.difficulty;

  return (
    <main lang={locale} className="relative min-h-screen overflow-hidden bg-[#F7F5EF] px-4 py-5 text-[#20352A] sm:px-8 sm:py-9 lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 -top-52 h-[34rem] w-[34rem] rounded-full bg-[#E4EBDD] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -left-48 h-[32rem] w-[32rem] rounded-full bg-[#F3E3D4] opacity-70 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[#DCE5D8] bg-[#FFFEFA]/90 px-4 text-sm font-bold text-[#365541] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20" href={locale === "en" ? "/?locale=en" : "/"}>
            <span aria-hidden="true">←</span>
            {t.backHome}
          </Link>
          <RecipeShareButtons
            title={recipe.title}
            labels={{
              shareRecipe: t.shareRecipe,
              copyRecipeLink: t.copyRecipeLink,
              linkCopied: t.linkCopied,
              copyFailed: t.copyFailed,
              copyManually: t.copyManually,
              copyLinkFallback: t.copyLinkFallback,
              shareComplete: t.shareComplete,
              shareFailed: t.shareFailed,
            }}
          />
        </div>

        <article className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#E8E6DC] bg-[#FFFEFA] shadow-[0_28px_80px_-36px_rgba(32,53,42,0.28)] sm:mt-7 sm:rounded-[2.25rem]">
          <div className="overflow-hidden bg-[#E8EEE2]">
            <RecipeHeroImage key={recipe.id} src={imageSource} alt={recipe.image_alt || recipe.title} placeholderLabel={t.photoMissing} />
          </div>

          <div className="px-4 pb-7 pt-6 sm:px-8 sm:pb-10 sm:pt-8 lg:px-10 lg:pb-12 lg:pt-9">
            <header className="max-w-4xl">
              <span className="inline-flex rounded-full bg-[#E7EEE2] px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-[#49634D]">
                {t.categories[recipe.category] ?? recipe.category}
              </span>
              <h1 className="mt-4 break-words font-serif text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-[#20352A] sm:mt-5 sm:text-5xl sm:leading-[1.04]">
              {recipe.title}
              </h1>

              {recipe.description && (
                <section aria-labelledby="recipe-description" className="mt-4 max-w-3xl sm:mt-5">
                <h2 id="recipe-description" className="sr-only">{t.descriptionHeading}</h2>
                  <p className="text-base leading-7 text-[#68766A] sm:text-lg sm:leading-8">{recipe.description}</p>
                </section>
              )}
            </header>

            <dl className="mt-7 grid grid-cols-1 gap-3 min-[560px]:grid-cols-3 sm:mt-8 sm:gap-4">
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ECEAE2] bg-[#F8F7F2] px-3.5 py-3.5 sm:px-4 sm:py-4">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#E8EEE2] text-[#365541]">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.25" /><path strokeLinecap="round" d="M12 7.5v4.8l3.2 1.8" /></svg>
                </span>
                <span className="min-w-0">
                  <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.09em] text-[#788476] sm:text-xs">{t.prepTimeLabel}</dt>
                  <dd className="mt-1 break-words text-sm font-bold leading-5 text-[#365541] sm:text-base">{recipe.prep_time_minutes} {t.prepMinutes}</dd>
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ECEAE2] bg-[#F8F7F2] px-3.5 py-3.5 sm:px-4 sm:py-4">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F5E8DD] text-[#B45F3E]">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M5 18.5V14m7 4.5V9m7 9.5V5.5" /><path strokeLinecap="round" d="M3.5 19.5h17" /></svg>
                </span>
                <span className="min-w-0">
                  <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.09em] text-[#788476] sm:text-xs">{t.difficultyLabel}</dt>
                  <dd className="mt-1 break-words text-sm font-bold leading-5 text-[#365541] sm:text-base">{difficulty}</dd>
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#ECEAE2] bg-[#F8F7F2] px-3.5 py-3.5 sm:px-4 sm:py-4">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F5E8DD] text-[#B45F3E]">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.7 18.5v-1.2a5.3 5.3 0 0 1 10.6 0v1.2H3.7Zm11.8-8.2a3 3 0 1 0 0-6m1 8a4.5 4.5 0 0 1 4 4.5v1.7h-3.5" /></svg>
                </span>
                <span className="min-w-0">
                  <dt className="text-[0.65rem] font-extrabold uppercase tracking-[0.09em] text-[#788476] sm:text-xs">{t.servingsLabel}</dt>
                  <dd className="mt-1 break-words text-sm font-bold leading-5 text-[#365541] sm:text-base">{recipe.servings} {t.servings}</dd>
                </span>
              </div>
            </dl>

            <RecipeResponsiveSections
              recipeId={recipe.id}
              ingredients={recipe.ingredients}
              servings={recipe.servings}
              instructions={instructions}
              locale={locale}
              labels={{
                units: t.units,
                ingredients: {
                  ingredientHeading: t.ingredientHeading,
                  ingredientCount: t.ingredientCount(recipe.ingredients.length),
                  ingredientNote: t.ingredientNote,
                  portionPrompt: t.portionPrompt,
                  decreaseServings: t.decreaseServings,
                  increaseServings: t.increaseServings,
                  servingsLimit: t.servingsLimit,
                  personLabel: t.personLabel,
                  peopleLabel: t.peopleLabel,
                },
                recipeDetails: t.recipeDetails,
                methodHeading: t.methodHeading,
                startCookingMode: t.startCookingMode,
                cookingMode: t.cookingMode,
                stepProgress: t.stepProgress,
                cookingProgress: t.cookingProgress,
                previousStep: t.previousStep,
                nextStep: t.nextStep,
                exitCookingMode: t.exitCookingMode,
              }}
            />
          </div>
        </article>
      </div>
    </main>
  );
}
