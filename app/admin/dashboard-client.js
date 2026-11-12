"use client";

import { useCallback, useEffect, useState } from "react";

const METRICS = [
  { key: "total", label: "Total de receitas", description: "Receitas cadastradas no catálogo" },
  { key: "published", label: "Receitas publicadas", description: "Disponíveis na área pública" },
  { key: "drafts", label: "Rascunhos", description: "Aguardando revisão" },
  { key: "withoutImage", label: "Sem imagem", description: "Receitas sem foto cadastrada" },
  { key: "translationsPending", label: "Traduções pendentes", description: "Sem conteúdo completo em pt-BR ou inglês" },
];

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
            return (
              <article key={metric.key} className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 shadow-sm shadow-[#20352A]/5 sm:p-6">
                <p className="text-sm font-semibold text-[#667469]">{metric.label}</p>
                <p className={`mt-5 font-extrabold tracking-tight ${value === null ? "text-xl text-[#8A938A]" : "text-4xl text-[#254936]"}`}>
                  {value === null ? "Indisponível" : value.toLocaleString("pt-BR")}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#8A938A]">
                  {value === null ? "Aguardando políticas RLS administrativas" : metric.description}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <section aria-labelledby="quick-actions-title" className="mt-9 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:p-6">
        <h2 id="quick-actions-title" className="text-lg font-extrabold">Acessos rápidos</h2>
        <p className="mt-1 text-sm text-[#667469]">As áreas de gerenciamento serão habilitadas nas próximas etapas.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div aria-disabled="true" className="flex items-center justify-between rounded-xl border border-[#E1E7DC] bg-[#F7F5EF] px-4 py-4 text-sm font-semibold text-[#667469]">
            <span>Gerenciar receitas</span><span className="text-xs">Em breve</span>
          </div>
          <div aria-disabled="true" className="flex items-center justify-between rounded-xl border border-[#E1E7DC] bg-[#F7F5EF] px-4 py-4 text-sm font-semibold text-[#667469]">
            <span>Gerenciar ingredientes</span><span className="text-xs">Em breve</span>
          </div>
        </div>
      </section>
    </section>
  );
}
