import { createPublicRecipeCatalogGetHandler } from "@/lib/api/public-recipe-catalog.mjs";
import { listPublishedRecipes } from "@/services/recipes";

export const GET = createPublicRecipeCatalogGetHandler({ listPublishedRecipes });
