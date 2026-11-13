import { Suspense } from "react";
import RecipeEditor from "../../../recipe-editor";
import AdminEditorLoading from "../../../admin-editor-loading";

export const metadata = { title: "Editar receita | WhatToEat Administração", robots: { index: false, follow: false } };

async function EditRecipeContent({ params, searchParams }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const focusTranslation = typeof query.focusTranslation === "string" ? query.focusTranslation : null;
  const focusField = typeof query.focusField === "string" ? query.focusField : null;
  return <RecipeEditor recipeId={id} focusTranslation={focusTranslation} focusField={focusField} />;
}

export default function EditRecipePage(props) {
  return (
    <Suspense fallback={<AdminEditorLoading message="Carregando receita…" />}>
      <EditRecipeContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
