import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedRecipeBySlug } from "@/services/recipes";
import {
  DEFAULT_RECIPE_LOCALE,
  isSupportedRecipeLocale,
} from "@/domain/recipes.mjs";
import { getMessages } from "@/lib/i18n";
import RecipePortionAdjuster from "@/components/recipes/RecipePortionAdjuster";

function RecipePageFallback() {
  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 sm:px-8 lg:px-12">
      <div aria-hidden="true" className="mx-auto h-[70vh] max-w-4xl animate-pulse rounded-[2rem] bg-white/65" />
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
      <main lang={locale} className="min-h-screen bg-[#F7F5EF] px-5 py-8 text-[#20352A] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
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

  const imageSource = getImageSource(recipe.image_url || recipe.image_path);
  const instructions = Array.isArray(recipe.instructions)
    ? recipe.instructions.filter((step) => typeof step === "string" && step.trim())
    : [];
  const difficulty = t.difficultyLevels[recipe.difficulty] ?? recipe.difficulty;

  return (
    <main lang={locale} className="relative min-h-screen overflow-hidden bg-[#F7F5EF] px-5 py-6 text-[#20352A] sm:px-8 sm:py-10 lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 -top-52 h-[34rem] w-[34rem] rounded-full bg-[#E4EBDD] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -left-48 h-[32rem] w-[32rem] rounded-full bg-[#F3E3D4] opacity-70 blur-3xl" />

      <div className="relative mx-auto max-w-4xl">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DCE5D8] bg-[#FFFEFA]/85 px-4 text-sm font-bold text-[#365541] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20" href={locale === "en" ? "/?locale=en" : "/"}>
          <span aria-hidden="true">←</span>
          {t.backHome}
        </Link>

        <article className="mt-5 overflow-hidden rounded-[2rem] border border-white/80 bg-[#FFFEFA] p-2.5 shadow-[0_28px_80px_-36px_rgba(32,53,42,0.28)] sm:mt-7 sm:rounded-[2.35rem] sm:p-3">
          <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-[1.45rem] bg-[#E8EEE2] sm:min-h-80 sm:rounded-[1.8rem]">
            {imageSource ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={recipe.image_alt || recipe.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={imageSource}
                />
              </>
            ) : (
              <div className="flex min-h-56 w-full flex-col items-center justify-center gap-3 px-6 text-center text-[#71836E] sm:min-h-80">
                <svg aria-hidden="true" className="h-16 w-16 text-[#849B7B]" fill="none" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="2" />
                  <circle cx="32" cy="32" r="15" stroke="#B7C8AE" strokeWidth="2" />
                  <path d="M20 35c5-8 18-11 25-3M23 40c5-4 13-6 19-4" stroke="#C88057" strokeLinecap="round" strokeWidth="2" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-[0.14em]">{t.photoMissing}</span>
              </div>
            )}
          </div>

          <div className="px-4 pb-6 pt-5 sm:px-8 sm:pb-9 sm:pt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[#E7EEE2] px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.1em] text-[#49634D]">
                {t.categories[recipe.category] ?? recipe.category}
              </span>
              <span className="text-xs font-bold text-[#879186]">{t.recipeDetails}</span>
            </div>

            <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#20352A] sm:text-5xl">
              {recipe.title}
            </h1>

            {recipe.description && (
              <section aria-labelledby="recipe-description" className="mt-4 max-w-3xl">
                <h2 id="recipe-description" className="sr-only">{t.descriptionHeading}</h2>
                <p className="text-base leading-7 text-[#748075] sm:text-lg sm:leading-8">{recipe.description}</p>
              </section>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-3 border-y border-[#ECEAE2] py-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#F7F6F0] px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#899187]">{t.prepTimeLabel}</dt>
                <dd className="mt-1 text-sm font-bold text-[#365541]">{recipe.prep_time_minutes} {t.prepMinutes}</dd>
              </div>
              <div className="rounded-2xl bg-[#F7F6F0] px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#899187]">{t.difficultyLabel}</dt>
                <dd className="mt-1 text-sm font-bold text-[#365541]">{difficulty}</dd>
              </div>
              <div className="rounded-2xl bg-[#F7F6F0] px-4 py-3">
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[#899187]">{t.servingsLabel}</dt>
                <dd className="mt-1 text-sm font-bold text-[#365541]">{recipe.servings} {t.servings}</dd>
              </div>
            </dl>

            {recipe.ingredients.length > 0 && (
              <RecipePortionAdjuster
                recipeId={recipe.id}
                ingredients={recipe.ingredients}
                originalServings={recipe.servings}
                units={t.units}
                locale={locale}
                labels={{
                  ingredientHeading: t.ingredientHeading,
                  ingredientCount: t.ingredientCount(recipe.ingredients.length),
                  ingredientNote: t.ingredientNote,
                  portionPrompt: t.portionPrompt,
                  servingOptions: t.servingOptions,
                  customServingsLabel: t.customServingsLabel,
                  ingredientsFor: t.ingredientsFor,
                  personLabel: t.personLabel,
                  peopleLabel: t.peopleLabel,
                }}
              />
            )}

            {instructions.length > 0 && (
              <section className="mt-8 border-t border-[#ECEAE2] pt-6" aria-labelledby="recipe-method">
                <h2 id="recipe-method" className="font-serif text-2xl font-semibold text-[#20352A]">{t.methodHeading}</h2>
                <ol className="mt-5 space-y-4">
                  {instructions.map((step, index) => (
                    <li key={`${recipe.id}-step-${index}`} className="flex gap-3 text-sm leading-6 text-[#6F7B70] sm:text-base sm:leading-7">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E7EEE2] text-xs font-bold text-[#49634D]">{index + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
