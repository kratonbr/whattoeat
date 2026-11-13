"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const METRICS = [
  { key: "total", label: "Total de receitas", description: "Receitas cadastradas no catálogo" },
  { key: "published", label: "Receitas publicadas", description: "Disponíveis na área pública" },
  { key: "drafts", label: "Rascunhos", description: "Aguardando revisão" },
  { key: "withoutImage", label: "Sem imagem", description: "Receitas sem foto cadastrada" },
  { key: "translationsPending", label: "Traduções pendentes", description: "Sem conteúdo completo em pt-BR ou inglês" },
];
const TRANSLATION_FIELDS = { title: "título", slug: "slug", instructions: "modo de preparo" };
const LOCALE_LABELS = { "pt-BR": "Português brasileiro", en: "Inglês" };

const ERROR_MESSAGES = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente para acessar o painel.",
  ADMIN_REQUIRED: "Sua conta não tem permissão para acessar estes dados.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso agora. Tente novamente.",
  DASHBOARD_UNAVAILABLE: "Não foi possível carregar os indicadores. Tente novamente.",
};

export default function DashboardClient() {
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard/summary", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          status: "error",
          data: null,
          error: ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.DASHBOARD_UNAVAILABLE,
        };
      }

      return { status: "success", data: result.data, error: "" };
    } catch {
      return {
        status: "error",
        data: null,
        error: ERROR_MESSAGES.DASHBOARD_UNAVAILABLE,
      };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchSummary().then((result) => {
      if (isMounted) setState(result);
    });

    return () => {
      isMounted = false;
    };
  }, [fetchSummary]);

  function handleRetry() {
    setState({ status: "loading", data: null, error: "" });
    fetchSummary().then(setState);
  }

  const hasNoRecipes = state.data?.complete && state.data.metrics.total === 0;

  return (
    <section aria-labelledby="dashboard-title">
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Resumo do catálogo</p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Visão geral
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667469]">
          Acompanhe as receitas e identifique o que precisa de revisão.
        </p>
      </div>

      {state.status === "loading" && (
        <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((metric) => (
            <div key={metric.key} className="h-36 animate-pulse rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5">
              <p className="text-sm font-semibold text-[#667469]">Carregando {metric.label.toLowerCase()}…</p>
              <div className="mt-6 h-8 w-20 rounded-lg bg-[#E9F0E5]" />
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-[#EACFC3] bg-[#FFF8F4] p-5" role="alert">
          <p className="font-semibold text-[#8D432D]">{state.error}</p>
          <button
            className="mt-4 rounded-full bg-[#254936] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30"
            onClick={handleRetry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {state.status === "success" && state.data?.complete === false && (
        <div className="mb-5 rounded-2xl border border-[#E9D7A6] bg-[#FFF9E8] p-4 text-sm leading-6 text-[#66552D]" role="status">
          <p className="font-bold">Indicadores administrativos incompletos</p>
          <p className="mt-1">
            As políticas RLS para leitura administrativa ainda não estão configuradas. A contagem de publicadas é exata; os outros indicadores ficam indisponíveis até a configuração ser validada.
          </p>
        </div>
      )}

      {state.status === "success" && hasNoRecipes && (
        <div className="mb-5 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 text-sm text-[#667469]" role="status">
          Ainda não há receitas cadastradas no catálogo.
        </div>
      )}

      {state.status === "success" && !hasNoRecipes && (
        <div aria-label="Indicadores do catálogo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {METRICS.map((metric) => {
            const value = state.data.metrics[metric.key];
            const filterHref = metric.key === "withoutImage"
              ? "/admin/recipes?withoutImage=true"
              : metric.key === "translationsPending"
                ? "/admin/recipes?translationsPending=true"
                : null;
            const canOpenFilter = Boolean(filterHref) && value !== null;
            const linkLabel = metric.key === "withoutImage"
              ? "Ver receitas sem imagem"
              : "Ver receitas com traduções pendentes";
            const card = (
              <article className={`rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 shadow-sm shadow-[#20352A]/5 sm:p-6 ${canOpenFilter ? "transition hover:border-[#B8C9B5] hover:shadow-md" : ""}`}>
                <p className="flex items-center justify-between gap-2 text-sm font-semibold text-[#667469]">{metric.label}{canOpenFilter && <span aria-hidden="true" className="text-[#315B42]">→</span>}</p>
                <p className={`mt-5 font-extrabold tracking-tight ${value === null ? "text-xl text-[#8A938A]" : "text-4xl text-[#254936]"}`}>
                  {value === null ? "Indisponível" : value.toLocaleString("pt-BR")}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#8A938A]">
                  {value === null ? "Aguardando políticas RLS administrativas" : metric.description}
                </p>
              </article>
            );
            return (
              <div key={metric.key}>
                {canOpenFilter
                  ? <Link href={filterHref} aria-label={linkLabel} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">{card}</Link>
                  : card}
              </div>
            );
          })}
        </div>
      )}

      {state.status === "success" && state.data?.complete && (
        <section aria-labelledby="pending-translations-title" className="mt-6 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="pending-translations-title" className="text-lg font-extrabold">Traduções que precisam de atenção</h2>
              <p className="mt-1 text-sm text-[#667469]">Revisão dos campos obrigatórios para publicação em português e inglês.</p>
            </div>
            {state.data.metrics.translationsPending > 0 && <Link href="/admin/recipes?translationsPending=true" className="text-sm font-bold text-[#315B42] underline underline-offset-4">Ver todas</Link>}
          </div>
          {state.data.metrics.translationsPending === 0 ? (
            <p role="status" className="mt-4 rounded-xl bg-[#F1F7EE] px-4 py-3 text-sm font-medium text-[#315B42]">Todas as receitas têm título, slug e modo de preparo nos dois idiomas.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#EEF1EA]">
              {(state.data.pendingRecipes ?? []).map((recipe) => {
                const firstIssue = recipe.pendingTranslations[0];
                const firstField = firstIssue.missingFields[0];
                const href = `/admin/recipes/${recipe.id}?focusTranslation=${encodeURIComponent(firstIssue.language_code)}&focusField=${encodeURIComponent(firstField)}`;
                return <li key={recipe.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#254936]">{recipe.title}</p>
                    <ul className="mt-1 space-y-1 text-sm text-[#667469]">
                      {recipe.pendingTranslations.map((pending) => <li key={pending.language_code}><span className="font-semibold">{LOCALE_LABELS[pending.language_code] ?? pending.language_code}:</span> faltam {pending.missingFields.map((field) => TRANSLATION_FIELDS[field] ?? field).join(", ")}</li>)}
                    </ul>
                  </div>
                  <Link href={href} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[#C9D6C5] px-4 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20">Corrigir tradução</Link>
                </li>;
              })}
              {!state.data.pendingRecipes?.length && <li role="status" className="py-4 text-sm text-[#667469]">Há pendências no catálogo, mas a lista resumida não está disponível agora. Abra a listagem para consultar.</li>}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="quick-actions-title" className="mt-9 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:p-6">
        <h2 id="quick-actions-title" className="text-lg font-extrabold">Acessos rápidos</h2>
        <p className="mt-1 text-sm text-[#667469]">Acesse o catálogo editorial para revisar e organizar os dados.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link className="flex items-center justify-between rounded-xl border border-[#E1E7DC] bg-[#F7F5EF] px-4 py-4 text-sm font-semibold text-[#315B42] transition hover:border-[#B8C9B5] hover:bg-[#E9F0E5]" href="/admin/recipes">Gerenciar receitas<span aria-hidden="true">→</span></Link>
          <Link className="flex items-center justify-between rounded-xl border border-[#E1E7DC] bg-[#F7F5EF] px-4 py-4 text-sm font-semibold text-[#315B42] transition hover:border-[#B8C9B5] hover:bg-[#E9F0E5]" href="/admin/ingredients">Gerenciar ingredientes<span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </section>
  );
}
