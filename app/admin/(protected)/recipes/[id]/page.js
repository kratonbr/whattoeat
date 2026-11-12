import RecipeEditor from "../../../recipe-editor";

export const metadata = { title: "Editar receita | WhatToEat Administração", robots: { index: false, follow: false } };

export default async function EditRecipePage({ params }) {
  const { id } = await params;
  return <RecipeEditor recipeId={id} />;
}
