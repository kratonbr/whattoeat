BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT extensions.plan(12);

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
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL ROLE anon;
SELECT extensions.is(
    (SELECT count(*)::INTEGER FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'),
    1,
    'anon can read the published recipe'
);
RESET ROLE;

SELECT set_config('request.jwt.claims', '{"role":"authenticated","app_metadata":{"role":"user"}}', true);
SET LOCAL ROLE authenticated;
SELECT extensions.throws_ok(
    $$DELETE FROM public.recipes WHERE id = '00000000-0000-4000-8000-000000000001'$$,
    '42501', NULL, 'a signed-in non-admin cannot delete a published recipe'
);
RESET ROLE;

SELECT * FROM extensions.finish();
ROLLBACK;
