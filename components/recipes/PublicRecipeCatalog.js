"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";

const categories = ["all", "breakfast", "lunch", "dinner", "snack", "dessert"];
const difficulties = ["", "easy", "medium", "hard"];
const maxTimes = ["", "15", "30", "45", "60", "90"];

function makeCatalogUrl({ locale, search, category, maxPrepTime, difficulty, sort, page }) {
  const params = new URLSearchParams({ locale, sort, page: String(page) });
  if (search) params.set("q", search);
  if (category) params.set("category", category);
  if (maxPrepTime) params.set("maxPrepTime", maxPrepTime);
  if (difficulty) params.set("difficulty", difficulty);
  return `/api/recipes?${params.toString()}`;
}

function RecipePlaceholder({ category, label }) {
  const palettes = {
    breakfast: "bg-[#F0E4C8] text-[#B9824C]",
    dessert: "bg-[#F0DFD8] text-[#B97862]",
    dinner: "bg-[#E2E9E5] text-[#667F7B]",
    lunch: "bg-[#E4EBDD] text-[#5D7A61]",
    snack: "bg-[#EFE2D0] text-[#BB8258]",
  };

  return (
    <div aria-label={label} className={`relative grid aspect-[1.86] place-items-center overflow-hidden ${palettes[category] ?? "bg-[#E4EBDD] text-[#5D7A61]"}`} role="img">
      <span className="absolute right-4 top-3 text-[0.65rem] font-bold tabular-nums opacity-75">✦</span>
      <span aria-hidden="true" className="grid size-24 place-items-center rounded-full border border-white/80 bg-white/20">
        <svg className="size-12" fill="none" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="2.4" />
          <circle cx="24" cy="24" r="10" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" />
          <path d="M17 26c2-4 4.5-6 8-5.5 2.7.4 4.5 2.4 6 5.2-3.4 2.6-6.8 3.5-9.8 2.4-2-.7-3.3-1.3-4.2-2.1Z" fill="currentColor" fillOpacity=".35" />
        </svg>
      </span>
      <span className="absolute bottom-3 left-4 text-[0.58rem] font-medium opacity-80">{label}</span>
    </div>
  );
}

function RecipeCard({ recipe, locale, labels }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageSource, setImageSource] = useState(recipe.image_url);
  const imageRefreshAttempted = useRef(false);
  const showImage = Boolean(imageSource) && !imageFailed;

  async function refreshImageUrl() {
    if (imageRefreshAttempted.current || !recipe.slug) {
      setImageFailed(true);
      return;
    }

    imageRefreshAttempted.current = true;
    try {
      const params = new URLSearchParams({ locale });
      const response = await fetch(`/api/recipes/${encodeURIComponent(recipe.slug)}?${params.toString()}`, { cache: "no-store" });
      const result = await response.json();
      const freshUrl = result.recipe?.image_url;
      if (!response.ok || result.recipe?.id !== recipe.id || typeof freshUrl !== "string" || freshUrl === imageSource) {
        throw new Error("IMAGE_REFRESH_FAILED");
      }
      setImageSource(freshUrl);
    } catch {
      setImageFailed(true);
    }
  }

  return (
    <article className="group overflow-hidden rounded-[1.45rem] border border-[#E7E4DA] bg-[#FFFEFA] shadow-[0_8px_24px_-20px_rgba(32,53,42,0.4)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_-25px_rgba(32,53,42,0.38)]">
      <Link aria-label={`${labels.viewRecipe}: ${recipe.title}`} className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#D86F46]/40" href={`/recipes/${encodeURIComponent(recipe.slug)}?locale=${encodeURIComponent(locale)}`}>
        <div className="relative aspect-[1.86] overflow-hidden bg-[#E8EEE2]">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={recipe.image_alt || recipe.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              height="360"
              loading="lazy"
              onError={() => { void refreshImageUrl(); }}
              src={imageSource}
              width="680"
            />
          ) : <RecipePlaceholder category={recipe.category} label={labels.illustration} />}
          <span className="absolute right-4 top-3 rounded-full bg-white/75 px-2 py-1 text-[0.62rem] font-bold tabular-nums text-[#49634D] backdrop-blur">
            {String(recipe.displayOrder).padStart(2, "0")}
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-[#C96C46]">
            {labels.categories[recipe.category] ?? recipe.category}
          </span>
          <h3 className="mt-2 line-clamp-2 min-h-[3.5rem] font-serif text-[1.35rem] leading-tight tracking-[-0.03em] text-[#20352A]">
            {recipe.title}
          </h3>
          {recipe.description ? (
            <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#6E7A6F]">{recipe.description}</p>
          ) : <div aria-hidden="true" className="mt-2 min-h-12" />}
          <div className="mt-4 flex items-center gap-4 border-t border-[#EEECE5] pt-4 text-[0.7rem] font-semibold text-[#778477]">
            <span className="inline-flex items-center gap-1.5">
              <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
              {recipe.prep_time_minutes} {labels.prepMinutes}
            </span>
            <span>{labels.difficultyLevels[recipe.difficulty] ?? recipe.difficulty}</span>
            <span aria-hidden="true" className="ml-auto grid size-8 place-items-center rounded-full bg-[#E9EFE5] text-sm text-[#365541] transition group-hover:bg-[#315B42] group-hover:text-white">↗</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-[0.68rem] font-bold text-[#617063] sm:min-w-[9rem]">
      <span>{label}</span>
      <select
        className="h-11 w-full rounded-xl border border-[#E4E1D7] bg-[#FFFEFA] px-3 text-sm font-semibold text-[#35513E] outline-none transition focus:border-[#8FA88B] focus:ring-4 focus:ring-[#D86F46]/15"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

export default function PublicRecipeCatalog({ locale }) {
  const t = getMessages(locale);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrepTime, setMaxPrepTime] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("newest");
  const [recipes, setRecipes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [loadedQueryKey, setLoadedQueryKey] = useState(null);
  const [loadingMoreQueryKey, setLoadingMoreQueryKey] = useState(null);
  const [retry, setRetry] = useState(0);
  const requestRef = useRef({ sequence: 0, controller: null });

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const queryKey = JSON.stringify([locale, search, category, maxPrepTime, difficulty, sort, retry]);

  useEffect(() => {
    const sequence = requestRef.current.sequence + 1;
    requestRef.current.sequence = sequence;
    requestRef.current.controller?.abort();
    const controller = new AbortController();
    requestRef.current.controller = controller;
    const requestKey = queryKey;

    async function loadCatalog() {
      try {
        const response = await fetch(makeCatalogUrl({ locale, search, category, maxPrepTime, difficulty, sort, page: 1 }), {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (controller.signal.aborted || sequence !== requestRef.current.sequence) return;
        if (!response.ok || !Array.isArray(result.recipes)) throw new Error("CATALOG_LOAD_FAILED");
        setRecipes(result.recipes.map((recipe, index) => ({ ...recipe, displayOrder: index + 1 })));
        setTotal(result.total);
        setPage(1);
        setStatus(result.recipes.length ? "ready" : "empty");
        setLoadedQueryKey(requestKey);
      } catch {
        if (controller.signal.aborted || sequence !== requestRef.current.sequence) return;
        setStatus("error");
        setLoadedQueryKey(requestKey);
      } finally {
        if (sequence === requestRef.current.sequence) requestRef.current.controller = null;
      }
    }

    loadCatalog();
    return () => controller.abort();
  }, [locale, search, category, maxPrepTime, difficulty, sort, retry, queryKey]);

  useEffect(() => () => requestRef.current.controller?.abort(), []);

  async function loadMore() {
    if (loadingMore || recipes.length >= total) return;
    const nextPage = page + 1;
    const requestKey = queryKey;
    const sequence = requestRef.current.sequence + 1;
    requestRef.current.sequence = sequence;
    requestRef.current.controller?.abort();
    const controller = new AbortController();
    requestRef.current.controller = controller;
    setLoadingMoreQueryKey(requestKey);
    try {
      const response = await fetch(makeCatalogUrl({ locale, search, category, maxPrepTime, difficulty, sort, page: nextPage }), {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (controller.signal.aborted || sequence !== requestRef.current.sequence) return;
      if (!response.ok || !Array.isArray(result.recipes)) throw new Error("CATALOG_LOAD_FAILED");
      setRecipes((current) => {
        const seenIds = new Set(current.map((recipe) => recipe.id));
        const additionalRecipes = result.recipes.filter((recipe) => {
          if (seenIds.has(recipe.id)) return false;
          seenIds.add(recipe.id);
          return true;
        });
        return [...current, ...additionalRecipes.map((recipe, index) => ({ ...recipe, displayOrder: current.length + index + 1 }))];
      });
      setTotal(result.total);
      setPage(nextPage);
      setStatus("ready");
    } catch {
      if (!controller.signal.aborted && sequence === requestRef.current.sequence) setStatus("load-more-error");
    } finally {
      if (sequence === requestRef.current.sequence) {
        requestRef.current.controller = null;
      }
      setLoadingMoreQueryKey((current) => current === requestKey ? null : current);
    }
  }

  const hasFilters = Boolean(searchInput || category || maxPrepTime || difficulty || sort !== "newest");
  const isLoading = loadedQueryKey !== queryKey;
  const loadingMore = loadingMoreQueryKey === queryKey;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategory("");
    setMaxPrepTime("");
    setDifficulty("");
    setSort("newest");
  }

  return (
    <section aria-labelledby="recipe-catalog-heading" className="mx-auto max-w-7xl scroll-mt-8 px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-14 lg:px-12 lg:pb-12" id="recipe-catalog">
      <div className="mb-7 flex flex-col gap-5 border-t border-[#E5E1D7] pt-10 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
        <div>
          <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.18em] text-[#C96C46]">{t.catalogEyebrow}</p>
          <h2 className="mt-2 font-serif text-3xl leading-tight tracking-[-0.04em] text-[#20352A] sm:text-[2.5rem]" id="recipe-catalog-heading">{t.catalogTitle}</h2>
          <p className="mt-2 text-sm text-[#748075]">{t.catalogSubtitle}</p>
        </div>
        <span aria-live="polite" className="text-xs font-medium text-[#7E897D]">
          {isLoading ? t.catalogLoading : t.recipeCount(recipes.length, total)}
        </span>
      </div>

      <div className="mb-7 space-y-3">
        <div className="relative max-w-xl">
          <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7A8B79]" fill="none" viewBox="0 0 20 20">
            <circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
          <input
            aria-label={t.searchRecipesLabel}
            className="h-12 w-full rounded-xl border border-[#E4E1D7] bg-[#FFFEFA] pl-11 pr-4 text-sm text-[#35513E] outline-none placeholder:text-[#9AA397] focus:border-[#8FA88B] focus:ring-4 focus:ring-[#D86F46]/15"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t.searchRecipesPlaceholder}
            type="search"
            value={searchInput}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSelect label={t.catalogCategoryLabel} onChange={setCategory} value={category}>
            <option value="">{t.catalogAllCategories}</option>
            {categories.slice(1).map((value) => <option key={value} value={value}>{t.categories[value]}</option>)}
          </FilterSelect>
          <FilterSelect label={t.catalogMaxTimeLabel} onChange={setMaxPrepTime} value={maxPrepTime}>
            <option value="">{t.catalogAnyTime}</option>
            {maxTimes.slice(1).map((value) => <option key={value} value={value}>{t.catalogUpToMinutes(Number(value))}</option>)}
          </FilterSelect>
          <FilterSelect label={t.catalogDifficultyLabel} onChange={setDifficulty} value={difficulty}>
            <option value="">{t.catalogAnyDifficulty}</option>
            {difficulties.slice(1).map((value) => <option key={value} value={value}>{t.difficultyLevels[value]}</option>)}
          </FilterSelect>
          <FilterSelect label={t.catalogSortLabel} onChange={setSort} value={sort}>
            <option value="newest">{t.catalogSortNewest}</option>
            <option value="fastest">{t.catalogSortFastest}</option>
            <option value="alphabetical">{t.catalogSortAlphabetical}</option>
          </FilterSelect>
          {hasFilters && (
            <button className="col-span-2 h-11 justify-self-start rounded-xl px-3 text-sm font-bold text-[#7A5C4B] underline decoration-[#D9B59D] underline-offset-4 hover:text-[#B75D3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D86F46] sm:col-span-1" onClick={clearFilters} type="button">
              {t.catalogClearFilters}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div aria-label={t.catalogLoading} aria-live="polite" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => <div aria-hidden="true" className="overflow-hidden rounded-[1.45rem] border border-[#E7E4DA] bg-[#FFFEFA]" key={key}><div className="aspect-[1.86] animate-pulse bg-[#E9EEE5]" /><div className="space-y-3 p-5"><div className="h-3 w-1/3 animate-pulse rounded bg-[#E9EEE5]" /><div className="h-6 w-3/4 animate-pulse rounded bg-[#E9EEE5]" /><div className="h-10 animate-pulse rounded bg-[#F1F0E9]" /></div></div>)}
        </div>
      ) : status === "error" ? (
        <div className="rounded-2xl border border-[#E8C7B9] bg-[#FFF5F0] p-5 text-sm text-[#8A432D]" role="alert">
          <p>{t.catalogError}</p>
          <button className="mt-3 min-h-10 rounded-full bg-[#315B42] px-4 font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/25" onClick={() => setRetry((value) => value + 1)} type="button">{t.catalogRetry}</button>
        </div>
      ) : status === "empty" ? (
        <div className="rounded-2xl border border-[#E7DED1] bg-white/60 p-6 text-sm text-[#69766B]" role="status">
          <p className="font-semibold text-[#365541]">{t.catalogNoResults}</p>
          <p className="mt-1">{t.catalogNoResultsHint}</p>
          {hasFilters && <button className="mt-3 min-h-10 rounded-full border border-[#C9D6C5] px-4 font-bold text-[#315B42]" onClick={clearFilters} type="button">{t.catalogClearFilters}</button>}
        </div>
      ) : (
        <>
          <div aria-live="polite" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => <RecipeCard key={`${recipe.id}:${recipe.image_url ?? "no-image"}`} labels={t} locale={locale} recipe={recipe} />)}
          </div>
          {status === "load-more-error" && <p className="mt-5 text-center text-sm text-[#9A4F35]" role="alert">{t.catalogMoreError}</p>}
          {recipes.length < total && (
            <div className="mt-8 flex justify-center">
              <button className="min-h-12 rounded-full border border-[#C9D6C5] bg-[#FFFEFA] px-6 text-sm font-bold text-[#315B42] shadow-sm hover:bg-[#F3F7F0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 disabled:opacity-60" disabled={loadingMore} onClick={loadMore} type="button">
                {loadingMore ? t.catalogLoading : t.catalogLoadMore}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
