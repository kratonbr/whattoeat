const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value, limit) => typeof value === "string" && value.trim().length <= limit ? value.trim() : null;
const issue = (field, message) => ({ field, message });
const LOCALES = ["pt-BR", "en"];

export function validateIngredientPayload(value) {
  if (!isObject(value)) return { data: null, errors: [issue("formulário", "Revise os dados informados.")] };
  const errors = [];
  const ingredientKey = text(value.ingredient_key, 100);
  const defaultUnit = value.default_unit ? text(value.default_unit, 40) : null;
  const translations = [];
  if (!ingredientKey || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(ingredientKey)) errors.push(issue("identificador", "Use letras, números e hífens."));
  if (value.default_unit && !defaultUnit) errors.push(issue("unidade padrão", "A unidade excede o limite permitido."));
  if (!Array.isArray(value.translations)) errors.push(issue("traduções", "Informe as traduções do ingrediente."));
  else {
    const seen = new Set();
    for (const entry of value.translations) {
      if (!isObject(entry) || !LOCALES.includes(entry.language_code) || seen.has(entry.language_code)) {
        errors.push(issue("traduções", "Há um idioma inválido ou duplicado."));
        continue;
      }
      seen.add(entry.language_code);
      const name = text(entry.name, 120);
      if (!name) errors.push(issue(`nome ${entry.language_code}`, "Preencha o nome ou remova esta tradução."));
      else translations.push({ language_code: entry.language_code, name });
    }
  }
  if (!translations.length) errors.push(issue("traduções", "Informe ao menos uma tradução."));
  return { data: errors.length ? null : { ingredient_key: ingredientKey.toLowerCase(), default_unit: defaultUnit, translations }, errors };
}
