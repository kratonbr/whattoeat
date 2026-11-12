BEGIN;

-- Ingredientes base. ingredient_key identifica cada ingrediente neste seed.
INSERT INTO public.ingredients (ingredient_key, default_unit)
VALUES
    ('all_purpose_flour', 'g'),
    ('milk', 'ml'),
    ('egg', 'unit'),
    ('granulated_sugar', 'g'),
    ('baking_powder', 'g'),
    ('salt', 'g'),
    ('butter', 'g'),
    ('tomato', 'g'),
    ('black_pepper', 'g'),
    ('sliced_bread', 'slice'),
    ('chicken_breast', 'g'),
    ('rice', 'g'),
    ('onion', 'unit'),
    ('garlic', 'clove'),
    ('neutral_oil', 'ml'),
    ('water', 'ml'),
    ('pasta', 'g'),
    ('canned_tomatoes', 'g'),
    ('chickpeas', 'g'),
    ('olive_oil', 'ml'),
    ('chicken_thigh', 'g'),
    ('potato', 'g'),
    ('lime', 'unit'),
    ('paprika', 'g'),
    ('spinach', 'g'),
    ('avocado', 'unit'),
    ('banana', 'unit'),
    ('rolled_oats', 'g'),
    ('peanut_butter', 'g'),
    ('honey', 'g'),
    ('cinnamon', 'g'),
    ('apple', 'unit'),
    ('cocoa_powder', 'g')
ON CONFLICT (ingredient_key)
DO UPDATE SET default_unit = EXCLUDED.default_unit
WHERE public.ingredients.default_unit IS DISTINCT FROM EXCLUDED.default_unit;

-- Traduções dos ingredientes em português brasileiro e inglês.
INSERT INTO public.ingredient_translations (
    ingredient_id,
    language_code,
    name
)
SELECT
    ingredient.id,
    locale.language_code,
    locale.name
FROM (
    VALUES
        ('all_purpose_flour', 'farinha de trigo', 'all-purpose flour'),
        ('milk', 'leite', 'milk'),
        ('egg', 'ovo', 'egg'),
        ('granulated_sugar', 'açúcar', 'granulated sugar'),
        ('baking_powder', 'fermento químico', 'baking powder'),
        ('salt', 'sal', 'salt'),
        ('butter', 'manteiga', 'butter'),
        ('tomato', 'tomate', 'tomato'),
        ('black_pepper', 'pimenta-do-reino', 'black pepper'),
        ('sliced_bread', 'pão de forma', 'sliced bread'),
        ('chicken_breast', 'peito de frango', 'chicken breast'),
        ('rice', 'arroz', 'rice'),
        ('onion', 'cebola', 'onion'),
        ('garlic', 'alho', 'garlic'),
        ('neutral_oil', 'óleo vegetal', 'neutral oil'),
        ('water', 'água', 'water'),
        ('pasta', 'macarrão', 'pasta'),
        ('canned_tomatoes', 'tomates enlatados', 'canned tomatoes'),
        ('chickpeas', 'grão-de-bico', 'chickpeas'),
        ('olive_oil', 'azeite de oliva', 'olive oil'),
        ('chicken_thigh', 'coxa de frango', 'chicken thigh'),
        ('potato', 'batata', 'potato'),
        ('lime', 'limão', 'lime'),
        ('paprika', 'páprica', 'paprika'),
        ('spinach', 'espinafre', 'spinach'),
        ('avocado', 'abacate', 'avocado'),
        ('banana', 'banana', 'banana'),
        ('rolled_oats', 'aveia em flocos', 'rolled oats'),
        ('peanut_butter', 'pasta de amendoim', 'peanut butter'),
        ('honey', 'mel', 'honey'),
        ('cinnamon', 'canela', 'cinnamon'),
        ('apple', 'maçã', 'apple'),
        ('cocoa_powder', 'cacau em pó', 'cocoa powder')
) AS names(ingredient_key, name_pt, name_en)
JOIN public.ingredients AS ingredient
    ON ingredient.ingredient_key = names.ingredient_key
CROSS JOIN LATERAL (
    VALUES
        ('pt-BR', names.name_pt),
        ('en', names.name_en)
) AS locale(language_code, name)
ON CONFLICT (ingredient_id, language_code)
DO UPDATE SET name = EXCLUDED.name
WHERE public.ingredient_translations.name IS DISTINCT FROM EXCLUDED.name;

-- IDs fixos identificam estas receitas de demonstração em execuções futuras.
-- image_path permanece NULL: este seed não cadastra imagens.
INSERT INTO public.recipes (
    id,
    category,
    image_path,
    prep_time_minutes,
    servings,
    difficulty,
    status
)
VALUES
    ('e7ea0001-0000-4000-8000-000000000001', 'breakfast', NULL, 20, 2, 'easy', 'published'),
    ('e7ea0002-0000-4000-8000-000000000002', 'breakfast', NULL, 15, 2, 'easy', 'published'),
    ('e7ea0003-0000-4000-8000-000000000003', 'lunch',     NULL, 35, 2, 'easy', 'published'),
    ('e7ea0004-0000-4000-8000-000000000004', 'lunch',     NULL, 30, 2, 'easy', 'published'),
    ('e7ea0005-0000-4000-8000-000000000005', 'dinner',    NULL, 45, 2, 'easy', 'published'),
    ('e7ea0006-0000-4000-8000-000000000006', 'dinner',    NULL, 30, 2, 'easy', 'published'),
    ('e7ea0007-0000-4000-8000-000000000007', 'snack',     NULL, 10, 2, 'easy', 'published'),
    ('e7ea0008-0000-4000-8000-000000000008', 'snack',     NULL, 40, 2, 'easy', 'published'),
    ('e7ea0009-0000-4000-8000-000000000009', 'dessert',   NULL, 35, 2, 'easy', 'published'),
    ('e7ea0010-0000-4000-8000-000000000010', 'dessert',   NULL,  7, 1, 'easy', 'published')
ON CONFLICT (id)
DO UPDATE SET
    category = EXCLUDED.category,
    prep_time_minutes = EXCLUDED.prep_time_minutes,
    servings = EXCLUDED.servings,
    difficulty = EXCLUDED.difficulty,
    status = EXCLUDED.status
WHERE (public.recipes.category,
       public.recipes.prep_time_minutes,
       public.recipes.servings,
       public.recipes.difficulty,
       public.recipes.status)
  IS DISTINCT FROM
      (EXCLUDED.category,
       EXCLUDED.prep_time_minutes,
       EXCLUDED.servings,
       EXCLUDED.difficulty,
       EXCLUDED.status);

-- Traduções das receitas. instructions é sempre criado como array JSONB.
INSERT INTO public.recipe_translations (
    recipe_id,
    language_code,
    slug,
    title,
    description,
    instructions,
    image_alt
)
VALUES
    (
        'e7ea0001-0000-4000-8000-000000000001',
        'pt-BR',
        'panquecas-fofas',
        'Panquecas fofas',
        'Panquecas simples e macias, preparadas com ingredientes básicos.',
        jsonb_build_array(
            'Em uma tigela, misture a farinha, o açúcar, o fermento químico e o sal.',
            'Em outra tigela, bata o leite e o ovo. Acrescente a manteiga derretida e misture.',
            'Junte os ingredientes líquidos aos secos e mexa apenas até não haver farinha seca. Deixe a massa descansar por 5 minutos.',
            'Aqueça uma frigideira levemente untada em fogo médio. Coloque cerca de 60 ml de massa por panqueca. Vire quando surgirem bolhas e a borda estiver firme; cozinhe o outro lado por cerca de 1 minuto.'
        ),
        NULL
    ),
    (
        'e7ea0001-0000-4000-8000-000000000001',
        'en',
        'fluffy-pancakes',
        'Fluffy Pancakes',
        'Simple, soft pancakes made with everyday ingredients.',
        jsonb_build_array(
            'In a bowl, mix the flour, sugar, baking powder, and salt.',
            'In a second bowl, whisk the milk and egg. Add the melted butter and mix.',
            'Add the wet ingredients to the dry ingredients and stir just until no dry flour remains. Let the batter rest for 5 minutes.',
            'Heat a lightly greased skillet over medium heat. Pour about 60 ml of batter for each pancake. Flip when bubbles appear and the edges look set; cook the other side for about 1 minute.'
        ),
        NULL
    ),
    (
        'e7ea0002-0000-4000-8000-000000000002',
        'pt-BR',
        'ovos-mexidos-com-tomate',
        'Ovos mexidos com tomate',
        'Ovos macios com tomate quente, servidos com pão tostado.',
        jsonb_build_array(
            'Toste as fatias de pão e reserve.',
            'Corte o tomate em cubos pequenos. Derreta a manteiga em uma frigideira e cozinhe o tomate por 3 minutos.',
            'Bata os ovos com o sal e a pimenta-do-reino. Despeje na frigideira e cozinhe em fogo baixo, mexendo devagar, até formar pedaços macios.',
            'Sirva os ovos imediatamente com o pão tostado.'
        ),
        NULL
    ),
    (
        'e7ea0002-0000-4000-8000-000000000002',
        'en',
        'tomato-scrambled-eggs',
        'Tomato Scrambled Eggs',
        'Soft scrambled eggs with warm tomato, served with toasted bread.',
        jsonb_build_array(
            'Toast the bread slices and set them aside.',
            'Dice the tomato. Melt the butter in a skillet and cook the tomato for 3 minutes.',
            'Whisk the eggs with the salt and black pepper. Pour them into the skillet and cook over low heat, stirring gently, until soft curds form.',
            'Serve the eggs right away with the toasted bread.'
        ),
        NULL
    ),
    (
        'e7ea0003-0000-4000-8000-000000000003',
        'pt-BR',
        'tigela-de-frango-e-arroz',
        'Tigela de frango e arroz',
        'Frango em cubos cozido com arroz, tomate e temperos simples.',
        jsonb_build_array(
            'Lave o arroz. Corte o frango em cubos pequenos e tempere com parte do sal e da pimenta.',
            'Aqueça o óleo em uma panela. Doure o frango por 4 a 5 minutos, mexendo para cozinhar por igual.',
            'Acrescente a cebola, o alho e o tomate. Cozinhe por 2 minutos e misture o arroz.',
            'Adicione a água e o restante do sal e da pimenta. Tampe e cozinhe em fogo baixo por 15 a 18 minutos, até o arroz ficar macio e o frango atingir 74 °C no centro.'
        ),
        NULL
    ),
    (
        'e7ea0003-0000-4000-8000-000000000003',
        'en',
        'chicken-and-rice-bowl',
        'Chicken and Rice Bowl',
        'Diced chicken cooked with rice, tomato, and simple seasonings.',
        jsonb_build_array(
            'Rinse the rice. Cut the chicken into small cubes and season with some of the salt and pepper.',
            'Heat the oil in a pot. Brown the chicken for 4 to 5 minutes, stirring so it cooks evenly.',
            'Add the onion, garlic, and tomato. Cook for 2 minutes, then stir in the rice.',
            'Add the water and the remaining salt and pepper. Cover and simmer over low heat for 15 to 18 minutes, until the rice is tender and the chicken reaches 74 °C (165 °F) in the center.'
        ),
        NULL
    ),
    (
        'e7ea0004-0000-4000-8000-000000000004',
        'pt-BR',
        'macarrao-com-tomate-e-grao-de-bico',
        'Macarrão com tomate e grão-de-bico',
        'Macarrão envolvido em molho de tomate com grão-de-bico.',
        jsonb_build_array(
            'Ferva a água em uma panela. Cozinhe o macarrão conforme o tempo da embalagem e reserve cerca de 120 ml da água do cozimento antes de escorrer.',
            'Enquanto isso, aqueça o azeite em outra panela. Refogue a cebola e o alho por 3 minutos.',
            'Acrescente os tomates enlatados e o grão-de-bico. Cozinhe em fogo baixo por 8 minutos e tempere com sal e pimenta.',
            'Junte o macarrão ao molho. Adicione um pouco da água reservada se necessário e misture antes de servir.'
        ),
        NULL
    ),
    (
        'e7ea0004-0000-4000-8000-000000000004',
        'en',
        'tomato-and-chickpea-pasta',
        'Tomato and Chickpea Pasta',
        'Pasta tossed in a tomato sauce with chickpeas.',
        jsonb_build_array(
            'Bring the water to a boil in a pot. Cook the pasta according to the package time and reserve about 120 ml of cooking water before draining.',
            'Meanwhile, heat the olive oil in another pan. Cook the onion and garlic for 3 minutes.',
            'Add the canned tomatoes and chickpeas. Simmer for 8 minutes and season with salt and pepper.',
            'Add the pasta to the sauce. Stir in a little reserved cooking water if needed, then serve.'
        ),
        NULL
    ),
    (
        'e7ea0005-0000-4000-8000-000000000005',
        'pt-BR',
        'frango-assado-com-batatas',
        'Frango assado com batatas',
        'Coxas de frango e batatas assadas com alho, limão e páprica.',
        jsonb_build_array(
            'Preaqueça o forno a 200 °C. Corte as batatas em pedaços médios.',
            'Misture as batatas com o azeite, o alho picado, a páprica, o sal e a pimenta. Espalhe em uma assadeira e acomode o frango entre elas.',
            'Esprema meio limão sobre o frango e coloque a metade espremida na assadeira.',
            'Asse por 35 a 40 minutos, virando as batatas uma vez, até ficarem macias e o frango atingir 74 °C no centro. Deixe descansar por 5 minutos antes de servir.'
        ),
        NULL
    ),
    (
        'e7ea0005-0000-4000-8000-000000000005',
        'en',
        'roast-chicken-and-potatoes',
        'Roast Chicken and Potatoes',
        'Chicken thighs and potatoes roasted with garlic, lime, and paprika.',
        jsonb_build_array(
            'Preheat the oven to 200 °C (400 °F). Cut the potatoes into medium-sized pieces.',
            'Toss the potatoes with the olive oil, chopped garlic, paprika, salt, and pepper. Spread them in a baking dish and nestle the chicken among them.',
            'Squeeze half a lime over the chicken and place the squeezed half in the dish.',
            'Roast for 35 to 40 minutes, turning the potatoes once, until tender and the chicken reaches 74 °C (165 °F) in the center. Rest for 5 minutes before serving.'
        ),
        NULL
    ),
    (
        'e7ea0006-0000-4000-8000-000000000006',
        'pt-BR',
        'omelete-de-batata-e-espinafre',
        'Omelete de batata e espinafre',
        'Omelete de frigideira com batata cozida, cebola e espinafre.',
        jsonb_build_array(
            'Corte a batata em cubos pequenos. Ferva a água, cozinhe a batata por cerca de 8 minutos até ficar quase macia e escorra.',
            'Aqueça o azeite em uma frigideira. Cozinhe a cebola por 2 minutos, acrescente o espinafre e mexa até murchar.',
            'Bata os ovos com o leite, o sal e a pimenta. Despeje na frigideira e distribua a batata.',
            'Tampe e cozinhe em fogo baixo por 6 a 8 minutos, até a omelete firmar. Corte em duas porções e sirva.'
        ),
        NULL
    ),
    (
        'e7ea0006-0000-4000-8000-000000000006',
        'en',
        'potato-and-spinach-omelet',
        'Potato and Spinach Omelet',
        'A skillet omelet with cooked potato, onion, and spinach.',
        jsonb_build_array(
            'Dice the potato. Bring the water to a boil, cook the potato for about 8 minutes until almost tender, then drain.',
            'Heat the olive oil in a skillet. Cook the onion for 2 minutes, add the spinach, and stir until wilted.',
            'Beat the eggs with the milk, salt, and pepper. Pour them into the skillet and distribute the potato.',
            'Cover and cook over low heat for 6 to 8 minutes, until the omelet is set. Cut into two portions and serve.'
        ),
        NULL
    ),
    (
        'e7ea0007-0000-4000-8000-000000000007',
        'pt-BR',
        'torrada-de-abacate-e-tomate',
        'Torrada de abacate e tomate',
        'Pão tostado coberto com abacate temperado e tomate fresco.',
        jsonb_build_array(
            'Toste as fatias de pão.',
            'Amasse o abacate com o suco do limão e o sal.',
            'Espalhe o abacate sobre o pão. Acrescente o tomate em cubos e regue com azeite.',
            'Sirva logo após montar.'
        ),
        NULL
    ),
    (
        'e7ea0007-0000-4000-8000-000000000007',
        'en',
        'avocado-and-tomato-toast',
        'Avocado and Tomato Toast',
        'Toasted bread topped with seasoned avocado and fresh tomato.',
        jsonb_build_array(
            'Toast the bread slices.',
            'Mash the avocado with the lime juice and salt.',
            'Spread the avocado on the toast. Add diced tomato and drizzle with olive oil.',
            'Serve soon after assembling.'
        ),
        NULL
    ),
    (
        'e7ea0008-0000-4000-8000-000000000008',
        'pt-BR',
        'bolinhas-de-banana-e-aveia',
        'Bolinhas de banana e aveia',
        'Lanchinho sem forno feito com banana, aveia, pasta de amendoim e mel.',
        jsonb_build_array(
            'Amasse a banana em uma tigela até ficar cremosa.',
            'Misture a aveia, a pasta de amendoim, o mel, a canela e uma pitada de sal.',
            'Modele 8 bolinhas pequenas com as mãos úmidas.',
            'Leve à geladeira por pelo menos 30 minutos antes de servir. Mantenha refrigerado.'
        ),
        NULL
    ),
    (
        'e7ea0008-0000-4000-8000-000000000008',
        'en',
        'banana-oat-bites',
        'Banana Oat Bites',
        'A no-bake snack made with banana, oats, peanut butter, and honey.',
        jsonb_build_array(
            'Mash the banana in a bowl until smooth.',
            'Mix in the oats, peanut butter, honey, cinnamon, and a pinch of salt.',
            'Shape the mixture into 8 small bites with damp hands.',
            'Refrigerate for at least 30 minutes before serving. Keep refrigerated.'
        ),
        NULL
    ),
    (
        'e7ea0009-0000-4000-8000-000000000009',
        'pt-BR',
        'maca-assada-com-canela',
        'Maçã assada com canela',
        'Maçãs recheadas com aveia, açúcar e canela, assadas até ficarem macias.',
        jsonb_build_array(
            'Preaqueça o forno a 190 °C. Retire o miolo das maçãs sem furar o fundo.',
            'Misture a aveia, o açúcar, a manteiga, a canela e uma pitada de sal.',
            'Recheie as maçãs com a mistura e coloque-as em uma assadeira pequena.',
            'Asse por 25 a 30 minutos, até as maçãs ficarem macias. Deixe esfriar por alguns minutos antes de servir.'
        ),
        NULL
    ),
    (
        'e7ea0009-0000-4000-8000-000000000009',
        'en',
        'cinnamon-baked-apples',
        'Cinnamon Baked Apples',
        'Apples filled with oats, sugar, and cinnamon, baked until tender.',
        jsonb_build_array(
            'Preheat the oven to 190 °C (375 °F). Core the apples without cutting through the bottom.',
            'Mix the oats, sugar, butter, cinnamon, and a pinch of salt.',
            'Fill the apples with the mixture and place them in a small baking dish.',
            'Bake for 25 to 30 minutes, until the apples are tender. Cool for a few minutes before serving.'
        ),
        NULL
    ),
    (
        'e7ea0010-0000-4000-8000-000000000010',
        'pt-BR',
        'bolo-de-chocolate-de-caneca',
        'Bolo de chocolate de caneca',
        'Bolo individual de chocolate preparado e cozido na própria caneca.',
        jsonb_build_array(
            'Em uma caneca grande própria para micro-ondas, misture a farinha, o açúcar, o cacau, o fermento e uma pitada de sal.',
            'Adicione o leite e o óleo. Mexa até a massa ficar uniforme, raspando o fundo da caneca.',
            'Cozinhe no micro-ondas em potência alta por 60 a 90 segundos, até o centro ficar firme.',
            'Espere 2 minutos antes de comer, pois a caneca estará quente.'
        ),
        NULL
    ),
    (
        'e7ea0010-0000-4000-8000-000000000010',
        'en',
        'chocolate-mug-cake',
        'Chocolate Mug Cake',
        'A single-serving chocolate cake mixed and cooked in its mug.',
        jsonb_build_array(
            'In a large microwave-safe mug, mix the flour, sugar, cocoa, baking powder, and a pinch of salt.',
            'Add the milk and oil. Stir until smooth, scraping the bottom of the mug.',
            'Microwave on high for 60 to 90 seconds, until the center is set.',
            'Wait 2 minutes before eating because the mug will be hot.'
        ),
        NULL
    )
ON CONFLICT (recipe_id, language_code)
DO UPDATE SET
    slug = EXCLUDED.slug,
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    instructions = EXCLUDED.instructions,
    image_alt = NULL
WHERE (public.recipe_translations.slug,
       public.recipe_translations.title,
       public.recipe_translations.description,
       public.recipe_translations.instructions,
       public.recipe_translations.image_alt)
  IS DISTINCT FROM
      (EXCLUDED.slug,
       EXCLUDED.title,
       EXCLUDED.description,
       EXCLUDED.instructions,
       EXCLUDED.image_alt);

-- Ingredientes e quantidades de cada receita.
-- quantity_text e preparation_note ficam NULL; quantity e unit_code são preenchidos.
INSERT INTO public.recipe_ingredients (
    recipe_id,
    ingredient_id,
    quantity,
    quantity_text,
    unit_code,
    preparation_note,
    display_order
)
SELECT
    seed.recipe_id::uuid,
    ingredient.id,
    seed.quantity,
    NULL,
    seed.unit_code,
    NULL,
    seed.display_order
FROM (
    VALUES
        -- Panquecas fofas
        ('e7ea0001-0000-4000-8000-000000000001', 'all_purpose_flour', 150, 'g', 1),
        ('e7ea0001-0000-4000-8000-000000000001', 'milk', 180, 'ml', 2),
        ('e7ea0001-0000-4000-8000-000000000001', 'egg', 1, 'unit', 3),
        ('e7ea0001-0000-4000-8000-000000000001', 'granulated_sugar', 15, 'g', 4),
        ('e7ea0001-0000-4000-8000-000000000001', 'baking_powder', 6, 'g', 5),
        ('e7ea0001-0000-4000-8000-000000000001', 'salt', 1, 'g', 6),
        ('e7ea0001-0000-4000-8000-000000000001', 'butter', 20, 'g', 7),

        -- Ovos mexidos com tomate
        ('e7ea0002-0000-4000-8000-000000000002', 'egg', 3, 'unit', 1),
        ('e7ea0002-0000-4000-8000-000000000002', 'tomato', 120, 'g', 2),
        ('e7ea0002-0000-4000-8000-000000000002', 'butter', 10, 'g', 3),
        ('e7ea0002-0000-4000-8000-000000000002', 'salt', 1, 'g', 4),
        ('e7ea0002-0000-4000-8000-000000000002', 'black_pepper', 0.3, 'g', 5),
        ('e7ea0002-0000-4000-8000-000000000002', 'sliced_bread', 2, 'slice', 6),

        -- Tigela de frango e arroz
        ('e7ea0003-0000-4000-8000-000000000003', 'chicken_breast', 250, 'g', 1),
        ('e7ea0003-0000-4000-8000-000000000003', 'rice', 150, 'g', 2),
        ('e7ea0003-0000-4000-8000-000000000003', 'onion', 0.5, 'unit', 3),
        ('e7ea0003-0000-4000-8000-000000000003', 'garlic', 1, 'clove', 4),
        ('e7ea0003-0000-4000-8000-000000000003', 'neutral_oil', 10, 'ml', 5),
        ('e7ea0003-0000-4000-8000-000000000003', 'tomato', 100, 'g', 6),
        ('e7ea0003-0000-4000-8000-000000000003', 'water', 300, 'ml', 7),
        ('e7ea0003-0000-4000-8000-000000000003', 'salt', 3, 'g', 8),
        ('e7ea0003-0000-4000-8000-000000000003', 'black_pepper', 0.5, 'g', 9),

        -- Macarrão com tomate e grão-de-bico
        ('e7ea0004-0000-4000-8000-000000000004', 'pasta', 160, 'g', 1),
        ('e7ea0004-0000-4000-8000-000000000004', 'canned_tomatoes', 240, 'g', 2),
        ('e7ea0004-0000-4000-8000-000000000004', 'chickpeas', 200, 'g', 3),
        ('e7ea0004-0000-4000-8000-000000000004', 'onion', 0.5, 'unit', 4),
        ('e7ea0004-0000-4000-8000-000000000004', 'garlic', 2, 'clove', 5),
        ('e7ea0004-0000-4000-8000-000000000004', 'olive_oil', 15, 'ml', 6),
        ('e7ea0004-0000-4000-8000-000000000004', 'water', 1500, 'ml', 7),
        ('e7ea0004-0000-4000-8000-000000000004', 'salt', 3, 'g', 8),
        ('e7ea0004-0000-4000-8000-000000000004', 'black_pepper', 0.5, 'g', 9),

        -- Frango assado com batatas
        ('e7ea0005-0000-4000-8000-000000000005', 'chicken_thigh', 400, 'g', 1),
        ('e7ea0005-0000-4000-8000-000000000005', 'potato', 400, 'g', 2),
        ('e7ea0005-0000-4000-8000-000000000005', 'olive_oil', 20, 'ml', 3),
        ('e7ea0005-0000-4000-8000-000000000005', 'garlic', 2, 'clove', 4),
        ('e7ea0005-0000-4000-8000-000000000005', 'lime', 0.5, 'unit', 5),
        ('e7ea0005-0000-4000-8000-000000000005', 'salt', 3, 'g', 6),
        ('e7ea0005-0000-4000-8000-000000000005', 'paprika', 2, 'g', 7),
        ('e7ea0005-0000-4000-8000-000000000005', 'black_pepper', 0.5, 'g', 8),

        -- Omelete de batata e espinafre
        ('e7ea0006-0000-4000-8000-000000000006', 'egg', 4, 'unit', 1),
        ('e7ea0006-0000-4000-8000-000000000006', 'potato', 200, 'g', 2),
        ('e7ea0006-0000-4000-8000-000000000006', 'onion', 0.5, 'unit', 3),
        ('e7ea0006-0000-4000-8000-000000000006', 'spinach', 60, 'g', 4),
        ('e7ea0006-0000-4000-8000-000000000006', 'olive_oil', 10, 'ml', 5),
        ('e7ea0006-0000-4000-8000-000000000006', 'milk', 30, 'ml', 6),
        ('e7ea0006-0000-4000-8000-000000000006', 'water', 500, 'ml', 7),
        ('e7ea0006-0000-4000-8000-000000000006', 'salt', 2, 'g', 8),
        ('e7ea0006-0000-4000-8000-000000000006', 'black_pepper', 0.5, 'g', 9),

        -- Torrada de abacate e tomate
        ('e7ea0007-0000-4000-8000-000000000007', 'sliced_bread', 2, 'slice', 1),
        ('e7ea0007-0000-4000-8000-000000000007', 'avocado', 1, 'unit', 2),
        ('e7ea0007-0000-4000-8000-000000000007', 'lime', 0.25, 'unit', 3),
        ('e7ea0007-0000-4000-8000-000000000007', 'salt', 1, 'g', 4),
        ('e7ea0007-0000-4000-8000-000000000007', 'tomato', 80, 'g', 5),
        ('e7ea0007-0000-4000-8000-000000000007', 'olive_oil', 5, 'ml', 6),

        -- Bolinhas de banana e aveia
        ('e7ea0008-0000-4000-8000-000000000008', 'banana', 1, 'unit', 1),
        ('e7ea0008-0000-4000-8000-000000000008', 'rolled_oats', 100, 'g', 2),
        ('e7ea0008-0000-4000-8000-000000000008', 'peanut_butter', 30, 'g', 3),
        ('e7ea0008-0000-4000-8000-000000000008', 'honey', 15, 'g', 4),
        ('e7ea0008-0000-4000-8000-000000000008', 'cinnamon', 1, 'g', 5),
        ('e7ea0008-0000-4000-8000-000000000008', 'salt', 0.3, 'g', 6),

        -- Maçã assada com canela
        ('e7ea0009-0000-4000-8000-000000000009', 'apple', 2, 'unit', 1),
        ('e7ea0009-0000-4000-8000-000000000009', 'rolled_oats', 40, 'g', 2),
        ('e7ea0009-0000-4000-8000-000000000009', 'granulated_sugar', 20, 'g', 3),
        ('e7ea0009-0000-4000-8000-000000000009', 'butter', 20, 'g', 4),
        ('e7ea0009-0000-4000-8000-000000000009', 'cinnamon', 1, 'g', 5),
        ('e7ea0009-0000-4000-8000-000000000009', 'salt', 0.3, 'g', 6),

        -- Bolo de chocolate de caneca
        ('e7ea0010-0000-4000-8000-000000000010', 'all_purpose_flour', 50, 'g', 1),
        ('e7ea0010-0000-4000-8000-000000000010', 'granulated_sugar', 25, 'g', 2),
        ('e7ea0010-0000-4000-8000-000000000010', 'cocoa_powder', 12, 'g', 3),
        ('e7ea0010-0000-4000-8000-000000000010', 'milk', 45, 'ml', 4),
        ('e7ea0010-0000-4000-8000-000000000010', 'neutral_oil', 15, 'ml', 5),
        ('e7ea0010-0000-4000-8000-000000000010', 'baking_powder', 2, 'g', 6),
        ('e7ea0010-0000-4000-8000-000000000010', 'salt', 0.3, 'g', 7)
) AS seed(recipe_id, ingredient_key, quantity, unit_code, display_order)
JOIN public.ingredients AS ingredient
    ON ingredient.ingredient_key = seed.ingredient_key
WHERE TRUE
ON CONFLICT (recipe_id, ingredient_id)
DO UPDATE SET
    quantity = EXCLUDED.quantity,
    quantity_text = NULL,
    unit_code = EXCLUDED.unit_code,
    preparation_note = NULL,
    display_order = EXCLUDED.display_order
WHERE (public.recipe_ingredients.quantity,
       public.recipe_ingredients.quantity_text,
       public.recipe_ingredients.unit_code,
       public.recipe_ingredients.preparation_note,
       public.recipe_ingredients.display_order)
  IS DISTINCT FROM
      (EXCLUDED.quantity,
       EXCLUDED.quantity_text,
       EXCLUDED.unit_code,
       EXCLUDED.preparation_note,
       EXCLUDED.display_order);

COMMIT;
