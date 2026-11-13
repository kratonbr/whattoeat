"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminToast } from "./admin-toast-provider";

const ERRORS = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.",
  ADMIN_REQUIRED: "Sua conta não tem permissão para acessar os ingredientes.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso. Tente novamente.",
  RLS_NOT_READY: "O acesso editorial depende da configuração e validação das políticas administrativas no banco.",
  IN_USE: "Este ingrediente está vinculado a uma ou mais receitas e não pode ser excluído.",
  OPERATION_UNAVAILABLE: "Não foi possível concluir a operação. Tente novamente.",
};

export default function IngredientsClient() {
  const { showToast } = useAdminToast();
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "loading", items: [], error: "" });
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/ingredients?q=${encodeURIComponent(query.trim())}`, { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok) return setState({ status: "error", items: [], error: ERRORS[body.error] ?? ERRORS.OPERATION_UNAVAILABLE });
        setState({ status: "success", items: body.data ?? [], error: "" });
      })
      .catch(() => { if (active) setState({ status: "error", items: [], error: ERRORS.OPERATION_UNAVAILABLE }); });
    return () => { active = false; };
  }, [query, refresh]);

  async function removeIngredient(ingredient) {
    const label = ingredient.ingredient_translations?.find((entry) => entry.language_code === "pt-BR")?.name || ingredient.ingredient_key;
    if (!window.confirm(`Excluir “${label}”?`)) return;
    try {
      const response = await fetch(`/api/admin/ingredients/${ingredient.id}`, {
        method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: true }),
      });
      const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
      if (!response.ok) return showToast(ERRORS[body.error] ?? ERRORS.OPERATION_UNAVAILABLE, "error");
      showToast("Ingrediente excluído com sucesso.", "success");
      setRefresh((value) => value + 1);
    } catch { showToast(ERRORS.OPERATION_UNAVAILABLE, "error"); }
  }

  return (
    <section lang="pt-BR" aria-labelledby="ingredients-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Catálogo editorial</p><h1 id="ingredients-title" className="mt-2 text-3xl font-extrabold tracking-tight">Ingredientes</h1><p className="mt-2 text-sm text-[#667469]">Cadastre ingredientes reutilizáveis e mantenha os nomes nos dois idiomas.</p></div>
        <Link href="/admin/ingredients/new" className="inline-flex min-h-11 items-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">Novo ingrediente</Link>
      </div>
      <form className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-4 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); setRefresh((value) => value + 1); }}>
        <label className="flex-1 text-sm font-semibold text-[#405447]">Buscar pelo identificador<input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} className="mt-1 block min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3 text-sm outline-none focus:border-[#789579] focus:ring-4 focus:ring-[#D86F46]/15" /></label>
        <button className="min-h-11 rounded-full border border-[#C9D6C5] px-4 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" type="submit">Buscar</button>
      </form>
      {state.status === "loading" && <p className="rounded-2xl bg-white p-6 text-sm text-[#667469]" role="status">Carregando ingredientes…</p>}
      {state.status === "error" && <div className="rounded-2xl border border-[#EACFC3] bg-[#FFF8F4] p-5" role="alert"><p className="font-semibold text-[#8D432D]">{state.error}</p><button className="mt-3 font-bold text-[#315B42] underline" onClick={() => setRefresh((value) => value + 1)} type="button">Tentar novamente</button></div>}
      {state.status === "success" && !state.items.length && <p className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-6 text-sm text-[#667469]" role="status">Nenhum ingrediente encontrado.</p>}
      {state.status === "success" && state.items.length > 0 && <div className="grid gap-3">{state.items.map((ingredient) => {
        const pt = ingredient.ingredient_translations?.find((entry) => entry.language_code === "pt-BR")?.name || "Tradução pt-BR pendente";
        const en = ingredient.ingredient_translations?.find((entry) => entry.language_code === "en")?.name || "Tradução em inglês pendente";
        return <article key={ingredient.id} className="flex flex-col gap-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="font-bold text-[#254936]">{pt}</h2><p className="mt-1 text-sm text-[#667469]">{en} · <code>{ingredient.ingredient_key}</code>{ingredient.default_unit ? ` · Unidade padrão: ${ingredient.default_unit}` : ""}</p></div><div className="flex shrink-0 gap-2"><Link className="rounded-full border border-[#C9D6C5] px-4 py-2 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" href={`/admin/ingredients/${ingredient.id}`}>Editar</Link><button className="rounded-full border border-[#E7C7BB] px-4 py-2 text-sm font-bold text-[#9B4B34] hover:bg-[#FFF1EA]" onClick={() => removeIngredient(ingredient)} type="button">Excluir</button></div></article>;
      })}</div>}
    </section>
  );
}
