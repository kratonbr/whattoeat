import { createRecipeDetailsGetHandler } from "@/lib/api/recipe-details.mjs";
import { getPublishedRecipeBySlug } from "@/services/recipes";

export const GET = createRecipeDetailsGetHandler({ getPublishedRecipeBySlug });
