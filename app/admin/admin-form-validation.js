export function validateNativeFields(form, { includeInline = false } = {}) {
  const errors = {};
  const controls = [...form.querySelectorAll("input, select, textarea")].filter((control) => includeInline || !control.closest('[data-validation-scope="inline"]'));
  for (const control of controls) {
    if (!control.willValidate || control.validity.valid) continue;
    const key = control.dataset.validationField || control.name || control.id;
    if (!key) continue;
    let message = "Revise este campo.";
    if (control.validity.valueMissing) message = "Este campo é obrigatório.";
    else if (control.validity.patternMismatch) message = "Use o formato indicado.";
    else if (control.validity.rangeUnderflow || control.validity.rangeOverflow) message = "Informe um valor dentro do intervalo permitido.";
    else if (control.validity.typeMismatch || control.validity.stepMismatch || control.validity.badInput) message = "Informe um valor válido.";
    errors[key] = message;
  }
  return errors;
}

export function focusFirstInvalidField(form, errors = {}, { includeInline = false } = {}) {
  const keys = new Set(Object.keys(errors));
  const control = [...form.querySelectorAll("input, select, textarea")].filter((field) => includeInline || !field.closest('[data-validation-scope="inline"]')).find((field) =>
    keys.has(field.dataset.validationField || field.name || field.id) || !field.validity.valid
  );
  if (!control) return;
  control.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => control.focus({ preventScroll: true }), 250);
}

export function errorsFromResponse(fields) {
  return Array.isArray(fields) ? fields.reduce((result, entry) => {
    if (entry?.field && entry?.message && !result[entry.field]) result[entry.field] = entry.message;
    return result;
  }, {}) : {};
}
