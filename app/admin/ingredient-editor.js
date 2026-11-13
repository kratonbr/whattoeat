"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IngredientFormFields, { createIngredientFormValue, INGREDIENT_LOCALES } from "./ingredient-form-fields";
import { useAdminToast } from "./admin-toast-provider";
import { errorsFromResponse, focusFirstInvalidField, validateNativeFields } from "./admin-form-validation";

const ERRORS = {
  UNAUTHENTICATED: "Sua sessão expirou. Entre novamente.", ADMIN_REQUIRED: "Sua conta não tem permissão para editar ingredientes.",
  AUTH_UNAVAILABLE: "Não foi possível validar o acesso. Tente novamente.", RLS_NOT_READY: "O acesso de edição depende da configuração das políticas administrativas no banco.",
  DUPLICATE: "Já existe um ingrediente com este identificador.", VALIDATION_ERROR: "Revise os campos informados.", NOT_FOUND: "O ingrediente não foi encontrado.",
  OPERATION_UNAVAILABLE: "Não foi possível salvar o ingrediente. Tente novamente.",
};

export default function IngredientEditor({ ingredientId = null }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const formRef = useRef(null);
  const [value, setValue] = useState(createIngredientFormValue);
  const [loading, setLoading] = useState(Boolean(ingredientId));
  const [missingRecord, setMissingRecord] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

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
        setValue({ ingredient_key: ingredient.ingredient_key, default_unit: ingredient.default_unit ?? "", translations: INGREDIENT_LOCALES.map(({ code }) => ({ language_code: code, name: translations.get(code) ?? "" })) });
      })
      .catch((cause) => {
        if (!active) return;
        if (cause.code === "NOT_FOUND") setMissingRecord(true);
        else { setLoadFailed(true); showToast(ERRORS[cause.code] ?? ERRORS.OPERATION_UNAVAILABLE, "error"); }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ingredientId, showToast]);

  async function submit(event) {
    event.preventDefault();
    const nativeErrors = validateNativeFields(event.currentTarget);
    if (!value.translations.some((entry) => entry.name.trim())) nativeErrors["nome pt-BR"] = "Informe pelo menos um nome em português ou inglês.";
    if (Object.keys(nativeErrors).length) {
      setValidationErrors(nativeErrors);
      showToast("Existem campos pendentes. Revise os campos destacados.", "error");
      focusFirstInvalidField(event.currentTarget, nativeErrors);
      return;
    }
    setSaving(true); setValidationErrors({});
    try {
      const response = await fetch(ingredientId ? `/api/admin/ingredients/${ingredientId}` : "/api/admin/ingredients", {
        method: ingredientId ? "PATCH" : "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errors = errorsFromResponse(body.fields);
        setValidationErrors(errors);
        showToast(ERRORS[body.error] ?? ERRORS.OPERATION_UNAVAILABLE, "error");
        focusFirstInvalidField(formRef.current, errors);
        return;
      }
      showToast(ingredientId ? "Ingrediente atualizado com sucesso." : "Ingrediente cadastrado com sucesso.", "success");
      router.push("/admin/ingredients"); router.refresh();
    } catch { showToast(ERRORS.OPERATION_UNAVAILABLE, "error"); }
    finally { setSaving(false); }
  }

  if (loading) return <p role="status" className="rounded-2xl bg-white p-6 text-sm text-[#667469]">Carregando formulário…</p>;
  if (ingredientId && (missingRecord || loadFailed)) return <section lang="pt-BR" className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-6 sm:p-9" aria-labelledby="ingredient-unavailable-title">
    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Catálogo editorial</p>
    <h1 id="ingredient-unavailable-title" className="mt-2 text-2xl font-extrabold">{missingRecord ? "Ingrediente não encontrado" : "Não foi possível carregar o ingrediente"}</h1>
    <p className="mt-3 text-sm leading-6 text-[#667469]">{missingRecord ? "Este ingrediente não existe ou não está mais disponível." : "Ocorreu uma falha temporária ao carregar os dados. Nenhuma alteração foi feita."}</p>
    <Link href="/admin/ingredients" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/30">Voltar aos ingredientes</Link>
  </section>;

  return <section lang="pt-BR" aria-labelledby="ingredient-editor-title">
    <div className="mb-6"><Link href="/admin/ingredients" className="text-sm font-bold text-[#315B42] hover:underline">← Voltar aos ingredientes</Link><p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-[#D86F46]">Catálogo editorial</p><h1 id="ingredient-editor-title" className="mt-2 text-3xl font-extrabold tracking-tight">{ingredientId ? "Editar ingrediente" : "Cadastrar ingrediente"}</h1></div>
    <form ref={formRef} noValidate onSubmit={submit} className="space-y-5">
      <IngredientFormFields value={value} onChange={setValue} idPrefix="ingredient-editor" validationErrors={validationErrors} onFieldChange={() => setValidationErrors({})} />
      <div className="flex flex-wrap gap-3"><button disabled={saving} className="min-h-12 rounded-full bg-[#254936] px-6 text-sm font-bold text-white hover:bg-[#1E3C2C] disabled:opacity-60" type="submit">{saving ? "Salvando…" : "Salvar ingrediente"}</button><Link className="inline-flex min-h-12 items-center rounded-full border border-[#C9D6C5] px-5 text-sm font-bold text-[#315B42] hover:bg-[#E9F0E5]" href="/admin/ingredients">Cancelar</Link></div>
    </form>
  </section>;
}
