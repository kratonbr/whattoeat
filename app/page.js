"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import {
  DEFAULT_RECIPE_LOCALE,
  isSupportedRecipeLocale,
} from "@/domain/recipes.mjs";

const categories = [
  { value: "all" },
  { value: "breakfast" },
  { value: "lunch" },
  { value: "dinner" },
  { value: "snack" },
  { value: "dessert" },
];

function CategoryIcon({ name }) {
  const icons = {
    all: <><path d="M5 6.5h14M5 12h14M5 17.5h14" /><circle cx="3.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="3.5" cy="12" r=".5" fill="currentColor" /><circle cx="3.5" cy="17.5" r=".5" fill="currentColor" /></>,
    breakfast: <><path d="M4 14h14a2 2 0 0 1 2 2v2H4v-4Z" /><path d="M7 14a4.5 4.5 0 0 1 9 0M5 21h14M12 3v2M5.6 5.6 7 7M18.4 5.6 17 7" /></>,
    lunch: <><path d="M4 12a8 8 0 0 0 16 0H4ZM3 12h18M8 8c.8-1 2-1.5 4-1.5S15.2 7 16 8M7 20h10" /></>,
    dinner: <><path d="M7 3v6M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3M7 10v11M16 3c-1.7 2-2.5 4.2-2.5 6.5H18V3M15.5 9.5V21" /></>,
    snack: <><circle cx="12" cy="12" r="8" /><circle cx="9" cy="9" r=".8" fill="currentColor" /><circle cx="15" cy="10" r=".8" fill="currentColor" /><circle cx="11" cy="15" r=".8" fill="currentColor" /><path d="m17 4 .7 1.6 1.8.4-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.4L17 4Z" /></>,
    dessert: <><path d="M5 12h14v8H5zM5 12c0-1.6 1.5-2.8 3.5-2.8S12 10.4 12 12c0-1.6 1.5-2.8 3.5-2.8S19 10.4 19 12M12 9V5M5 16h14" /><path d="M12 5c-1.2 0-2-.7-2-1.7M12 5c1.2 0 2-.7 2-1.7" /></>,
  };

  return (
    <svg aria-hidden="true" className="h-[21px] w-[21px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {icons[name] || icons.all}
    </svg>
  );
}

function SparkleIcon({ className = "h-4 w-4" }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m12 2 1.6 7.4L21 12l-7.4 1.6L12 21l-1.6-7.4L3 12l7.4-2.6L12 2Z" fill="currentColor" />
      <path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" fill="currentColor" />
    </svg>
  );
}

function PlateIllustration() {
  return (
    <svg aria-hidden="true" className="relative z-10 h-full w-full max-w-[370px]" fill="none" viewBox="0 0 360 250">
      <ellipse cx="181" cy="218" fill="#314F3C" fillOpacity=".1" rx="102" ry="12" />
      <circle cx="181" cy="119" r="91" fill="#FFFDF7" stroke="#58755D" strokeWidth="2" />
      <circle cx="181" cy="119" r="70" stroke="#D8E3D1" strokeWidth="2" />
      <path d="M145 132c11-23 29-35 53-31 19 3 31 17 39 37-24 18-47 24-68 17-12-4-20-12-24-23Z" fill="#E9B084" fillOpacity=".72" />
      <path d="M156 138c9-13 22-20 38-21m-15 38c12-12 28-19 48-20" stroke="#C77E53" strokeLinecap="round" strokeWidth="2" />
      <path d="M102 171c-13-9-21-20-24-35m24 35c-1-15 3-29 13-41m-13 41c15-8 30-10 44-6m116-10c12-8 19-18 22-31m-22 31c1-13-3-25-11-36m11 36c-13-7-26-8-38-4" stroke="#5E8061" strokeLinecap="round" strokeWidth="3" />
      <path d="M78 136c-2-12 2-22 13-30 9 13 10 24 4 34m7 30c-12 2-23-2-31-13 13-9 24-10 34-4m-3-23c0-12 6-21 18-27 6 15 4 26-5 35m169-7c2-11-2-20-11-28-8 12-9 22-3 31m-8 28c11 2 20-2 28-12-12-8-22-9-31-4m3-21c0-11-5-19-16-24-5 13-4 23 4 31" fill="#92AA87" />
      <path d="m54 76 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Zm253 16 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#D88D5A" />
      <circle cx="77" cy="91" r="2" fill="#D88D5A" />
      <circle cx="290" cy="72" r="2" fill="#D88D5A" />
    </svg>
  );
}

function formatIngredient(ingredient, units) {
  const quantity = ingredient.quantity_text ?? ingredient.quantity;
  const unitNames = units[ingredient.unit_code];
  const unit = unitNames
    ? unitNames[Number(quantity) === 1 ? 0 : 1]
    : ingredient.unit_code;

  return [quantity, unit]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ");
}

const languageOptions = [
  { value: "en", label: "ENGLISH", shortLabel: "EN" },
  { value: "pt-BR", label: "PORTUGUÊS", shortLabel: "PT-BR" },
];

function getLocaleSnapshot() {
  const requestedLocale = new URLSearchParams(window.location.search).get("locale");
  return isSupportedRecipeLocale(requestedLocale)
    ? requestedLocale
    : DEFAULT_RECIPE_LOCALE;
}

function subscribeToLocale(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("whattoeat:localechange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("whattoeat:localechange", callback);
  };
}

function LanguageSelector({ value, onChange, label, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, languageOptions.findIndex((option) => option.value === value)),
  );
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(
    0,
    languageOptions.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  function focusOption(index) {
    setActiveIndex((index + languageOptions.length) % languageOptions.length);
  }

  function openOptions() {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  }

  function chooseOption(option) {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!isOpen) {
        if (event.key === "ArrowUp") {
          setActiveIndex(languageOptions.length - 1);
          setIsOpen(true);
        } else {
          openOptions();
        }
      } else if (event.key === "Enter" || event.key === " ") {
        chooseOption(languageOptions[activeIndex]);
      } else {
        focusOption(activeIndex + (event.key === "ArrowUp" ? -1 : 1));
      }
    }
  }

  function handleOptionKeyDown(event, index) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusOption(event.key === "Home" ? 0 : languageOptions.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseOption(languageOptions[index]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  return (
    <div
      className="relative"
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setIsOpen(false);
      }}
      ref={rootRef}
    >
      <button
        aria-controls="language-options"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label + ": " + languageOptions[selectedIndex].label}
        className="inline-flex h-11 min-w-[138px] items-center justify-between gap-3 rounded-full border border-[#DCE5D8] bg-[#FFFEFA] px-3.5 text-[0.68rem] font-extrabold tracking-[0.075em] text-[#365541] shadow-[0_4px_12px_-7px_rgba(32,53,42,0.35)] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#AFC4AA] hover:bg-white hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 sm:h-10 sm:min-w-[152px]"
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : openOptions())}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 12h17M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {languageOptions[selectedIndex].label}
        </span>
        <svg aria-hidden="true" className={"h-3.5 w-3.5 shrink-0 text-[#718873] transition-transform duration-200 " + (isOpen ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24">
          <path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </button>

      <div
        aria-label={label}
        className={"absolute right-0 top-[calc(100%+0.5rem)] z-[100] w-48 origin-top-right rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-1.5 shadow-[0_18px_42px_-18px_rgba(32,53,42,0.38)] transition-[opacity,transform,visibility] duration-150 ease-out " + (isOpen ? "visible translate-y-0 scale-100 opacity-100 pointer-events-auto" : "invisible -translate-y-1 scale-[0.98] opacity-0 pointer-events-none")}
        id="language-options"
        role="listbox"
      >
        {languageOptions.map((option, index) => {
          const selected = option.value === value;
          const active = index === activeIndex;

          return (
            <div
              aria-selected={selected}
              className={"pointer-events-auto flex min-h-11 cursor-pointer touch-manipulation items-center justify-between rounded-xl px-3.5 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D86F46]/45 " + (selected
                ? "bg-[#EAF0E5] text-[#294B36]"
                : "text-[#667469] hover:bg-[#F4F5EF] hover:text-[#294B36]") + (active ? " ring-1 ring-inset ring-[#DCE5D8]" : "")}
              id={"language-option-" + option.shortLabel}
              key={option.value}
              onClick={() => chooseOption(option)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
              ref={(element) => { optionRefs.current[index] = element; }}
              role="option"
              tabIndex={active ? 0 : -1}
            >
              <span>{option.label}</span>
              {selected && (
                <svg aria-hidden="true" className="h-4 w-4 text-[#52704F]" fill="none" viewBox="0 0 24 24">
                  <path d="m5 12 4 4L19 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    () => DEFAULT_RECIPE_LOCALE,
  );
  const [meal, setMeal] = useState(null);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("idle");
  const isLoading = status === "loading";
  const t = getMessages(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  async function suggestMeal({ requestedLocale = locale, recipeId = null } = {}) {
    setStatus("loading");
    const params = new URLSearchParams({ locale: requestedLocale });

    if (recipeId) {
      params.set("recipeId", recipeId);
    } else {
      if (category !== "all") params.set("category", category);
      if (meal?.id) params.set("exclude", meal.id);
    }

    try {
      const response = await fetch("/api/meals/random?" + params.toString(), {
        cache: "no-store",
      });
      const result = await response.json();

      if (response.status === 404 && result.error === "NO_RECIPES") {
        setMeal(null);
        setStatus("empty");
        return;
      }

      if (!response.ok || !result.meal) {
        throw new Error("The recipe request failed.");
      }

      setMeal(result.meal);
      setStatus("success");
    } catch {
      setMeal(null);
      setStatus("error");
    }
  }

  function changeLocale(nextLocale) {
    if (nextLocale === locale) return;
    const url = new URL(window.location.href);
    if (nextLocale === "pt-BR") {
      url.searchParams.delete("locale");
    } else {
      url.searchParams.set("locale", nextLocale);
    }
    window.history.replaceState(window.history.state, "", url);
    window.dispatchEvent(new Event("whattoeat:localechange"));
    const currentRecipeId = meal?.id;
    document.documentElement.lang = nextLocale;
    if (currentRecipeId) suggestMeal({ requestedLocale: nextLocale, recipeId: currentRecipeId });
  }

  function chooseCategory(value) {
    setCategory(value);
    setMeal(null);
    setStatus("idle");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F7F5EF] text-[#20352A]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 -top-52 h-[34rem] w-[34rem] rounded-full bg-[#E4EBDD] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 -left-48 h-[32rem] w-[32rem] rounded-full bg-[#F3E3D4] opacity-70 blur-3xl" />

      <header className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link aria-label={t.brandLabel} className="group inline-flex items-center gap-3" href={locale === "en" ? "/?locale=en" : "/"}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#254936] text-[#F7F5EF] shadow-lg shadow-[#254936]/15 transition-transform duration-200 group-hover:-rotate-3">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path d="M4 13h16a8 8 0 0 1-16 0Z" stroke="currentColor" strokeWidth="1.7" />
              <path d="M3 13h18M8 8.5c1.2-1.6 2.5-2.4 4-2.4s2.8.8 4 2.4M12 3.5v1.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
            </svg>
          </span>
          <span className="text-[1.2rem] font-extrabold tracking-[-0.06em] text-[#20352A]">
            WhatTo<span className="text-[#D86F46]">Eat</span>
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-2 rounded-full border border-[#DCE3D7] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#496451] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7E9B70]" />
            {t.reviewed}
          </span>
          <LanguageSelector disabled={isLoading} label={t.languageLabel} onChange={changeLocale} value={locale} />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-11 px-5 pb-14 pt-7 sm:px-8 sm:pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-12 lg:pb-20 lg:pt-12">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E7DED1] bg-white/65 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#6E7666] shadow-sm">
            <SparkleIcon className="h-3.5 w-3.5 text-[#D8794C]" />
            {t.introBadge}
          </div>

          <h1 className="mt-6 font-serif text-[clamp(3.25rem,8vw,6.4rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-[#20352A]">
            {t.headlineFirst}
            <br />
            <span className="relative inline-block pr-2 text-[#D86F46] italic">
              {t.headlineAccent}
              <svg aria-hidden="true" className="absolute -bottom-2 left-0 h-3 w-full text-[#E9B08A]" preserveAspectRatio="none" viewBox="0 0 280 12">
                <path d="M3 8c66-6 142-7 274 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
              </svg>
            </span>
            <br />
            {t.headlineLast}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-[#68756A] sm:text-lg sm:leading-8">
            {t.intro}
          </p>

          <div className="mt-9">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#263E30]">{t.categoryPrompt}</p>
                <p className="mt-1 text-xs text-[#879085]">{t.categoryHint}</p>
              </div>
              <span className="hidden text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#9A9E91] sm:inline">{t.chooseOne}</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {categories.map((item) => {
                const selected = category === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => chooseCategory(item.value)}
                    disabled={isLoading}
                    aria-pressed={selected}
                    className={"group flex h-[82px] w-full flex-col items-center justify-center gap-2 rounded-[1.15rem] border px-2 py-2.5 text-[0.7rem] font-bold leading-tight transition-[transform,border-color,background-color,box-shadow,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D8794C]/20 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:h-[90px] sm:rounded-[1.25rem] sm:text-xs " + (selected
                      ? "border-[#254936] bg-gradient-to-b from-[#315B42] to-[#254936] text-[#FFFDF7] shadow-[0_12px_24px_-12px_rgba(37,73,54,0.65)]"
                      : "border-[#E5E4DA] bg-[#FFFEFA] text-[#68756A] shadow-[0_3px_10px_-6px_rgba(32,53,42,0.16)] hover:-translate-y-0.5 hover:border-[#B8C9B5] hover:bg-white hover:text-[#254936] hover:shadow-[0_10px_20px_-12px_rgba(32,53,42,0.3)] active:translate-y-0 active:scale-[0.98]")}
                  >
                    <span className={"transition-transform duration-200 group-hover:scale-110 " + (selected ? "text-[#DCE9D3]" : "text-[#81917F]")}>
                      <CategoryIcon name={item.value} />
                    </span>
                    {t.categories[item.value]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={suggestMeal}
              disabled={isLoading}
              className="group inline-flex min-h-[62px] w-full items-center justify-center gap-3 rounded-[1.15rem] border border-white/35 bg-gradient-to-r from-[#DC8058] to-[#CB633E] px-6 py-4 text-base font-extrabold text-white shadow-[0_14px_28px_-12px_rgba(200,96,57,0.58)] transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:from-[#E18760] hover:to-[#D16A43] hover:shadow-[0_18px_34px_-13px_rgba(200,96,57,0.65)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/25 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-75 sm:w-auto sm:min-w-[230px]"
            >
              {isLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  {t.findingMeal}
                </>
              ) : (
                <>
                  <SparkleIcon className="h-5 w-5" />
                  {meal ? t.surpriseAgain : t.surpriseMe}
                  <svg aria-hidden="true" className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-1.5" fill="none" viewBox="0 0 24 24">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                </>
              )}
            </button>
          </div>

          <div aria-live="polite" className="min-h-12 pt-3">
            {status === "empty" && (
              <p className="rounded-xl border border-[#E7DED1] bg-white/60 px-4 py-3 text-sm text-[#69766B]">
                {t.noRecipes}
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="rounded-xl border border-[#E8C7B9] bg-[#FFF5F0] px-4 py-3 text-sm text-[#9A4F35]">
                {t.requestError}
              </p>
            )}
            {isLoading && (
              <p className="px-1 text-sm text-[#788477]">{t.looking}</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#899187]">
            <span className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#E4EBDD] text-[#52704F]">✓</span>
              {t.reviewed}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#F1E2D5] text-[#B56A46]">✦</span>
              {t.freshIdea}
            </span>
          </div>
        </section>

        <aside className="mx-auto w-full max-w-xl lg:max-w-none">
          <article aria-busy={isLoading} className="recipe-card-enter overflow-hidden rounded-[2rem] border border-white/80 bg-[#FFFEFA] p-2.5 shadow-[0_28px_80px_-36px_rgba(32,53,42,0.28)] sm:rounded-[2.35rem] sm:p-3">
            <div className="relative flex h-[230px] items-center justify-center overflow-hidden rounded-[1.45rem] bg-[#E8EEE2] sm:h-[300px] sm:rounded-[1.8rem]">
              <div aria-hidden="true" className="placeholder-orbit absolute -left-8 top-8 h-28 w-28 rounded-full border border-[#C6D5C0]/70" />
              <div aria-hidden="true" className="absolute -right-12 bottom-0 h-44 w-44 rounded-full bg-[#F0D6C1]/55" />
              <div aria-hidden="true" className="absolute left-[18%] top-[14%] h-3 w-3 rounded-full bg-[#D9946B]/70" />
              <div aria-hidden="true" className="absolute right-[18%] top-[20%] h-2 w-2 rounded-full bg-[#819B79]/70" />
              <PlateIllustration />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#647562] shadow-sm backdrop-blur sm:left-5 sm:top-5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D8794C]" />
                {meal ? t.photoMissing : t.waitingMeal}
              </span>
            </div>

            {meal && status === "success" ? (
              <div className="px-4 pb-4 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E7EEE2] px-3 py-1.5 text-[0.67rem] font-bold uppercase tracking-[0.1em] text-[#49634D]">
                    <CategoryIcon name={meal.category} />
                    <span>{t.categories[meal.category]}</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs font-semibold text-[#7B867B]">
                    <span className="inline-flex items-center gap-1.5">
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M12 7v5l3 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                      </svg>
                      {meal.prep_time_minutes} {t.prepMinutes}
                    </span>
                    <span>{meal.servings} {t.servings}</span>
                  </div>
                </div>

                <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-[-0.045em] text-[#20352A] sm:text-[2.15rem]">
                  {meal.title}
                </h2>
                {meal.description && <p className="mt-2 max-w-xl text-sm leading-6 text-[#748075]">{meal.description}</p>}

                {meal.ingredients?.length > 0 && (
                  <div className="mt-5 border-t border-[#ECEAE2] pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#68766A]">{t.ingredientHeading}</h3>
                      <span className="text-[0.68rem] font-semibold text-[#9AA095]">{t.ingredientCount(meal.ingredients.length)}</span>
                    </div>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {meal.ingredients.map((ingredient) => {
                        const amount = formatIngredient(ingredient, t.units);

                        return (
                          <li key={ingredient.id} className="flex min-w-0 items-start gap-2.5 rounded-xl bg-[#F7F6F0] px-3 py-2.5 text-sm text-[#4E5F52]">
                            <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D8794C]" />
                            <span className="min-w-0">
                              <span className="font-semibold">{ingredient.name}</span>
                              {amount && <span className="ml-1.5 text-xs text-[#879186]">{amount}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {meal.instructions?.length > 0 && (
                  <details className="group mt-4 border-t border-[#ECEAE2] pt-4">
                    <summary className="-mx-2 flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-2 text-sm font-bold text-[#425B48] transition-colors duration-200 hover:bg-[#F3F5EE] active:bg-[#E9EEE5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8794C]">
                      <span>{t.instructions}</span>
                      <svg aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24">
                        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      </svg>
                    </summary>
                    <ol className="mt-4 space-y-3">
                      {meal.instructions.map((step, index) => (
                        <li key={meal.id + "-step-" + index} className="flex gap-3 text-sm leading-6 text-[#6F7B70]">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#E7EEE2] text-[0.68rem] font-bold text-[#49634D]">{index + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                {meal.slug && (
                  <Link
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#DCE5D8] bg-[#F4F6F0] px-5 text-sm font-bold text-[#365541] transition-colors hover:bg-[#EAF0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20"
                    href={`/recipes/${encodeURIComponent(meal.slug)}?locale=${encodeURIComponent(locale)}`}
                  >
                    {t.viewRecipe}
                  </Link>
                )}
              </div>
            ) : (
              <div className="px-5 pb-6 pt-5 sm:px-7 sm:pb-8 sm:pt-6">
                <div className="inline-flex items-center gap-2 text-[0.66rem] font-extrabold uppercase tracking-[0.16em] text-[#D2764C]">
                  <SparkleIcon className="h-3.5 w-3.5" />
                  {t.ideaClose}
                </div>
                <h2 className="mt-3 max-w-md font-serif text-3xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#20352A] sm:text-[2.25rem]">
                  {isLoading
                    ? t.findingDescription
                    : status === "empty"
                      ? t.emptyTitle
                      : status === "error"
                        ? t.errorTitle
                        : t.defaultTitle}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#768175]">
                  {status === "empty"
                    ? t.emptyDescription
                    : status === "error"
                      ? t.errorDescription
                      : t.defaultDescription}
                </p>
              </div>
            )}
          </article>

          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[0.68rem] font-medium text-[#8A9388]">
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <path d="M12 3 4.5 6v5.2c0 4.6 3.2 7.8 7.5 9.8 4.3-2 7.5-5.2 7.5-9.8V6L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
              <path d="m9 12 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
            {t.reviewedFooter}
          </p>
        </aside>
      </div>

      <footer className="relative z-10 border-t border-[#E8E5DB] bg-white/35">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-center text-xs text-[#8C948A] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-left lg:px-12">
          <span>{t.footerMain}</span>
          <span className="font-medium">{t.footerTagline}</span>
        </div>
      </footer>
    </main>
  );
}
