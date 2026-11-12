import { createRandomMealGetHandler } from "@/lib/api/random-meals.mjs";
import { getPublishedRecipe } from "@/services/recipes";

export const GET = createRandomMealGetHandler({ getPublishedRecipe });