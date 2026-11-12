-- Baseline snapshot of the existing public schema, inspected from the remote
-- WhatToEat Supabase project using read-only catalog queries.
-- This file is for version control and fresh/local databases. Do not apply it
-- to the existing remote project while these objects already exist.

CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    image_path TEXT,
    prep_time_minutes INTEGER NOT NULL,
    servings INTEGER NOT NULL DEFAULT 2,
    difficulty TEXT NOT NULL DEFAULT 'easy',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recipes_category_check
        CHECK (category = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text, 'dessert'::text])),
    CONSTRAINT recipes_prep_time_minutes_check
        CHECK (prep_time_minutes > 0),
    CONSTRAINT recipes_servings_check
        CHECK (servings > 0),
    CONSTRAINT recipes_difficulty_check
        CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
    CONSTRAINT recipes_status_check
        CHECK (status = ANY (ARRAY['draft'::text, 'published'::text]))
);

CREATE TABLE public.recipe_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL,
    language_code TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_alt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT recipe_translations_recipe_id_fkey
        FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE,
    CONSTRAINT recipe_translations_recipe_id_language_code_key
        UNIQUE (recipe_id, language_code),
    CONSTRAINT recipe_translations_language_code_slug_key
        UNIQUE (language_code, slug),
    CONSTRAINT recipe_translations_instructions_check
        CHECK (jsonb_typeof(instructions) = 'array')
);

CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_key TEXT NOT NULL,
    default_unit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ingredients_ingredient_key_key UNIQUE (ingredient_key)
);

CREATE TABLE public.ingredient_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID NOT NULL,
    language_code TEXT NOT NULL,
    name TEXT NOT NULL,
    CONSTRAINT ingredient_translations_ingredient_id_fkey
        FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE CASCADE,
    CONSTRAINT ingredient_translations_ingredient_id_language_code_key
        UNIQUE (ingredient_id, language_code)
);

CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    quantity NUMERIC(10, 3),
    quantity_text TEXT,
    unit_code TEXT,
    preparation_note TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT recipe_ingredients_recipe_id_fkey
        FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE CASCADE,
    CONSTRAINT recipe_ingredients_ingredient_id_fkey
        FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    CONSTRAINT recipe_ingredients_quantity_check
        CHECK (quantity IS NULL OR quantity > 0::numeric),
    CONSTRAINT recipe_ingredients_check
        CHECK (quantity IS NOT NULL OR quantity_text IS NOT NULL),
    CONSTRAINT recipe_ingredients_recipe_id_ingredient_id_key
        UNIQUE (recipe_id, ingredient_id)
);

-- Additional non-constraint indexes present in the inspected database.
-- Primary key and UNIQUE constraint indexes are created with their constraints.
CREATE INDEX idx_recipes_category_status
    ON public.recipes USING btree (category, status);
CREATE INDEX idx_recipe_translations_recipe_language
    ON public.recipe_translations USING btree (recipe_id, language_code);
CREATE INDEX idx_recipe_ingredients_recipe
    ON public.recipe_ingredients USING btree (recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient
    ON public.recipe_ingredients USING btree (ingredient_id);

CREATE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published recipes"
ON public.recipes
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (status = 'published'::text);

CREATE POLICY "Public can read published recipe translations"
ON public.recipe_translations
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.recipes
        WHERE recipes.id = recipe_translations.recipe_id
          AND recipes.status = 'published'::text
    )
);

CREATE POLICY "Public can read ingredients of published recipes"
ON public.ingredients
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.recipe_ingredients AS ri
        JOIN public.recipes AS r ON r.id = ri.recipe_id
        WHERE ri.ingredient_id = ingredients.id
          AND r.status = 'published'::text
    )
);

CREATE POLICY "Public can read published ingredient translations"
ON public.ingredient_translations
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.recipe_ingredients AS ri
        JOIN public.recipes AS r ON r.id = ri.recipe_id
        WHERE ri.ingredient_id = ingredient_translations.ingredient_id
          AND r.status = 'published'::text
    )
);

CREATE POLICY "Public can read ingredients of published recipes"
ON public.recipe_ingredients
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.recipes
        WHERE recipes.id = recipe_ingredients.recipe_id
          AND recipes.status = 'published'::text
    )
);

-- Inspected grants: Supabase roles have ALL table privileges; RLS policies
-- still restrict anon/authenticated access to SELECT on published relations.
GRANT USAGE, CREATE ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON TABLE public.recipes TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.recipe_translations TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.ingredients TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.ingredient_translations TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.recipe_ingredients TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.update_updated_at() TO PUBLIC, anon, authenticated, service_role;