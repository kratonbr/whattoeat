"use client";

export const INGREDIENT_LOCALES = [
  { code: "pt-BR", label: "Português brasileiro" },
  { code: "en", label: "Inglês" },
];

export function createIngredientFormValue() {
  return {
    ingredient_key: "",
    default_unit: "",
    translations: INGREDIENT_LOCALES.map(({ code }) => ({ language_code: code, name: "" })),
  };
}

export default function IngredientFormFields({ value, onChange, idPrefix = "ingredient", validationErrors = {}, onFieldChange }) {
  function errorId(field) {
    return `${idPrefix}-error-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  }

  function controlClass(field) {
    return `mt-1 min-h-11 w-full rounded-xl border bg-white px-3 ${validationErrors[field] ? "border-red-500 ring-2 ring-red-100" : "border-[#DCE5D8]"}`;
  }

  function fieldMessage(field) {
    return validationErrors[field] ? <span id={errorId(field)} className="mt-1 block text-sm font-medium text-red-700">{validationErrors[field]}</span> : null;
  }

  function updateField(field, fieldValue) {
    onChange((current) => ({ ...current, [field]: fieldValue }));
  }

  function updateTranslation(index, name) {
    onChange((current) => ({
      ...current,
      translations: current.translations.map((entry, position) => position === index ? { ...entry, name } : entry),
    }));
  }

  return (
    <>
      <div className="grid gap-4 rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5 sm:grid-cols-2">
        <label htmlFor={`${idPrefix}-key`} className="text-sm font-semibold text-[#405447]">
          Identificador único
          <input id={`${idPrefix}-key`} data-validation-field="identificador" aria-invalid={Boolean(validationErrors.identificador)} aria-describedby={validationErrors.identificador ? errorId("identificador") : undefined} required maxLength={100} pattern="[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*" value={value.ingredient_key} onChange={(event) => { onFieldChange?.(); updateField("ingredient_key", event.target.value); }} placeholder="ex.: brown-rice" className={controlClass("identificador")} />
          {fieldMessage("identificador")}
          <span className="mt-1 block text-xs font-normal text-[#788579]">Use letras sem acento, números e hífens.</span>
        </label>
        <label htmlFor={`${idPrefix}-unit`} className="text-sm font-semibold text-[#405447]">
          Unidade padrão (opcional)
          <input id={`${idPrefix}-unit`} data-validation-field="unidade padrão" aria-invalid={Boolean(validationErrors["unidade padrão"])} aria-describedby={validationErrors["unidade padrão"] ? errorId("unidade padrão") : undefined} maxLength={40} value={value.default_unit} onChange={(event) => { onFieldChange?.(); updateField("default_unit", event.target.value); }} placeholder="g, ml, unidade" className={controlClass("unidade padrão")} />
          {fieldMessage("unidade padrão")}
        </label>
      </div>
      {value.translations.map((entry, index) => {
        const locale = INGREDIENT_LOCALES.find(({ code }) => code === entry.language_code);
        return (
          <section key={entry.language_code} className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5">
            <h3 className="text-base font-extrabold">Nome em {locale?.label}</h3>
            <label htmlFor={`${idPrefix}-name-${entry.language_code}`} className="mt-4 block text-sm font-semibold text-[#405447]">
              Nome
              <input id={`${idPrefix}-name-${entry.language_code}`} data-validation-field={`nome ${entry.language_code}`} aria-invalid={Boolean(validationErrors[`nome ${entry.language_code}`])} aria-describedby={validationErrors[`nome ${entry.language_code}`] ? errorId(`nome ${entry.language_code}`) : undefined} maxLength={120} value={entry.name} onChange={(event) => { onFieldChange?.(); updateTranslation(index, event.target.value); }} className={controlClass(`nome ${entry.language_code}`)} />
              {fieldMessage(`nome ${entry.language_code}`)}
            </label>
          </section>
        );
      })}
      <p className="text-xs text-[#788579]">Informe pelo menos um nome. Você pode preencher os dois idiomas.</p>
    </>
  );
}
