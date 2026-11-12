BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(43);

-- Verify grants separately from row policies. service_role is deliberately
-- privileged and BYPASSRLS; it must remain server-only and never reach the app.
SELECT extensions.ok(
    NOT EXISTS (
        SELECT 1
        FROM (VALUES ('public.recipes'), ('public.recipe_translations'), ('public.ingredients'), ('public.ingredient_translations'), ('public.recipe_ingredients')) AS t(name)
        WHERE has_table_privilege('anon', name, 'INSERT')
           OR has_table_privilege('anon', name, 'UPDATE')
           OR has_table_privilege('anon', name, 'DELETE')
    ),
    'anon has no editorial write grants'
);
SELECT extensions.ok(
    NOT EXISTS (
        SELECT 1
        FROM (VALUES ('public.recipes'), ('public.recipe_translations'), ('public.ingredients'), ('public.ingredient_translations'), ('public.recipe_ingredients')) AS t(name)
        WHERE NOT has_table_privilege('authenticated', name, 'INSERT')
           OR NOT has_table_privilege('authenticated', name, 'UPDATE')
           OR NOT has_table_privilege('authenticated', name, 'DELETE')
    ),
    'authenticated has DML grants needed for RLS-protected admin operations'
);
SELECT extensions.ok(
    NOT EXISTS (
        SELECT 1
        FROM (VALUES ('public.recipes'), ('public.recipe_translations'), ('public.ingredients'), ('public.ingredient_translations'), ('public.recipe_ingredients')), ('storage.objects') AS t(name)
        WHERE NOT has_table_privilege('service_role', name, 'SELECT')
           OR NOT has_table_privilege('service_role', name, 'INSERT')
           OR NOT has_table_privilege('service_role', name, 'UPDATE')
           OR NOT has_table_privilege('service_role', name, 'DELETE')
           OR NOT has_table_privilege('service_role', name, 'TRUNCATE')
           OR NOT has_table_privilege('service_role', name, 'REFERENCES')
           OR NOT has_table_privilege('service_role', name, 'TRIGGER')
    ),
    'service_role retains its expected full table privileges'
);
SELECT extensions.ok(
    (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'service_role'),
    'service_role retains BYPASSRLS and must remain secret'
);

-- Exercise policies using Supabase's request claim setting, without creating
-- permanent users or rows. All fixture changes are rolled back at the end.
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'),
    0,
    'anon cannot read a draft recipe'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipes (id, category, prep_time_minutes, status)
      VALUES ('00000000-0000-4000-8000-000000000001', 'lunch', 20, 'draft')$$,
    '42501', NULL, 'anon cannot write recipes'
);
SELECT extensions.ok(
    NOT EXISTS (
        SELECT 1 FROM (VALUES ('public.recipes'), ('public.recipe_translations'), ('public.ingredients'), ('public.ingredient_translations'), ('public.recipe_ingredients')) AS t(name)
        WHERE has_table_privilege(current_user, name, 'TRUNCATE')
           OR has_table_privilege(current_user, name, 'REFERENCES')
           OR has_table_privilege(current_user, name, 'TRIGGER')
    ),
    'anon has no TRUNCATE, REFERENCES, or TRIGGER privilege on editorial tables'
);
SELECT extensions.throws_ok(
    $$INSERT INTO storage.objects (id, bucket_id, name)
      VALUES ('00000000-0000-4000-8000-000000000003', 'recipe-images', '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg')$$,
    '42501', NULL, 'anon cannot upload recipe images'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","user_metadata":{"role":"admin"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipes (id, category, prep_time_minutes, status)
      VALUES ('00000000-0000-4000-8000-000000000004', 'lunch', 20, 'draft')$$,
    '42501', NULL, 'a user_metadata role cannot grant administrative access'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"user"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'),
    0,
    'a signed-in non-admin cannot read a draft recipe'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipes (id, category, prep_time_minutes, status)
      VALUES ('00000000-0000-4000-8000-000000000001', 'lunch', 20, 'draft')$$,
    '42501', NULL, 'a signed-in non-admin cannot write recipes'
);
SELECT extensions.ok(
    NOT EXISTS (
        SELECT 1 FROM (VALUES ('public.recipes'), ('public.recipe_translations'), ('public.ingredients'), ('public.ingredient_translations'), ('public.recipe_ingredients')) AS t(name)
        WHERE has_table_privilege(current_user, name, 'TRUNCATE')
           OR has_table_privilege(current_user, name, 'REFERENCES')
           OR has_table_privilege(current_user, name, 'TRIGGER')
    ),
    'authenticated has no TRUNCATE, REFERENCES, or TRIGGER privilege on editorial tables'
);
SELECT extensions.throws_ok(
    $$INSERT INTO storage.objects (id, bucket_id, name)
      VALUES ('00000000-0000-4000-8000-000000000003', 'recipe-images', '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg')$$,
    '42501', NULL, 'a signed-in non-admin cannot upload recipe images'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"admin"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.lives_ok(
    $$INSERT INTO public.recipes (id, category, prep_time_minutes, servings, difficulty, status)
      VALUES ('00000000-0000-4000-8000-000000000001', 'lunch', 20, 2, 'easy', 'draft')$$,
    'an administrator can create a recipe'
);
SELECT extensions.lives_ok(
    $$INSERT INTO public.recipe_translations (recipe_id, language_code, slug, title, instructions)
      VALUES ('00000000-0000-4000-8000-000000000001', 'pt-BR', 'rls-receita-teste', 'Receita de teste', '["Preparar"]'::JSONB),
             ('00000000-0000-4000-8000-000000000001', 'en', 'rls-recipe-test', 'Test recipe', '["Prepare"]'::JSONB)$$,
    'an administrator can create both recipe translations'
);
SELECT extensions.lives_ok(
    $$INSERT INTO public.ingredients (id, ingredient_key, default_unit)
      VALUES ('00000000-0000-4000-8000-000000000002', 'rls-test-ingredient', 'g')$$,
    'an administrator can create an ingredient'
);
SELECT extensions.lives_ok(
    $$INSERT INTO public.ingredient_translations (ingredient_id, language_code, name)
      VALUES ('00000000-0000-4000-8000-000000000002', 'pt-BR', 'Ingrediente de teste'),
             ('00000000-0000-4000-8000-000000000002', 'en', 'Test ingredient')$$,
    'an administrator can create ingredient translations'
);
SELECT extensions.lives_ok(
    $$INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, display_order)
      VALUES ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 1, 'g', 0)$$,
    'an administrator can link an ingredient to a recipe'
);
SELECT extensions.lives_ok(
    $$UPDATE public.recipes SET status = 'published' WHERE id = '00000000-0000-4000-8000-000000000001'$$,
    'an administrator can publish a recipe'
);
SELECT extensions.lives_ok(
    $$INSERT INTO storage.objects (id, bucket_id, name)
      VALUES ('00000000-0000-4000-8000-000000000003', 'recipe-images', '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg')$$,
    'an administrator can upload a recipe image'
);
SELECT extensions.lives_ok(
    $$SELECT public.admin_set_recipe_image('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg')$$,
    'an administrator can associate the uploaded image with a recipe'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'),
    1,
    'anon can read the published recipe'
);
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM storage.objects WHERE bucket_id = 'recipe-images' AND name = '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg'),
    1,
    'anon can read an image attached to a published recipe'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.ingredients (ingredient_key) VALUES ('anon-forbidden-ingredient')$$,
    '42501', NULL, 'anon cannot create ingredients'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipe_translations (recipe_id, language_code, slug, title) VALUES ('00000000-0000-4000-8000-000000000001', 'fr', 'anon-forbidden-translation', 'Forbidden')$$,
    '42501', NULL, 'anon cannot create recipe translations'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.ingredient_translations (ingredient_id, language_code, name) VALUES ('00000000-0000-4000-8000-000000000002', 'fr', 'Forbidden')$$,
    '42501', NULL, 'anon cannot create ingredient translations'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, display_order) VALUES ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 2, 1)$$,
    '42501', NULL, 'anon cannot link ingredients to recipes'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","user_metadata":{"role":"admin"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipes (id, category, prep_time_minutes, status)
      VALUES ('00000000-0000-4000-8000-000000000004', 'lunch', 20, 'draft')$$,
    '42501', NULL, 'a user_metadata role cannot grant administrative access'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"user"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(
    $$DELETE FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'$$,
    '42501', NULL, 'a signed-in non-admin cannot delete a published recipe'
);
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM storage.objects WHERE bucket_id = 'recipe-images' AND name = '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg'),
    1,
    'a signed-in non-admin can read the published recipe image'
);
SELECT extensions.throws_ok(
    $$DELETE FROM storage.objects WHERE id = '00000000-0000-4000-8000-000000000003'$$,
    '42501', NULL, 'a signed-in non-admin cannot delete a recipe image'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.ingredients (ingredient_key) VALUES ('user-forbidden-ingredient')$$,
    '42501', NULL, 'a signed-in non-admin cannot create ingredients'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipe_translations (recipe_id, language_code, slug, title) VALUES ('00000000-0000-4000-8000-000000000001', 'fr', 'user-forbidden-translation', 'Forbidden')$$,
    '42501', NULL, 'a signed-in non-admin cannot create recipe translations'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.ingredient_translations (ingredient_id, language_code, name) VALUES ('00000000-0000-4000-8000-000000000002', 'fr', 'Forbidden')$$,
    '42501', NULL, 'a signed-in non-admin cannot create ingredient translations'
);
SELECT extensions.throws_ok(
    $$INSERT INTO public.recipe_ingredients (recipe_id, ingredient_id, quantity, display_order) VALUES ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 2, 1)$$,
    '42501', NULL, 'a signed-in non-admin cannot link ingredients to recipes'
);
SELECT extensions.is(
    (WITH changed AS (UPDATE public.recipes SET status = 'draft' WHERE id = '00000000-0000-4000-8000-000000000001' RETURNING id) SELECT count(*)::INTEGER FROM changed),
    0,
    'a signed-in non-admin cannot unpublish a recipe'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"admin"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.lives_ok(
    $$UPDATE public.recipe_translations SET title = 'Título revisado' WHERE recipe_id = '00000000-0000-4000-8000-000000000001' AND language_code = 'pt-BR'$$,
    'an administrator can edit a recipe translation'
);
SELECT extensions.lives_ok(
    $$UPDATE public.recipes SET status = 'draft' WHERE id = '00000000-0000-4000-8000-000000000001'$$,
    'an administrator can unpublish a recipe'
);
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM storage.objects WHERE bucket_id = 'recipe-images' AND name = '00000000-0000-4000-8000-000000000001/0123456789abcdef0123456789abcdef.jpg'),
    0,
    'anon loses access to the image after the recipe is unpublished'
);
RESET ROLE;
SELECT set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"admin"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.lives_ok(
    $$SELECT public.admin_set_recipe_image('00000000-0000-4000-8000-000000000001', NULL)$$,
    'an administrator can detach a recipe image'
);
SELECT extensions.lives_ok(
    $$DELETE FROM storage.objects WHERE id = '00000000-0000-4000-8000-000000000003'$$,
    'an administrator can delete a recipe image'
);
SELECT extensions.lives_ok(
    $$DELETE FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'$$,
    'an administrator can delete a recipe'
);
SELECT extensions.lives_ok(
    $$DELETE FROM public.ingredients WHERE id = '00000000-0000-4000-8000-000000000002'$$,
    'an administrator can delete an unlinked ingredient'
);
RESET ROLE;

SELECT * FROM extensions.finish();
ROLLBACK;
