import IngredientEditor from "../../../ingredient-editor";

export const metadata = { title: "Editar ingrediente | WhatToEat Administração", robots: { index: false, follow: false } };

export default async function EditIngredientPage({ params }) {
  const { id } = await params;
  return <IngredientEditor ingredientId={id} />;
}
