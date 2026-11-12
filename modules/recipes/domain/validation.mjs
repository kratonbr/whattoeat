export const RECIPE_CATEGORIES = Object.freeze(["breakfast", "lunch", "dinner", "snack", "dessert"]);
export const RECIPE_DIFFICULTIES = Object.freeze(["easy", "medium", "hard"]);
export const RECIPE_STATUSES = Object.freeze(["draft", "published"]);
export const RECIPE_LOCALES = Object.freeze(["pt-BR", "en"]);

const isObject = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value, limit) => typeof value === "string" && value.trim().length <= limit ? value.trim() : null;
const issue = (field, message) => ({ field, message });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRecipePayload(value) {
  const errors = [];
  if (!isObject(value)) return { data: null, errors: [issue("formulário", "Revise os dados informados.")] };
  const category = value.category;
  const difficulty = value.difficulty || "easy";
  const status = value.status || "draft";
  const prepTime = Number(value.prep_time_minutes);
  const servings = Number(value.servings);
  if (!RECIPE_CATEGORIES.includes(category)) errors.push(issue("categoria", "Selecione uma categoria válida."));
  if (!Number.isInteger(prepTime) || prepTime < 1 || prepTime > 1440) errors.push(issue("tempo de preparo", "Informe um tempo entre 1 e 1.440 minutos."));
  if (!Number.isInteger(servings) || servings < 1 || servings > 100) errors.push(issue("porções", "Informe entre 1 e 100 porções."));
  if (!RECIPE_DIFFICULTIES.includes(difficulty)) errors.push(issue("dificuldade", "Selecione uma dificuldade válida."));
  if (!RECIPE_STATUSES.includes(status)) errors.push(issue("status", "Selecione um status válido."));

  const translations = [];
  if (!Array.isArray(value.translations)) errors.push(issue("traduções", "Informe as traduções da receita."));
  else {
    const seen = new Set();
    for (const entry of value.translations) {
      if (!isObject(entry) || !RECIPE_LOCALES.includes(entry.language_code) || seen.has(entry.language_code)) {
        errors.push(issue("traduções", "Há um idioma inválido ou duplicado."));
        continue;
      }
      seen.add(entry.language_code);
      const slug = text(entry.slug, 180);
      const title = text(entry.title, 180);
      const description = entry.description ? text(entry.description, 3000) : null;
      const imageAlt = entry.image_alt ? text(entry.image_alt, 300) : null;
      const rawInstructions = entry.instructions ?? [];
      const instructions = Array.isArray(rawInstructions) ? rawInstructions.map((step) => text(step, 1000)).filter(Boolean) : null;
      if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push(issue(`slug ${entry.language_code}`, "Use letras minúsculas, números e hífens."));
      if (!title) errors.push(issue(`título ${entry.language_code}`, "Preencha o título ou remova esta tradução do rascunho."));
      if (description === null && entry.description) errors.push(issue(`descrição ${entry.language_code}`, "A descrição excede o limite permitido."));
      if (imageAlt === null && entry.image_alt) errors.push(issue(`texto alternativo ${entry.language_code}`, "O texto alternativo excede o limite permitido."));
      if (!instructions || instructions.length !== rawInstructions.length) errors.push(issue(`instruções ${entry.language_code}`, "Cada etapa deve conter até 1.000 caracteres."));
      translations.push({ language_code: entry.language_code, slug, title, description, image_alt: imageAlt, instructions: instructions ?? [] });
    }
  }

  const ingredients = [];
  if (!Array.isArray(value.ingredients)) errors.push(issue("ingredientes", "Informe os ingredientes da receita."));
  else {
    const seen = new Set();
    for (const row of value.ingredients) {
      if (!isObject(row) || typeof row.ingredient_id !== "string" || !UUID.test(row.ingredient_id) || seen.has(row.ingredient_id)) {
        errors.push(issue("ingredientes", "Selecione ingredientes válidos sem duplicação."));
        continue;
      }
      seen.add(row.ingredient_id);
      const quantity = row.quantity === "" || row.quantity === null || row.quantity === undefined ? null : Number(row.quantity);
      const quantityText = row.quantity_text ? text(row.quantity_text, 80) : null;
      const unitCode = row.unit_code ? text(row.unit_code, 40) : null;
      const preparationNote = row.preparation_note ? text(row.preparation_note, 300) : null;
      if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0 || quantity > 9999999.999)) errors.push(issue("quantidade", "Informe uma quantidade maior que zero."));
      if (quantityText === null && row.quantity_text) errors.push(issue("quantidade", "A quantidade textual excede o limite permitido."));
      if (unitCode === null && row.unit_code) errors.push(issue("unidade", "A unidade excede o limite permitido."));
      if (preparationNote === null && row.preparation_note) errors.push(issue("observação", "A observação excede o limite permitido."));
      if (quantity === null && !quantityText) errors.push(issue("quantidade", "Informe uma quantidade numérica ou textual."));
      const displayOrder = Number(row.display_order ?? ingredients.length);
      if (!Number.isInteger(displayOrder) || displayOrder < 0) errors.push(issue("ordem dos ingredientes", "A ordem informada é inválida."));
      ingredients.push({ ingredient_id: row.ingredient_id, quantity, quantity_text: quantityText, unit_code: unitCode, preparation_note: preparationNote, display_order: displayOrder });
    }
  }

  if (status === "published") {
    for (const locale of RECIPE_LOCALES) {
      const translation = translations.find((entry) => entry.language_code === locale);
      if (!translation || !translation.instructions.length) errors.push(issue(`tradução ${locale}`, "Para publicar, complete título, slug e modo de preparo em português e inglês."));
    }
    if (!ingredients.length) errors.push(issue("ingredientes", "Adicione ao menos um ingrediente antes de publicar."));
  }
  return { data: errors.length ? null : { recipe: { category, prep_time_minutes: prepTime, servings, difficulty, status }, translations, ingredients }, errors };
}

export function validateRecipeListQuery(params) {
  const page = Number(params.get("page") || 1);
  const pageSize = Number(params.get("pageSize") || 20);
  const category = params.get("category") || "";
  const status = params.get("status") || "";
  const search = (params.get("q") || "").trim();
  const errors = [];
  if (!Number.isInteger(page) || page < 1) errors.push(issue("página", "A página informada é inválida."));
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) errors.push(issue("itens por página", "Use um valor entre 1 e 100."));
  if (category && !RECIPE_CATEGORIES.includes(category)) errors.push(issue("categoria", "A categoria informada é inválida."));
  if (status && !RECIPE_STATUSES.includes(status)) errors.push(issue("status", "O status informado é inválido."));
  if (search.length > 100) errors.push(issue("busca", "A busca pode ter até 100 caracteres."));
  return { data: errors.length ? null : { page, pageSize, category, status, search }, errors };
}
