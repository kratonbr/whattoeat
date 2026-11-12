"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const LOCALES = [{ code: "pt-BR", label: "Português brasileiro" }, { code: "en", label: "Inglês" }];
const CATEGORIES = [["breakfast", "Café da manhã"], ["lunch", "Almoço"], ["dinner", "Jantar"], ["snack", "Lanche"], ["dessert", "Sobremesa"]];
const ERRORS = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.", ADMIN_REQUIRED: "Sua conta não tem permissão para editar receitas.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso. Tente novamente.", RLS_NOT_READY: "O acesso de edição depende da configuração das políticas administrativas no banco.",
  DUPLICATE: "Já existe uma receita com um destes slugs.", IN_USE: "Não foi possível excluir a receita porque ela ainda está vinculada a dados do catálogo.",
  VALIDATION_ERROR: "Revise os campos destacados antes de salvar.", NOT_FOUND: "A receita não foi encontrada.",
  IMAGE_NOT_READY: "O armazenamento de imagens depende da configuração das políticas e do bucket no Supabase.",
  IMAGE_SIZE_INVALID: "A imagem deve ter até 5 MB.", IMAGE_FORMAT_INVALID: "Envie uma imagem JPEG, PNG ou WebP válida.",
  OPERATION_UNAVAILABLE: "Não foi possível salvar a receita. Tente novamente.",
};

const blankTranslation = (language_code) => ({ language_code, slug: "", title: "", description: "", image_alt: "", instructions_text: "" });
const initialRecipe = () => ({ category: "lunch", prep_time_minutes: 30, servings: 2, difficulty: "easy", status: "draft", translations: LOCALES.map(({ code }) => blankTranslation(code)), ingredients: [] });

function translateRecord(record) {
  const byLocale = new Map((record.translations ?? []).map((entry) => [entry.language_code, entry]));
  return {
    category: record.category, prep_time_minutes: record.prep_time_minutes, servings: record.servings,
    difficulty: record.difficulty, status: record.status, image_path: record.image_path, image_url: record.image_url ?? null,
    translations: LOCALES.map(({ code }) => {
      const entry = byLocale.get(code) ?? {};
      return { language_code: code, slug: entry.slug ?? "", title: entry.title ?? "", description: entry.description ?? "", image_alt: entry.image_alt ?? "", instructions_text: Array.isArray(entry.instructions) ? entry.instructions.join("\n") : "" };
    }),
    ingredients: (record.ingredients ?? []).map((entry) => ({ ingredient_id: entry.ingredient_id, quantity: entry.quantity ?? "", quantity_text: entry.quantity_text ?? "", unit_code: entry.unit_code ?? "", preparation_note: entry.preparation_note ?? "" })),
  };
}

function errorMessage(code) { return ERRORS[code] ?? ERRORS.OPERATION_UNAVAILABLE; }
function populatedTranslations(translations) {
  return translations.filter((entry) => [entry.slug, entry.title, entry.description, entry.image_alt, entry.instructions_text].some((value) => value.trim()))
    .map(({ language_code, slug, title, description, image_alt, instructions_text }) => ({ language_code, slug, title, description, image_alt, instructions: instructions_text.split("\n").map((step) => step.trim()).filter(Boolean) }));
}

function Field({ label, children, className = "" }) {
  return <label className={`block text-sm font-semibold text-[#405447] ${className}`}>{label}{children}</label>;
}

export default function RecipeEditor({ recipeId = null }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [ingredients, setIngredients] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const imagePreview = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : null, [imageFile]);

  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [ingredientResponse, recipeResponse] = await Promise.all([
          fetch("/api/admin/ingredients", { cache: "no-store", credentials: "same-origin" }),
          recipeId ? fetch(`/api/admin/recipes/${recipeId}`, { cache: "no-store", credentials: "same-origin" }) : Promise.resolve(null),
        ]);
        const ingredientBody = await ingredientResponse.json().catch(() => ({}));
        const recipeBody = recipeResponse ? await recipeResponse.json().catch(() => ({})) : null;
        if (!ingredientResponse.ok) throw Object.assign(new Error(), { code: ingredientBody.error });
        if (recipeResponse && !recipeResponse.ok) throw Object.assign(new Error(), { code: recipeBody.error });
        if (!active) return;
        setIngredients(ingredientBody.data ?? []);
        if (recipeBody) setRecipe(translateRecord(recipeBody.data));
      } catch (cause) {
        if (active) setError(errorMessage(cause.code));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [recipeId]);

  function updateRecipe(field, value) { setRecipe((current) => ({ ...current, [field]: value })); }
  function updateTranslation(index, field, value) {
    setRecipe((current) => ({ ...current, translations: current.translations.map((entry, position) => position === index ? { ...entry, [field]: value } : entry) }));
  }
  function updateIngredient(index, field, value) {
    setRecipe((current) => ({ ...current, ingredients: current.ingredients.map((entry, position) => position === index ? { ...entry, [field]: value } : entry) }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError(""); setFieldErrors([]);
    const payload = {
      category: recipe.category, prep_time_minutes: recipe.prep_time_minutes, servings: recipe.servings,
      difficulty: recipe.difficulty, status: recipe.status,
      translations: populatedTranslations(recipe.translations),
      ingredients: recipe.ingredients.map((entry, index) => ({ ...entry, display_order: index })),
    };
    try {
      const response = await fetch(recipeId ? `/api/admin/recipes/${recipeId}` : "/api/admin/recipes", {
        method: recipeId ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(errorMessage(body.error));
        setFieldErrors(Array.isArray(body.fields) ? body.fields.map((entry) => `${entry.field}: ${entry.message}`) : []);
        return;
      }
      const savedId = body.data?.id ?? recipeId;
      if (imageFile) {
        const form = new FormData(); form.set("file", imageFile);
        const imageResponse = await fetch(`/api/admin/recipes/${savedId}/image`, { method: "POST", credentials: "same-origin", body: form });
        const imageBody = await imageResponse.json().catch(() => ({}));
        if (!imageResponse.ok) {
          const message = errorMessage(imageBody.error);
          setError(message);
          if (!recipeId) {
            window.alert(`A receita foi salva, mas a imagem não foi enviada. ${message}`);
            router.replace(`/admin/recipes/${savedId}`);
            router.refresh();
          }
          return;
        }
      } else if (removeImage && recipe.image_path) {
        const imageResponse = await fetch(`/api/admin/recipes/${savedId}/image`, { method: "DELETE", credentials: "same-origin" });
        const imageBody = await imageResponse.json().catch(() => ({}));
        if (!imageResponse.ok) { setError(errorMessage(imageBody.error)); return; }
        if (imageBody.data?.cleanupComplete === false) window.alert("A imagem foi desvinculada, mas o arquivo antigo não pôde ser removido. A limpeza poderá ser feita depois.");
      }
      router.push(`/admin/recipes/${savedId}`);
      router.refresh();
    } catch {
      setError(ERRORS.OPERATION_UNAVAILABLE);
    } finally { setSaving(false); }
  }

  if (loading) return <p role="status" className="rounded-2xl bg-white p-6 text-sm text-[#667469]">Carregando formulário…</p>;

  return (
    <section lang="pt-BR" aria-labelledby="recipe-editor-title">
      <div className="mb-6"><Link href="/admin/recipes" className="text-sm font-bold text-[#315B42] hover:underline">← Voltar às receitas</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Edição editorial</p><h1 id="recipe-editor-title" className="mt-2 text-3xl font-extrabold tracking-tight">{recipeId ? "Editar receita" : "Cadastrar receita"}</h1></div>
      {error && <div role="alert" className="mb-5 rounded-2xl border border-[#EACFC3] bg-[#FFF8F4] p-4 text-sm text-[#8D432D]"><p className="font-semibold">{error}</p>{fieldErrors.length > 0 && <ul className="mt-2 list-inside list-disc">{fieldErrors.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul>}</div>}
      <form className="space-y-6" onSubmit={submit}>
        <section className="grid gap-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Dados principais">
          <Field label="Categoria"><select value={recipe.category} onChange={(event) => updateRecipe("category", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3">{CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
          <Field label="Tempo (minutos)"><input type="number" min="1" max="1440" required value={recipe.prep_time_minutes} onChange={(event) => updateRecipe("prep_time_minutes", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
          <Field label="Porções originais"><input type="number" min="1" max="100" required value={recipe.servings} onChange={(event) => updateRecipe("servings", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
          <Field label="Dificuldade"><select value={recipe.difficulty} onChange={(event) => updateRecipe("difficulty", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3"><option value="easy">Fácil</option><option value="medium">Média</option><option value="hard">Difícil</option></select></Field>
          <Field label="Situação"><select value={recipe.status} onChange={(event) => updateRecipe("status", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3"><option value="draft">Rascunho</option><option value="published">Publicada</option></select></Field>
        </section>

        {recipe.translations.map((entry, index) => <section key={entry.language_code} className="space-y-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5" aria-labelledby={`translation-${entry.language_code}`}>
          <h2 id={`translation-${entry.language_code}`} className="text-lg font-extrabold">Tradução: {LOCALES.find(({ code }) => code === entry.language_code)?.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título"><input maxLength={180} value={entry.title} onChange={(event) => updateTranslation(index, "title", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Slug"><input maxLength={180} value={entry.slug} onChange={(event) => updateTranslation(index, "slug", event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Descrição" className="sm:col-span-2"><textarea rows={3} maxLength={3000} value={entry.description} onChange={(event) => updateTranslation(index, "description", event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE5D8] bg-white p-3" /></Field>
            <Field label="Texto alternativo da imagem"><input maxLength={300} value={entry.image_alt} onChange={(event) => updateTranslation(index, "image_alt", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Modo de preparo (uma etapa por linha)" className="sm:col-span-2"><textarea rows={5} value={entry.instructions_text} onChange={(event) => updateTranslation(index, "instructions_text", event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE5D8] bg-white p-3" /></Field>
          </div>
        </section>)}

        <section className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5" aria-labelledby="recipe-ingredients-title">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="recipe-ingredients-title" className="text-lg font-extrabold">Ingredientes e quantidades</h2><p className="mt-1 text-sm text-[#667469]">A ordem das linhas será usada na receita.</p></div><button className="min-h-10 rounded-full border border-[#C9D6C5] px-4 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" onClick={() => updateRecipe("ingredients", [...recipe.ingredients, { ingredient_id: "", quantity: "", quantity_text: "", unit_code: "", preparation_note: "" }])} type="button">Adicionar ingrediente</button></div>
          {!ingredients.length && <p className="mt-4 rounded-xl bg-[#FFF9E8] p-3 text-sm text-[#66552D]">Cadastre ingredientes antes de vinculá-los a uma receita.</p>}
          <div className="mt-4 space-y-3">{recipe.ingredients.map((entry, index) => <div key={`${entry.ingredient_id}-${index}`} className="grid gap-3 rounded-xl bg-[#F7F5EF] p-3 sm:grid-cols-2 lg:grid-cols-6">
            <Field label="Ingrediente" className="lg:col-span-2"><select required value={entry.ingredient_id} onChange={(event) => {
              const selected = ingredients.find((item) => item.id === event.target.value);
              setRecipe((current) => ({ ...current, ingredients: current.ingredients.map((item, position) => position === index ? { ...item, ingredient_id: event.target.value, unit_code: item.unit_code || selected?.default_unit || "" } : item) }));
            }} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3"><option value="">Selecione</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.ingredient_translations?.find((translation) => translation.language_code === "pt-BR")?.name || item.ingredient_key}</option>)}</select></Field>
            <Field label="Quantidade"><input type="number" min="0.001" step="0.001" value={entry.quantity} onChange={(event) => updateIngredient(index, "quantity", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Ou quantidade textual"><input maxLength={80} value={entry.quantity_text} onChange={(event) => updateIngredient(index, "quantity_text", event.target.value)} placeholder="Ex.: a gosto" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Unidade"><input maxLength={40} value={entry.unit_code} onChange={(event) => updateIngredient(index, "unit_code", event.target.value)} placeholder="g, ml, unidade" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <div className="flex items-end"><button className="min-h-11 w-full rounded-xl border border-[#E7C7BB] px-3 text-sm font-bold text-[#9B4B34] hover:bg-[#FFF1EA]" onClick={() => updateRecipe("ingredients", recipe.ingredients.filter((_, position) => position !== index))} type="button">Remover</button></div>
            <Field label="Observação de preparo" className="sm:col-span-2 lg:col-span-6"><input maxLength={300} value={entry.preparation_note} onChange={(event) => updateIngredient(index, "preparation_note", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
          </div>)}</div>
        </section>

        <section className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5" aria-labelledby="recipe-image-title">
          <h2 id="recipe-image-title" className="text-lg font-extrabold">Imagem da receita</h2><p className="mt-1 text-sm text-[#667469]">JPEG, PNG ou WebP; até 5 MB. A imagem só será enviada depois de salvar a receita.</p>
          {(imagePreview || (recipe.image_path && !removeImage && recipe.image_url)) && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview || recipe.image_url} alt="Pré-visualização da imagem da receita" className="h-48 w-full max-w-md rounded-xl object-cover" />
              {recipe.image_path && <button className="mt-2 text-sm font-bold text-[#9B4B34] underline" onClick={() => { setRemoveImage(true); setImageFile(null); }} type="button">Remover imagem cadastrada</button>}
            </div>
          )}
          <label className="mt-4 block text-sm font-semibold text-[#405447]">Selecionar arquivo<input className="mt-2 block w-full text-sm" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setImageFile(event.target.files?.[0] ?? null); setRemoveImage(false); }} type="file" /></label>
          {imageFile && <button className="mt-2 text-sm font-bold text-[#9B4B34] underline" onClick={() => setImageFile(null)} type="button">Cancelar seleção</button>}
        </section>

        <div className="flex flex-wrap gap-3"><button disabled={saving} className="min-h-12 rounded-full bg-[#254936] px-6 text-sm font-bold text-white hover:bg-[#1E3C2C] disabled:opacity-60" type="submit">{saving ? "Salvando…" : "Salvar receita"}</button><Link className="inline-flex min-h-12 items-center rounded-full border border-[#C9D6C5] px-5 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" href="/admin/recipes">Cancelar</Link></div>
      </form>
    </section>
  );
}
