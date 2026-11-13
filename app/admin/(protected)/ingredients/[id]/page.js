import { Suspense } from "react";
import IngredientEditor from "../../../ingredient-editor";
import AdminEditorLoading from "../../../admin-editor-loading";

export const metadata = { title: "Editar ingrediente | WhatToEat Administração", robots: { index: false, follow: false } };

async function EditIngredientContent({ params }) {
  const { id } = await params;
  return <IngredientEditor ingredientId={id} />;
}

export default function EditIngredientPage({ params }) {
  return (
    <Suspense fallback={<AdminEditorLoading message="Carregando ingrediente…" />}>
      <EditIngredientContent params={params} />
    </Suspense>
  );
}
