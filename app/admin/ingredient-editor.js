"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LOCALES = [{ code: "pt-BR", label: "Português brasileiro" }, { code: "en", label: "Inglês" }];
const ERRORS = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.", ADMIN_REQUIRED: "Sua conta não tem permissão para editar ingredientes.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso. Tente novamente.", RLS_NOT_READY: "O acesso de edição depende da configuração das políticas administrativas no banco.",
  DUPLICATE: "Já existe um ingrediente com este identificador.", VALIDATION_ERROR: "Revise os campos informados.", NOT_FOUND: "O ingrediente não foi encontrado.",
  OPERATION_UNAVAILABLE: "Não foi possível salvar o ingrediente. Tente novamente.",
};
const initial = () => ({ ingredient_key: "", default_unit: "", translations: LOCALES.map(({ code }) => ({ language_code: code, name: "" })) });

export default function IngredientEditor({ ingredientId = null }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(Boolean(ingredientId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (!ingredientId) return;
    let active = true;
    fetch(`/api/admin/ingredients/${ingredientId}`, { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw Object.assign(new Error(), { code: body.error });
        return body.data;
      })
      .then((ingredient) => {
        if (!active) return;
        const translations = new Map((ingredient.ingredient_translations ?? []).map((entry) => [entry.language_code, entry.name]));
        setValue({ ingredient_key: ingredient.ingredient_key, default_unit: ingredient.default_unit ?? "", translations: LOCALES.map(({ code }) => ({ language_code: code, name: translations.get(code) ?? "" })) });
      })
      .catch((cause) => { if (active) setError(ERRORS[cause.code] ?? ERRORS.OPERATION_UNAVAILABLE); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ingredientId]);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(""); setFields([]);
    try {
      const response = await fetch(ingredientId ? `/api/admin/ingredients/${ingredientId}` : "/api/admin/ingredients", {
        method: ingredientId ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(ERRORS[body.error] ?? ERRORS.OPERATION_UNAVAILABLE);
        setFields(Array.isArray(body.fields) ? body.fields.map((entry) => `${entry.field}: ${entry.message}`) : []);
        return;
      }
      router.push("/admin/ingredients"); router.refresh();
    } catch { setError(ERRORS.OPERATION_UNAVAILABLE); }
    finally { setSaving(false); }
  }

  if (loading) return <p role="status" className="rounded-2xl bg-white p-6 text-sm text-[#667469]">Carregando formulário…</p>;

  return <section lang="pt-BR" aria-labelledby="ingredient-editor-title">
    <div className="mb-6"><Link href="/admin/ingredients" className="text-sm font-bold text-[#315B42] hover:underline">← Voltar aos ingredientes</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Catálogo editorial</p><h1 id="ingredient-editor-title" className="mt-2 text-3xl font-extrabold tracking-tight">{ingredientId ? "Editar ingrediente" : "Cadastrar ingrediente"}</h1></div>
    {error && <div role="alert" className="mb-5 rounded-2xl border border-[#EACFC3] bg-[#FFF8F4] p-4 text-sm text-[#8D432D]"><p className="font-semibold">{error}</p>{fields.length > 0 && <ul className="mt-2 list-inside list-disc">{fields.map((field, index) => <li key={`${field}-${index}`}>{field}</li>)}</ul>}</div>}
    <form onSubmit={submit} className="space-y-5">
      <section className="grid gap-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#405447]">Identificador único<input required maxLength={100} pattern="[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*" value={value.ingredient_key} onChange={(event) => setValue((current) => ({ ...current, ingredient_key: event.target.value }))} placeholder="ex.: brown-rice" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /><span className="mt-1 block text-xs font-normal text-[#788579]">Use letras sem acento, números e hífens.</span></label>
        <label className="text-sm font-semibold text-[#405447]">Unidade padrão (opcional)<input maxLength={40} value={value.default_unit} onChange={(event) => setValue((current) => ({ ...current, default_unit: event.target.value }))} placeholder="g, ml, unidade" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></label>
      </section>
      {value.translations.map((entry, index) => <section key={entry.language_code} className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5"><h2 className="text-lg font-extrabold">Tradução: {LOCALES.find(({ code }) => code === entry.language_code)?.label}</h2><label className="mt-4 block text-sm font-semibold text-[#405447]">Nome<input maxLength={120} value={entry.name} onChange={(event) => setValue((current) => ({ ...current, translations: current.translations.map((item, position) => position === index ? { ...item, name: event.target.value } : item) }))} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></label></section>)}
      <div className="flex flex-wrap gap-3"><button disabled={saving} className="min-h-12 rounded-full bg-[#254936] px-6 text-sm font-bold text-white hover:bg-[#1E3C2C] disabled:opacity-60" type="submit">{saving ? "Salvando…" : "Salvar ingrediente"}</button><Link className="inline-flex min-h-12 items-center rounded-full border border-[#C9D6C5] px-5 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" href="/admin/ingredients">Cancelar</Link></div>
    </form>
  </section>;
}
