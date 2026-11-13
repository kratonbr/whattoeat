"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_RECIPE_LOCALE, isSupportedRecipeLocale } from "@/domain/recipes.mjs";

function readLocale() {
  const requested = new URLSearchParams(window.location.search).get("locale");
  return isSupportedRecipeLocale(requested) ? requested : DEFAULT_RECIPE_LOCALE;
}

function subscribe(callback) {
  window.addEventListener("popstate", callback);
  window.addEventListener("whattoeat:localechange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("whattoeat:localechange", callback);
  };
}

export function usePublicLocale() {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_RECIPE_LOCALE);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return locale;
}
