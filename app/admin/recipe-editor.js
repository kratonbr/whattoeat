"use client";

import Link from "next/link";
import { cloneElement, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import IngredientFormFields, { createIngredientFormValue } from "./ingredient-form-fields";
import RecipeImageUpload from "./recipe-image-upload";
import { useAdminToast } from "./admin-toast-provider";
import { errorsFromResponse, focusFirstInvalidField, validateNativeFields } from "./admin-form-validation";
import { createRecipeSlugFromTitle } from "@/modules/recipes/domain/recipes.mjs";

const LOCALES = [{ code: "pt-BR", label: "Português brasileiro" }, { code: "en", label: "Inglês" }];
const CATEGORIES = [["breakfast", "Café da manhã"], ["lunch", "Almoço"], ["dinner", "Jantar"], ["snack", "Lanche"], ["dessert", "Sobremesa"]];
const ERRORS = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.", ADMIN_REQUIRED: "Sua conta não tem permissão para editar receitas.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso. Tente novamente.", RLS_NOT_READY: "O acesso de edição depende da configuração das políticas administrativas no banco.",
  DUPLICATE: "Esse slug canônico já está em uso por outra receita.", IN_USE: "Não foi possível excluir a receita porque ela ainda está vinculada a dados do catálogo.",
  INGREDIENT_DUPLICATE: "Já existe um ingrediente com esse identificador. Pesquise e selecione o item existente.",
  INGREDIENT_VALIDATION: "Revise os dados do ingrediente.",
  VALIDATION_ERROR: "Revise os campos destacados antes de salvar.", NOT_FOUND: "A receita não foi encontrada.",
  IMAGE_NOT_READY: "O armazenamento de imagens depende da configuração das políticas e do bucket no Supabase.",
  IMAGE_SIZE_INVALID: "A imagem deve ter até 5 MB.", IMAGE_FORMAT_INVALID: "Envie uma imagem JPEG, PNG ou WebP válida.",
  OPERATION_UNAVAILABLE: "Não foi possível salvar a receita. Tente novamente.",
};

const blankTranslation = (language_code) => ({ language_code, title: "", description: "", image_alt: "", instructions_text: "" });
const initialRecipe = () => ({ category: "lunch", prep_time_minutes: 30, servings: 2, difficulty: "easy", status: "draft", canonical_slug: "", translations: LOCALES.map(({ code }) => blankTranslation(code)), ingredients: [] });

function translateRecord(record) {
  const byLocale = new Map((record.translations ?? []).map((entry) => [entry.language_code, entry]));
  const canonicalSlug = byLocale.get("pt-BR")?.slug ?? byLocale.get("en")?.slug ?? "";
  return {
    category: record.category, prep_time_minutes: record.prep_time_minutes, servings: record.servings,
    difficulty: record.difficulty, status: record.status, image_path: record.image_path, image_url: record.image_url ?? null,
    canonical_slug: canonicalSlug,
    translations: LOCALES.map(({ code }) => {
      const entry = byLocale.get(code) ?? {};
      return { language_code: code, title: entry.title ?? "", description: entry.description ?? "", image_alt: entry.image_alt ?? "", instructions_text: Array.isArray(entry.instructions) ? entry.instructions.join("\n") : "" };
    }),
    ingredients: (record.ingredients ?? []).map((entry) => ({ ingredient_id: entry.ingredient_id, quantity: entry.quantity ?? "", quantity_text: entry.quantity_text ?? "", unit_code: entry.unit_code ?? "", preparation_note: entry.preparation_note ?? "" })),
  };
}

function errorMessage(code) { return ERRORS[code] ?? ERRORS.OPERATION_UNAVAILABLE; }
function recipeErrorsFromResponse(fields) {
  const errors = errorsFromResponse(fields);
  for (const locale of ["pt-BR", "en"]) {
    if (errors[`slug ${locale}`]) {
      errors.slug ??= errors[`slug ${locale}`];
      delete errors[`slug ${locale}`];
    }
    const translationError = errors[`tradução ${locale}`];
    if (translationError) {
      const hasSpecificFieldError = Boolean(errors.slug) || ["título", "instruções"].some((field) => errors[`${field} ${locale}`]);
      if (!hasSpecificFieldError) errors[`título ${locale}`] = translationError;
      delete errors[`tradução ${locale}`];
    }
  }
  if (errors.traduções) {
    errors["título pt-BR"] = errors.traduções;
    delete errors.traduções;
  }
  return errors;
}
function normalizeSearch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}
function ingredientNames(ingredient) {
  return Object.fromEntries((ingredient.ingredient_translations ?? []).map(({ language_code, name }) => [language_code, name]));
}
function populatedTranslations(translations, canonicalSlug) {
  return translations.filter((entry) => [entry.title, entry.description, entry.image_alt, entry.instructions_text].some((value) => value.trim()))
    .map(({ language_code, title, description, image_alt, instructions_text }) => ({ language_code, slug: canonicalSlug, title, description, image_alt, instructions: instructions_text.split("\n").map((step) => step.trim()).filter(Boolean) }));
}

function Field({ label, children, className = "", fieldName, validationErrors = {}, onFieldChange }) {
  const message = fieldName ? validationErrors[fieldName] : null;
  const errorId = fieldName ? `validation-${fieldName.replace(/[^a-zA-Z0-9_-]/g, "-")}` : undefined;
  const child = cloneElement(children, {
    ...(fieldName ? { "data-validation-field": fieldName, "aria-invalid": Boolean(message), "aria-describedby": message ? errorId : undefined } : {}),
    onChange: (event) => { onFieldChange?.(); children.props.onChange?.(event); },
    className: `${children.props.className ?? ""} ${message ? "!border-red-500 !ring-2 !ring-red-100" : ""}`.trim(),
  });
  return <label className={`block text-sm font-semibold text-[#405447] ${className}`}>{label}{child}{message && <span id={errorId} className="mt-1 block text-sm font-medium text-red-700">{message}</span>}</label>;
}

export default function RecipeEditor({ recipeId = null, focusTranslation = null, focusField = null }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientFormOpen, setIngredientFormOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState(createIngredientFormValue);
  const [creatingIngredient, setCreatingIngredient] = useState(false);
  const [ingredientNotice, setIngredientNotice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missingRecord, setMissingRecord] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [inlineValidationErrors, setInlineValidationErrors] = useState({});
  const imagePreview = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : null, [imageFile]);
  const filteredIngredients = useMemo(() => {
    const query = normalizeSearch(ingredientSearch);
    if (!query) return [];
    return ingredients.filter((ingredient) => {
      const names = ingredientNames(ingredient);
      return [ingredient.ingredient_key, names["pt-BR"], names.en]
        .some((value) => normalizeSearch(value ?? "").includes(query));
    }).slice(0, 15);
  }, [ingredientSearch, ingredients]);

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
        if (active) {
          if (recipeId && cause.code === "NOT_FOUND") setMissingRecord(true);
          else if (recipeId) { setLoadFailed(true); showToast(errorMessage(cause.code), "error"); }
          else showToast(errorMessage(cause.code), "error");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [recipeId, showToast]);

  useEffect(() => {
    const fieldLabels = { title: "título", instructions: "instruções" };
    if (loading || !recipeId || !LOCALES.some(({ code }) => code === focusTranslation)) return;
    const targetName = focusField === "slug" ? "slug" : fieldLabels[focusField] ? `${fieldLabels[focusField]} ${focusTranslation}` : null;
    if (!targetName) return;
    const target = [...document.querySelectorAll("[data-validation-field]")]
      .find((field) => field.dataset.validationField === targetName);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => target.focus({ preventScroll: true }), 250);
  }, [focusField, focusTranslation, loading, recipeId]);

  function updateRecipe(field, value) { setRecipe((current) => ({ ...current, [field]: value })); }
  function updateTranslation(index, field, value) {
    const translation = recipe.translations[index];
    setRecipe((current) => {
      const next = { ...current, translations: current.translations.map((entry, position) => position === index ? { ...entry, [field]: value } : entry) };
      if (field === "title" && translation?.language_code === "pt-BR" && !recipeId && !slugManuallyEdited) {
        next.canonical_slug = createRecipeSlugFromTitle(value);
      }
      return next;
    });
  }
  function updateCanonicalSlug(value) {
    setSlugManuallyEdited(true);
    setRecipe((current) => ({ ...current, canonical_slug: value }));
  }
  function updateIngredient(index, field, value) {
    setRecipe((current) => ({ ...current, ingredients: current.ingredients.map((entry, position) => position === index ? { ...entry, [field]: value } : entry) }));
  }

  function addIngredientToRecipe(ingredient) {
    if (recipe.ingredients.some((entry) => entry.ingredient_id === ingredient.id)) {
      setIngredientNotice("Esse ingrediente já está na receita.");
      return;
    }
    setRecipe((current) => ({
      ...current,
      ingredients: [...current.ingredients, {
        ingredient_id: ingredient.id,
        quantity: "",
        quantity_text: "",
        unit_code: ingredient.default_unit ?? "",
        preparation_note: "",
      }],
    }));
    setIngredientNotice("Ingrediente adicionado. Informe a quantidade e os detalhes de preparo.");
    setIngredientSearch("");
  }

  async function createAndAddIngredient() {
    const form = document.getElementById("recipe-inline-ingredient-fields");
    const invalid = validateNativeFields(form, { includeInline: true });
    const anyTranslation = newIngredient.translations.some((entry) => entry.name.trim());
    if (!anyTranslation) invalid["nome pt-BR"] = "Informe pelo menos um nome em português ou inglês.";
    if (Object.keys(invalid).length) {
      setInlineValidationErrors(invalid);
      showToast("Revise os campos pendentes do ingrediente.", "error");
      focusFirstInvalidField(form, invalid, { includeInline: true });
      return;
    }
    setCreatingIngredient(true);
    setInlineValidationErrors({});
    setIngredientNotice("");
    try {
      const response = await fetch("/api/admin/ingredients", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIngredient),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errors = errorsFromResponse(body.fields);
        setInlineValidationErrors(errors);
        showToast(body.error === "DUPLICATE" ? ERRORS.INGREDIENT_DUPLICATE : body.error === "VALIDATION_ERROR" ? ERRORS.INGREDIENT_VALIDATION : errorMessage(body.error), "error");
        focusFirstInvalidField(form, errors, { includeInline: true });
        return;
      }

      const created = {
        id: body.data.id,
        ingredient_key: newIngredient.ingredient_key.trim().toLowerCase(),
        default_unit: newIngredient.default_unit.trim() || null,
        ingredient_translations: newIngredient.translations
          .filter((entry) => entry.name.trim())
          .map((entry) => ({ language_code: entry.language_code, name: entry.name.trim() })),
      };
      setIngredients((current) => [...current, created].sort((a, b) => a.ingredient_key.localeCompare(b.ingredient_key)));
      addIngredientToRecipe(created);
      setNewIngredient(createIngredientFormValue());
      setIngredientFormOpen(false);
      setInlineValidationErrors({});
      showToast("Ingrediente cadastrado e adicionado à receita.", "success");
    } catch {
      showToast(ERRORS.OPERATION_UNAVAILABLE, "error");
    } finally {
      setCreatingIngredient(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const nativeErrors = validateNativeFields(formElement);
    if (Object.keys(nativeErrors).length) {
      setValidationErrors(nativeErrors);
      showToast("Existem campos pendentes. Revise os campos destacados.", "error");
      focusFirstInvalidField(formElement, nativeErrors);
      return;
    }
    setSaving(true); setValidationErrors({});
    const payload = {
      category: recipe.category, prep_time_minutes: recipe.prep_time_minutes, servings: recipe.servings,
      difficulty: recipe.difficulty, status: recipe.status,
      canonical_slug: recipe.canonical_slug,
      translations: populatedTranslations(recipe.translations, recipe.canonical_slug),
      ingredients: recipe.ingredients.map((entry, index) => ({ ...entry, display_order: index })),
    };
    let cleanupWarning = false;
    let savedId = null;
    try {
      const response = await fetch(recipeId ? `/api/admin/recipes/${recipeId}` : "/api/admin/recipes", {
        method: recipeId ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errors = recipeErrorsFromResponse(body.fields);
        setValidationErrors(errors);
        showToast(errorMessage(body.error), "error");
        focusFirstInvalidField(formElement, errors);
        return;
      }
      savedId = body.data?.id ?? recipeId;
      if (imageFile) {
        const form = new FormData(); form.set("file", imageFile);
        const imageResponse = await fetch(`/api/admin/recipes/${savedId}/image`, { method: "POST", credentials: "same-origin", body: form });
        const imageBody = await imageResponse.json().catch(() => ({}));
        if (!imageResponse.ok) {
          const message = errorMessage(imageBody.error);
          showToast(`A receita foi salva, mas a imagem não foi enviada. ${message}`, "error");
          if (!recipeId) {
            router.replace(`/admin/recipes/${savedId}`);
            router.refresh();
          }
          return;
        }
        setRecipe((current) => ({ ...current, image_path: imageBody.data?.image_path ?? null, image_url: imageBody.data?.image_url ?? null }));
        setImageFile(null);
        setRemoveImage(false);
      } else if (removeImage && recipe.image_path) {
        const imageResponse = await fetch(`/api/admin/recipes/${savedId}/image`, { method: "DELETE", credentials: "same-origin" });
        const imageBody = await imageResponse.json().catch(() => ({}));
        if (!imageResponse.ok) { showToast(`A receita foi salva, mas não foi possível remover a imagem. ${errorMessage(imageBody.error)}`, "error"); return; }
        setRecipe((current) => ({ ...current, image_path: imageBody.data?.image_path ?? null, image_url: null }));
        setImageFile(null);
        setRemoveImage(false);
        if (imageBody.data?.cleanupComplete === false) cleanupWarning = true;
      }
      if (cleanupWarning) showToast("A receita foi salva e a imagem desvinculada, mas o arquivo antigo não pôde ser removido. A limpeza poderá ser feita depois.", "warning");
      else showToast(recipeId ? "Receita atualizada com sucesso." : "Receita cadastrada com sucesso.", "success");
      router.push(`/admin/recipes/${savedId}`);
      router.refresh();
    } catch {
      if (savedId) {
        showToast("A receita foi salva, mas houve uma falha ao processar a imagem. Tente novamente na edição da receita.", "error");
        if (!recipeId) { router.replace(`/admin/recipes/${savedId}`); router.refresh(); }
      } else showToast(ERRORS.OPERATION_UNAVAILABLE, "error");
    } finally { setSaving(false); }
  }

  if (loading) return <p role="status" className="rounded-2xl bg-white p-6 text-sm text-[#667469]">Carregando formulário…</p>;
  if (recipeId && (missingRecord || loadFailed)) return <section lang="pt-BR" className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-6 sm:p-9" aria-labelledby="recipe-unavailable-title">
    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Catálogo editorial</p>
    <h1 id="recipe-unavailable-title" className="mt-2 text-2xl font-extrabold">{missingRecord ? "Receita não encontrada" : "Não foi possível carregar a receita"}</h1>
    <p className="mt-3 text-sm leading-6 text-[#667469]">{missingRecord ? "Esta receita não existe ou não está mais disponível." : "Ocorreu uma falha temporária ao carregar os dados. Nenhuma alteração foi feita."}</p>
    <Link href="/admin/recipes" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">Voltar às receitas</Link>
  </section>;

  return (
    <section lang="pt-BR" aria-labelledby="recipe-editor-title">
      <div className="mb-6"><Link href="/admin/recipes" className="text-sm font-bold text-[#315B42] hover:underline">← Voltar às receitas</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Edição editorial</p><h1 id="recipe-editor-title" className="mt-2 text-3xl font-extrabold tracking-tight">{recipeId ? "Editar receita" : "Cadastrar receita"}</h1></div>
      <form className="space-y-6" noValidate onSubmit={submit}>
        <section className="grid gap-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Dados principais">
          <Field label="Categoria" fieldName="categoria" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><select value={recipe.category} onChange={(event) => updateRecipe("category", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3">{CATEGORIES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
          <Field label="Tempo (minutos)" fieldName="tempo de preparo" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input type="number" min="1" max="1440" required value={recipe.prep_time_minutes} onChange={(event) => updateRecipe("prep_time_minutes", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
          <Field label="Porções originais" fieldName="porções" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input type="number" min="1" max="100" required value={recipe.servings} onChange={(event) => updateRecipe("servings", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
          <Field label="Dificuldade" fieldName="dificuldade" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><select value={recipe.difficulty} onChange={(event) => updateRecipe("difficulty", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3"><option value="easy">Fácil</option><option value="medium">Média</option><option value="hard">Difícil</option></select></Field>
          <Field label="Situação" fieldName="status" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><select value={recipe.status} onChange={(event) => updateRecipe("status", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3"><option value="draft">Rascunho</option><option value="published">Publicada</option></select></Field>
        </section>

        <p role="note" className="rounded-xl border border-[#DCE5D8] bg-[#F1F7EE] px-4 py-3 text-sm leading-6 text-[#405447]">
          Rascunhos podem ter traduções incompletas. Para publicar, cada idioma precisa de título e modo de preparo, além de um slug canônico e ao menos um ingrediente.
        </p>

        {recipe.translations.map((entry, index) => <section key={entry.language_code} className="space-y-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5" aria-labelledby={`translation-${entry.language_code}`}>
          <h2 id={`translation-${entry.language_code}`} className="text-lg font-extrabold">Tradução: {LOCALES.find(({ code }) => code === entry.language_code)?.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" fieldName={`título ${entry.language_code}`} validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input maxLength={180} value={entry.title} onChange={(event) => updateTranslation(index, "title", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            {entry.language_code === "pt-BR" && <div>
              <Field label="Slug canônico" fieldName="slug" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input maxLength={180} value={recipe.canonical_slug} onChange={(event) => updateCanonicalSlug(event.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" aria-describedby="canonical-slug-help" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
              <span id="canonical-slug-help" className="mt-1 block text-xs font-normal text-[#667469]">Usado nos dois idiomas. Em novas receitas, sugerido pelo título em português; em edições, permanece estável até você alterá-lo.</span>
            </div>}
            <Field label="Descrição" fieldName={`descrição ${entry.language_code}`} validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})} className="sm:col-span-2"><textarea rows={3} maxLength={3000} value={entry.description} onChange={(event) => updateTranslation(index, "description", event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE5D8] bg-white p-3" /></Field>
            <Field label="Texto alternativo da imagem" fieldName={`texto alternativo ${entry.language_code}`} validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input maxLength={300} value={entry.image_alt} onChange={(event) => updateTranslation(index, "image_alt", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Modo de preparo (uma etapa por linha)" fieldName={`instruções ${entry.language_code}`} validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})} className="sm:col-span-2"><textarea rows={5} value={entry.instructions_text} onChange={(event) => updateTranslation(index, "instructions_text", event.target.value)} className="mt-1 w-full rounded-xl border border-[#DCE5D8] bg-white p-3" /></Field>
          </div>
        </section>)}

        <section className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5" aria-labelledby="recipe-ingredients-title">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="recipe-ingredients-title" className="text-lg font-extrabold">Ingredientes e quantidades</h2><p className="mt-1 text-sm text-[#667469]">Pesquise no catálogo compartilhado ou cadastre sem sair desta receita. A ordem das linhas será usada no preparo.</p></div><Link href="/admin/ingredients" target="_blank" rel="noreferrer" className="text-sm font-bold text-[#315B42] underline">Gerenciar catálogo completo</Link></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Field label="Pesquisar ingredientes existentes" fieldName="ingredientes" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input type="search" value={ingredientSearch} onChange={(event) => { setIngredientSearch(event.target.value); setIngredientNotice(""); }} placeholder="Pesquisar ingrediente pelo nome..." autoComplete="off" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <button className="min-h-11 self-end rounded-full border border-[#C9D6C5] px-4 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" onClick={() => { setIngredientFormOpen((open) => !open); setInlineValidationErrors({}); }} type="button">{ingredientFormOpen ? "Cancelar cadastro" : "Cadastrar ingrediente"}</button>
          </div>
          {ingredientSearch.trim() && <div className="mt-2 overflow-hidden rounded-xl border border-[#E1E7DC] bg-white" role="group" aria-label="Resultados de ingredientes">
            {filteredIngredients.length ? filteredIngredients.map((ingredient) => {
              const names = ingredientNames(ingredient);
              const alreadyAdded = recipe.ingredients.some((entry) => entry.ingredient_id === ingredient.id);
              return <button key={ingredient.id} type="button" disabled={alreadyAdded} onClick={() => addIngredientToRecipe(ingredient)} className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-[#EEF1EA] px-4 py-2 text-left last:border-b-0 hover:bg-[#F2F5EF] disabled:cursor-not-allowed disabled:bg-[#F7F5EF] disabled:text-[#8A938A]">
                <span><span className="block font-semibold text-[#254936]">{names["pt-BR"] || names.en || ingredient.ingredient_key}</span><span className="block text-xs text-[#667469]">{names.en ? `${names.en} · ` : ""}{ingredient.ingredient_key}{ingredient.default_unit ? ` · ${ingredient.default_unit}` : ""}</span></span>
                <span className="shrink-0 text-xs font-bold">{alreadyAdded ? "Já adicionado" : "Adicionar"}</span>
              </button>;
            }) : <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><p className="text-sm text-[#667469]">Nenhum ingrediente encontrado no catálogo.</p><button type="button" onClick={() => { setIngredientFormOpen(true); setInlineValidationErrors({}); }} className="text-sm font-bold text-[#315B42] underline">Cadastrar novo ingrediente</button></div>}
          </div>}
          {ingredientNotice && <p role="status" className="mt-3 text-sm text-[#315B42]">{ingredientNotice}</p>}
          {ingredientFormOpen && <div className="mt-4 space-y-4 rounded-2xl border border-[#DCE5D8] bg-[#F7F8F3] p-4" aria-label="Cadastro integrado de ingrediente">
            <div><h3 className="font-extrabold text-[#254936]">Novo ingrediente</h3><p className="mt-1 text-sm text-[#667469]">Depois de salvar, ele será selecionado automaticamente nesta receita.</p></div>
            <div id="recipe-inline-ingredient-fields" data-validation-scope="inline">
              <IngredientFormFields value={newIngredient} onChange={setNewIngredient} idPrefix="recipe-inline-ingredient" validationErrors={inlineValidationErrors} onFieldChange={() => setInlineValidationErrors({})} />
              <div className="mt-4 flex flex-wrap gap-2"><button disabled={creatingIngredient} className="min-h-11 rounded-full bg-[#254936] px-5 text-sm font-bold text-white hover:bg-[#1E3C2C] disabled:opacity-60" onClick={createAndAddIngredient} type="button">{creatingIngredient ? "Salvando…" : "Salvar e adicionar"}</button><button disabled={creatingIngredient} className="min-h-11 rounded-full border border-[#C9D6C5] px-5 text-sm font-bold text-[#315B42] hover:bg-white disabled:opacity-60" onClick={() => { setIngredientFormOpen(false); setInlineValidationErrors({}); }} type="button">Cancelar</button></div>
            </div>
          </div>}
          {!ingredients.length && <p className="mt-4 rounded-xl bg-[#FFF9E8] p-3 text-sm text-[#66552D]">O catálogo ainda não tem ingredientes. Cadastre um ingrediente aqui para vinculá-lo à receita.</p>}
          <div className="mt-4 space-y-3">{recipe.ingredients.map((entry, index) => <div key={`${entry.ingredient_id}-${index}`} className="grid gap-3 rounded-xl bg-[#F7F5EF] p-3 sm:grid-cols-2 lg:grid-cols-6">
            <Field label="Ingrediente" fieldName="ingredientes" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})} className="lg:col-span-2"><select required value={entry.ingredient_id} onChange={(event) => {
              const selected = ingredients.find((item) => item.id === event.target.value);
              setRecipe((current) => ({ ...current, ingredients: current.ingredients.map((item, position) => position === index ? { ...item, ingredient_id: event.target.value, unit_code: item.unit_code || selected?.default_unit || "" } : item) }));
            }} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3"><option value="">Selecione</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.ingredient_translations?.find((translation) => translation.language_code === "pt-BR")?.name || item.ingredient_key}</option>)}</select></Field>
            <Field label="Quantidade" fieldName="quantidade" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input type="number" min="0.001" step="0.001" value={entry.quantity} onChange={(event) => updateIngredient(index, "quantity", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Ou quantidade textual" fieldName="quantidade" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input maxLength={80} value={entry.quantity_text} onChange={(event) => updateIngredient(index, "quantity_text", event.target.value)} placeholder="Ex.: a gosto" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <Field label="Unidade" fieldName="unidade" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})}><input maxLength={40} value={entry.unit_code} onChange={(event) => updateIngredient(index, "unit_code", event.target.value)} placeholder="g, ml, unidade" className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
            <div className="flex items-end"><button className="min-h-11 w-full rounded-xl border border-[#E7C7BB] px-3 text-sm font-bold text-[#9B4B34] hover:bg-[#FFF1EA]" onClick={() => updateRecipe("ingredients", recipe.ingredients.filter((_, position) => position !== index))} type="button">Remover</button></div>
            <Field label="Observação de preparo" fieldName="observação" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})} className="sm:col-span-2 lg:col-span-6"><input maxLength={300} value={entry.preparation_note} onChange={(event) => updateIngredient(index, "preparation_note", event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#DCE5D8] bg-white px-3" /></Field>
          </div>)}</div>
        </section>

        <RecipeImageUpload
          selectedFile={imageFile}
          previewUrl={imagePreview}
          savedImageUrl={recipe.image_url}
          hasSavedImage={Boolean(recipe.image_path)}
          removalPending={removeImage}
          onSelectFile={(file) => { setImageFile(file); setRemoveImage(false); }}
          onRemoveSelected={() => setImageFile(null)}
          onRemoveSaved={() => { setRemoveImage(true); setImageFile(null); }}
          onRestoreSaved={() => setRemoveImage(false)}
        />

        <div className="flex flex-wrap gap-3"><button disabled={saving} className="min-h-12 rounded-full bg-[#254936] px-6 text-sm font-bold text-white hover:bg-[#1E3C2C] disabled:opacity-60" type="submit">{saving ? "Salvando…" : "Salvar receita"}</button><Link className="inline-flex min-h-12 items-center rounded-full border border-[#C9D6C5] px-5 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" href="/admin/recipes">Cancelar</Link></div>
      </form>
    </section>
  );
}
