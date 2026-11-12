"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const MESSAGES = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.",
  ADMIN_REQUIRED: "Sua conta não tem permissão para acessar as receitas.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso. Tente novamente.",
  RLS_NOT_READY: "O acesso editorial depende da configuração e validação das políticas administrativas no banco.",
  OPERATION_UNAVAILABLE: "Não foi possível carregar as receitas. Tente novamente.",
};

const CATEGORIES = [
  ["", "Todas as categorias"], ["breakfast", "Café da manhã"], ["lunch", "Almoço"],
  ["dinner", "Jantar"], ["snack", "Lanche"], ["dessert", "Sobremesa"],
];

function messageFor(code) { return MESSAGES[code] ?? MESSAGES.OPERATION_UNAVAILABLE; }
function titleFor(recipe) { return recipe.translations?.["pt-BR"]?.title || recipe.translations?.en?.title || "Receita sem título"; }

export default function RecipesClient() {
  const [filters, setFilters] = useState({ q: "", category: "", status: "" });
  const [result, setResult] = useState({ status: "loading", items: [], total: 0, page: 1, error: "" });
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setResult((state) => ({ ...state, status: "loading", error: "" }));
    const params = new URLSearchParams({ page: "1", pageSize: "50" });
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.category) params.set("category", filters.category);
    if (filters.status) params.set("status", filters.status);
    try {
      const response = await fetch(`/api/admin/recipes?${params}`, { cache: "no-store", credentials: "same-origin" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setResult({ status: "error", items: [], total: 0, page: 1, error: messageFor(body.error) });
        return;
      }
      setResult({ status: "success", ...body.data, error: "" });
    } catch {
      setResult({ status: "error", items: [], total: 0, page: 1, error: MESSAGES.OPERATION_UNAVAILABLE });
    }
  }, [filters]);

  useEffect(() => { load(); }, [load, refresh]);

  async function removeRecipe(recipe) {
    if (!window.confirm(`Excluir “${titleFor(recipe)}”? Esta ação não pode ser desfeita.`)) return;
    try {
      const response = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: true }),
      });
      const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(messageFor(body.error));
        return;
      }
      setRefresh((value) => value + 1);
    } catch {
      window.alert(MESSAGES.OPERATION_UNAVAILABLE);
    }
  }

  return (
    <section lang="pt-BR" aria-labelledby="recipes-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Catálogo editorial</p>
          <h1 id="recipes-title" className="mt-2 text-3xl font-extrabold tracking-tight">Receitas</h1>
          <p className="mt-2 text-sm text-[#667469]">Pesquise, revise e organize receitas do catálogo.</p>
        </div>
        <Link href="/admin/recipes/new" className="inline-flex min-h-11 items-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">Nova receita</Link>
      </div>

      <form className="mb-5 grid gap-3 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-4 sm:grid-cols-[1fr_200px_170px_auto] sm:items-end" onSubmit={(event) => { event.preventDefault(); setRefresh((value) => value + 1); }}>
        <label className="text-sm font-semibold text-[#405447]">Buscar título
          <input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} maxLength={100} className="mt-1 block min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3 text-sm outline-none focus:border-[#789579] focus:ring-4 focus:ring-[#D86F46]/15" />
        </label>
        <label className="text-sm font-semibold text-[#405447]">Categoria
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} className="mt-1 block min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3 text-sm outline-none focus:border-[#789579] focus:ring-4 focus:ring-[#D86F46]/15">
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#405447]">Situação
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="mt-1 block min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3 text-sm outline-none focus:border-[#789579] focus:ring-4 focus:ring-[#D86F46]/15">
            <option value="">Todas</option><option value="draft">Rascunho</option><option value="published">Publicada</option>
          </select>
        </label>
        <button className="min-h-11 rounded-full border border-[#C9D6C5] px-4 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" type="submit">Aplicar</button>
      </form>

      {result.status === "loading" && <p className="rounded-2xl bg-white p-6 text-sm text-[#667469]" role="status">Carregando receitas…</p>}
      {result.status === "error" && <div className="rounded-2xl border border-[#EACFC3] bg-[#FFF8F4] p-5" role="alert"><p className="font-semibold text-[#8D432D]">{result.error}</p><button className="mt-3 font-bold text-[#315B42] underline" onClick={() => setRefresh((value) => value + 1)} type="button">Tentar novamente</button></div>}
      {result.status === "success" && result.items.length === 0 && <p className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-6 text-sm text-[#667469]" role="status">Nenhuma receita encontrada.</p>}
      {result.status === "success" && result.items.length > 0 && <>
        <p className="mb-3 text-sm text-[#667469]">{result.total} {result.total === 1 ? "receita encontrada" : "receitas encontradas"}</p>
        <div className="grid gap-3">
          {result.items.map((recipe) => <article key={recipe.id} className="flex flex-col gap-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0"><h2 className="truncate font-bold text-[#254936]">{titleFor(recipe)}</h2><p className="mt-1 text-xs text-[#667469]">{CATEGORIES.find(([value]) => value === recipe.category)?.[1] ?? recipe.category} · {recipe.prep_time_minutes} min · {recipe.servings} porções</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${recipe.status === "published" ? "bg-[#E5F1E4] text-[#315B42]" : "bg-[#FFF1D6] text-[#7A5A1E]"}`}>{recipe.status === "published" ? "Publicada" : "Rascunho"}</span></div>
            <div className="flex shrink-0 gap-2"><Link className="rounded-full border border-[#C9D6C5] px-4 py-2 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" href={`/admin/recipes/${recipe.id}`}>Editar</Link><button className="rounded-full border border-[#E7C7BB] px-4 py-2 text-sm font-bold text-[#9B4B34] hover:bg-[#FFF1EA]" onClick={() => removeRecipe(recipe)} type="button">Excluir</button></div>
          </article>)}
        </div>
      </>}
    </section>
  );
}
