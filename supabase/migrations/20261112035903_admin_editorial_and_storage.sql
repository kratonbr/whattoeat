-- Administrative editorial access, atomic saves, and private recipe images.
-- Apply only after review. This migration has not been applied to production.

-- The baseline reflects the observed remote grants. Tighten them before
-- enabling the administrative RLS policies: RLS does not constrain TRUNCATE.
-- Also pin the existing trigger function's search_path to clear the mutable
-- search_path warning without changing its trigger behavior.
ALTER FUNCTION public.update_updated_at() SET search_path = '';

REVOKE ALL PRIVILEGES ON TABLE
    public.recipes,
    public.recipe_translations,
    public.ingredients,
    public.ingredient_translations,
    public.recipe_ingredients
FROM anon, authenticated;

-- service_role intentionally remains privileged as provisioned by Supabase.
-- It has BYPASSRLS and must never be used by this application or exposed to clients.

GRANT SELECT ON TABLE
    public.recipes,
    public.recipe_translations,
    public.ingredients,
    public.ingredient_translations,
    public.recipe_ingredients
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE
    public.recipes,
    public.recipe_translations,
    public.ingredients,
    public.ingredient_translations,
    public.recipe_ingredients
TO authenticated;

CREATE POLICY "Admins manage recipes"
ON public.recipes
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins manage recipe translations"
ON public.recipe_translations
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins manage ingredients"
ON public.ingredients
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins manage ingredient translations"
ON public.ingredient_translations
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins manage recipe ingredients"
ON public.recipe_ingredients
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE FUNCTION public.admin_save_recipe(
    p_recipe_id UUID,
    p_recipe JSONB,
    p_translations JSONB,
    p_ingredients JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_recipe_id UUID;
BEGIN
    IF (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;

    IF jsonb_typeof(p_recipe) IS DISTINCT FROM 'object'
       OR jsonb_typeof(p_translations) IS DISTINCT FROM 'array'
       OR jsonb_typeof(p_ingredients) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Invalid recipe payload' USING ERRCODE = '22023';
    END IF;

    IF p_recipe ->> 'category' NOT IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')
       OR p_recipe ->> 'difficulty' NOT IN ('easy', 'medium', 'hard')
       OR p_recipe ->> 'status' NOT IN ('draft', 'published') THEN
        RAISE EXCEPTION 'Invalid recipe fields' USING ERRCODE = '22023';
    END IF;

    IF p_recipe ->> 'status' = 'published' AND (
        NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(p_translations) AS t(value)
            WHERE t.value ->> 'language_code' = 'pt-BR'
              AND NULLIF(btrim(t.value ->> 'slug'), '') IS NOT NULL
              AND NULLIF(btrim(t.value ->> 'title'), '') IS NOT NULL
              AND jsonb_typeof(t.value -> 'instructions') = 'array'
              AND jsonb_array_length(t.value -> 'instructions') > 0
        )
        OR NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(p_translations) AS t(value)
            WHERE t.value ->> 'language_code' = 'en'
              AND NULLIF(btrim(t.value ->> 'slug'), '') IS NOT NULL
              AND NULLIF(btrim(t.value ->> 'title'), '') IS NOT NULL
              AND jsonb_typeof(t.value -> 'instructions') = 'array'
              AND jsonb_array_length(t.value -> 'instructions') > 0
        )
        OR jsonb_array_length(p_ingredients) = 0
    ) THEN
        RAISE EXCEPTION 'Published recipes require complete translations and ingredients' USING ERRCODE = '23514';
    END IF;

    IF p_recipe_id IS NULL THEN
        INSERT INTO public.recipes (category, prep_time_minutes, servings, difficulty, status)
        VALUES (
            p_recipe ->> 'category',
            (p_recipe ->> 'prep_time_minutes')::INTEGER,
            (p_recipe ->> 'servings')::INTEGER,
            p_recipe ->> 'difficulty',
            p_recipe ->> 'status'
        )
        RETURNING id INTO v_recipe_id;
    ELSE
        UPDATE public.recipes
        SET category = p_recipe ->> 'category',
            prep_time_minutes = (p_recipe ->> 'prep_time_minutes')::INTEGER,
            servings = (p_recipe ->> 'servings')::INTEGER,
            difficulty = p_recipe ->> 'difficulty',
            status = p_recipe ->> 'status'
        WHERE id = p_recipe_id
        RETURNING id INTO v_recipe_id;

        IF v_recipe_id IS NULL THEN
            RAISE EXCEPTION 'Recipe not found' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    DELETE FROM public.recipe_translations WHERE recipe_id = v_recipe_id;
    INSERT INTO public.recipe_translations (
        recipe_id, language_code, slug, title, description, instructions, image_alt
    )
    SELECT
        v_recipe_id,
        value ->> 'language_code',
        btrim(value ->> 'slug'),
        btrim(value ->> 'title'),
        NULLIF(btrim(value ->> 'description'), ''),
        COALESCE(value -> 'instructions', '[]'::JSONB),
        NULLIF(btrim(value ->> 'image_alt'), '')
    FROM jsonb_array_elements(p_translations);

    DELETE FROM public.recipe_ingredients WHERE recipe_id = v_recipe_id;
    INSERT INTO public.recipe_ingredients (
        recipe_id, ingredient_id, quantity, quantity_text, unit_code, preparation_note, display_order
    )
    SELECT
        v_recipe_id,
        (value ->> 'ingredient_id')::UUID,
        NULLIF(value ->> 'quantity', '')::NUMERIC(10, 3),
        NULLIF(btrim(value ->> 'quantity_text'), ''),
        NULLIF(btrim(value ->> 'unit_code'), ''),
        NULLIF(btrim(value ->> 'preparation_note'), ''),
        (value ->> 'display_order')::INTEGER
    FROM jsonb_array_elements(p_ingredients);

    RETURN v_recipe_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_save_recipe(UUID, JSONB, JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_recipe(UUID, JSONB, JSONB, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_save_ingredient(
    p_ingredient_id UUID,
    p_ingredient_key TEXT,
    p_default_unit TEXT,
    p_translations JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_ingredient_id UUID;
BEGIN
    IF (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;
    IF jsonb_typeof(p_translations) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Invalid ingredient translations' USING ERRCODE = '22023';
    END IF;

    IF p_ingredient_id IS NULL THEN
        INSERT INTO public.ingredients (ingredient_key, default_unit)
        VALUES (lower(btrim(p_ingredient_key)), NULLIF(btrim(p_default_unit), ''))
        RETURNING id INTO v_ingredient_id;
    ELSE
        UPDATE public.ingredients
        SET ingredient_key = lower(btrim(p_ingredient_key)),
            default_unit = NULLIF(btrim(p_default_unit), '')
        WHERE id = p_ingredient_id
        RETURNING id INTO v_ingredient_id;

        IF v_ingredient_id IS NULL THEN
            RAISE EXCEPTION 'Ingredient not found' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    DELETE FROM public.ingredient_translations WHERE ingredient_id = v_ingredient_id;
    INSERT INTO public.ingredient_translations (ingredient_id, language_code, name)
    SELECT v_ingredient_id, value ->> 'language_code', btrim(value ->> 'name')
    FROM jsonb_array_elements(p_translations);

    RETURN v_ingredient_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_save_ingredient(UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_ingredient(UUID, TEXT, TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_recipe_image(
    p_recipe_id UUID,
    p_image_path TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
    v_image_path TEXT;
BEGIN
    IF (SELECT auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Administrative access required' USING ERRCODE = '42501';
    END IF;

    IF p_image_path IS NOT NULL THEN
        IF p_image_path !~ ('^' || p_recipe_id::TEXT || '/[0-9a-f-]+\.(jpg|png|webp)$') THEN
            RAISE EXCEPTION 'Invalid recipe image path' USING ERRCODE = '22023';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM storage.objects
            WHERE bucket_id = 'recipe-images' AND name = p_image_path
        ) THEN
            RAISE EXCEPTION 'Recipe image not found' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    UPDATE public.recipes
    SET image_path = p_image_path
    WHERE id = p_recipe_id
    RETURNING image_path INTO v_image_path;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recipe not found' USING ERRCODE = 'P0002';
    END IF;
    RETURN v_image_path;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_recipe_image(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_recipe_image(UUID, TEXT) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-images', 'recipe-images', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $bucket_check$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets
        WHERE id = 'recipe-images'
          AND name = 'recipe-images'
          AND public = FALSE
          AND file_size_limit = 5242880
          AND allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
    ) THEN
        RAISE EXCEPTION 'The recipe-images bucket exists with incompatible settings';
    END IF;
END;
$bucket_check$;

CREATE POLICY "Public can read images for published recipes"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (
    bucket_id = 'recipe-images'
    AND EXISTS (
        SELECT 1 FROM public.recipes
        WHERE recipes.image_path = objects.name
          AND recipes.status = 'published'
    )
);

CREATE POLICY "Admins manage recipe images"
ON storage.objects
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    bucket_id = 'recipe-images'
    AND (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    bucket_id = 'recipe-images'
    AND (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
