import { Suspense } from "react";
import RecipesClient from "../../recipes-client";

export const metadata = { title: "Receitas | WhatToEat Administração", robots: { index: false, follow: false } };

async function RecipeListContent({ searchParams }) {
  const query = await searchParams;
  return <RecipesClient
    initialTranslationsPending={query.translationsPending === "true"}
    initialWithoutImage={query.withoutImage === "true"}
  />;
}

export default function RecipesPage(props) {
  return <Suspense fallback={<p role="status" lang="pt-BR" className="rounded-2xl bg-white p-6 text-sm text-[#667469]">Carregando receitas…</p>}><RecipeListContent searchParams={props.searchParams} /></Suspense>;
}
