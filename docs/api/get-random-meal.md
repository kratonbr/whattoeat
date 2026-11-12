# API contract: GET /api/meals/random

## Purpose

Retorna uma receita publicada para a página inicial. A consulta e a escolha da receita são executadas no servidor; clientes não consultam diretamente o Supabase.

## Parâmetros de query

Todos são opcionais.

| Parâmetro | Formato e padrão | Comportamento |
|---|---|---|
| **category** | Texto. Padrão: **all**. Valores: **all**, **breakfast**, **lunch**, **dinner**, **snack**, **dessert**. | A categoria é convertida para minúsculas. **all** equivale a não filtrar. Não há remoção de espaços. |
| **locale** | Texto. Padrão: **en**. Valores aceitos: **en**, **pt-BR**. | A comparação é sensível a maiúsculas e minúsculas. |
| **exclude** | UUID no formato hexadecimal 8-4-4-4-12. | Quando há mais de uma candidata e não há **recipeId**, tenta evitar a receita indicada. Se ela for a única candidata, o serviço pode retorná-la mesmo assim. |
| **recipeId** | UUID no formato hexadecimal 8-4-4-4-12. | Restringe a consulta à receita indicada. Se **category** também for enviada, ambos os filtros são aplicados. **exclude** não participa da escolha quando **recipeId** está presente. |

A validação de UUID verifica o formato 8-4-4-4-12 hexadecimal; não valida versão ou variante UUID. Categoria e idioma inválidos são rejeitados antes da consulta Supabase.

## Respostas

### 200 — receita encontrada

Cabeçalho: **Cache-Control: no-store**

~~~json
{
  "meal": {
    "id": "uuid",
    "category": "dinner",
    "prep_time_minutes": 25,
    "servings": 2,
    "difficulty": "easy",
    "slug": "recipe-slug",
    "title": "Recipe title",
    "description": "Optional description",
    "instructions": ["Step one", "Step two"],
    "ingredients": [
      {
        "id": "uuid",
        "name": "Ingredient name",
        "quantity": 1,
        "quantity_text": null,
        "unit_code": "unit"
      }
    ]
  }
}
~~~

**description** pode ser **null**. Cada item de ingrediente informa **quantity**, **quantity_text** e **unit_code**; os campos de quantidade/unidade podem ser nulos conforme o registro. A resposta não inclui **display_order** nem **preparation_note**.

### 400 — parâmetro inválido

| error | Condição |
|---|---|
| INVALID_CATEGORY | Categoria fora da lista permitida. |
| INVALID_LOCALE | Idioma fora da lista permitida. |
| INVALID_EXCLUDE_ID | **exclude** não tem formato UUID aceito. |
| INVALID_RECIPE_ID | **recipeId** não tem formato UUID aceito. |

Formato: **{"error":"ERROR_CODE"}**. A implementação atual não define **Cache-Control** explicitamente para essas respostas.

### 404 — nenhuma receita

Cabeçalho: **Cache-Control: no-store**

~~~json
{
  "error": "NO_RECIPES"
}
~~~

Ocorre quando nenhuma receita publicada com a tradução solicitada corresponde aos filtros.

### 503 — Supabase não configurado

Cabeçalho: **Cache-Control: no-store**

~~~json
{
  "error": "SUPABASE_NOT_CONFIGURED"
}
~~~

### 500 — falha de consulta ou conteúdo inconsistente

Cabeçalho: **Cache-Control: no-store**

~~~json
{
  "error": "RECIPE_LOOKUP_FAILED"
}
~~~

A API registra no servidor o código interno do erro, mas não o envia na resposta.

## Responsabilidades atuais

- O Route Handler valida a entrada, chama o serviço e converte o resultado em resposta HTTP.
- A consulta Supabase, filtragem de publicação, idioma e categoria, busca de ingredientes traduzidos e montagem da resposta estão em **services/recipes.js**.
- A seleção aleatória e a regra de exclusão são regras puras e ficam em **domain/recipes.mjs**.
- O contrato HTTP e a validação de query ficam em **lib/api/random-meals.mjs**.
- RLS continua sendo a barreira do banco para leitura de receitas publicadas; este endpoint não usa a chave **service_role**.