# WhatToEat — Relatório de Auditoria Arquitetural

**Data:** 12/11/2026  
**Escopo:** auditoria arquitetural do repositório, sem refatoração.

## Resumo

O WhatToEat funciona como um monólito Next.js com App Router. Já há separação inicial entre interface, Route Handlers, funções de domínio puras e acesso server-side ao Supabase. A aplicação pública tem cobertura automatizada de rotas e regras de domínio, e a autenticação administrativa verifica o papel do usuário no servidor.

A organização ainda é principalmente por tipo de arquivo (`app/`, `domain/`, `services/`, `lib/`) e não por módulo de negócio. Isso funciona para o escopo atual, mas tende a aumentar o acoplamento enquanto receitas, ingredientes, traduções e Storage entram no painel administrativo.

## Estado observado

- Next.js App Router, JavaScript, React e Tailwind CSS.
- O frontend público chama as APIs Next.js; as chamadas Supabase observadas estão em serviços server-side.
- `domain/recipes.mjs` contém regras puras para idioma, categorias, seleção e slugs.
- `domain/portions.mjs` contém o cálculo de porções sem dependência de Next.js ou navegador.
- `services/recipes.js` consulta o Supabase, aplica filtros e monta os objetos consumidos pelas APIs.
- `lib/auth/admin.js` centraliza autorização server-side com base em `app_metadata.role === "admin"`.
- A página administrativa e os endpoints verificam autorização no servidor; o proxy atualiza sessão, mas não substitui a autorização por rota.
- A migration baseline existe; a política RLS remota administrativa ainda não foi aplicada.
- A página inicial tem aproximadamente 534 linhas e reúne apresentação, estado, seletor de idioma, ícones e chamada HTTP.
- Não foram identificadas dependências circulares evidentes na leitura estática dos imports.

## Pontos positivos

1. O cliente Supabase administrativo é mantido no servidor.
2. A interface não consulta diretamente Postgres, Auth ou Storage.
3. A autorização administrativa usa metadados confiáveis e é refeita no servidor.
4. Cookies administrativos são configurados como HttpOnly e SameSite.
5. Regras de domínio importantes, como idioma, seleção de receita e porções, já são funções puras.
6. Parte dos Route Handlers usa fábricas com dependências injetadas, facilitando testes com serviços simulados.
7. O dashboard não inventa números: os indicadores que dependem de leitura administrativa permanecem indisponíveis enquanto o RLS não permitir acesso completo.

## Problemas e riscos arquiteturais

### Interface

- `app/page.js` concentra muitos componentes e responsabilidades. Uma mudança em seletor, sorteio ou apresentação pode afetar o mesmo arquivo extenso.
- `app/admin/dashboard-client.js` controla a busca à API, o estado visual e a apresentação dos indicadores no mesmo componente. O acesso ao banco continua corretamente no backend, mas os blocos visuais podem ser separados.

### Regras de negócio e Supabase

- `services/recipes.js` combina consultas Supabase, escolha de receita, resolução de slug, busca de traduções e montagem de resposta.
- As funções de domínio já existentes são uma boa base, mas ainda não há casos de uso nem contratos claros entre domínio e infraestrutura.
- Serviços administrativos ainda não tinham repositórios com contratos injetáveis antes do início parcial da implementação editorial.

### APIs e erros

- Os handlers administrativos estavam começando a acumular autorização, parsing HTTP, proteção de origem, validação, chamada de serviços e conversão de erros.
- Cabeçalhos sem cache, validações de origem e tradução de erros estão distribuídos por mais de um módulo. Sem uma convenção compartilhada, podem divergir entre rotas.
- A leitura pública e a administrativa têm requisitos diferentes de RLS; a segunda depende de políticas explícitas para não retornar dados parciais silenciosamente.

### Banco, RLS e Storage

- O banco remoto tem RLS habilitado, mas as políticas existentes permitem apenas leitura pública de receitas publicadas e dados relacionados.
- O baseline registra grants amplos para papéis públicos; por isso o RLS é essencial e precisa de uma matriz de testes por papel.
- A migration administrativa/Storage criada localmente ainda não foi executada nem validada em banco isolado.
- Operações entre PostgreSQL e Storage não compartilham transação. Upload, substituição e exclusão precisam prever compensação e limpeza de arquivos órfãos.
- Ainda não há fluxo implementado de URL assinada para mostrar imagens de receitas publicadas armazenadas em bucket privado.

### Testes

- A suíte observada tem 57 testes automatizados de handlers, autenticação, dashboard e domínio.
- Não há testes end-to-end automatizados.
- Os testes existentes não validam consultas reais contra o Supabase nem substituem testes locais de RLS e Storage.
- Os arquivos editoriais parciais listados adiante não têm testes próprios nesta auditoria.

## Arquitetura recomendada

Manter o Next.js App Router como camada de apresentação e transporte HTTP. Organizar as próximas funcionalidades por módulo de negócio e separar quatro responsabilidades:

1. **Presentation:** páginas, componentes React e Route Handlers.
2. **Application / Use Cases:** coordenação de ações como buscar receita, salvar rascunho, publicar ou remover ingrediente.
3. **Domain:** regras puras e invariantes, sem Next.js, Supabase ou APIs do navegador.
4. **Infrastructure / Repositories:** consultas Supabase, Auth e Storage, exclusivamente no servidor.

Estrutura de destino, para adoção gradual:

```text
app/
  admin/                         # páginas e composição Next.js
  api/                           # Route Handlers finos

modules/
  recipes/
    domain/
    application/
    infrastructure/supabase/
    presentation/admin/
  ingredients/
    domain/
    application/
    infrastructure/supabase/
    presentation/admin/
  admin/
    domain/
    application/
    infrastructure/supabase/
    presentation/

shared/
  api/                           # contratos e erros HTTP
  i18n/                          # idiomas e mensagens reutilizáveis
  validation/                    # validações puras compartilhadas

supabase/
  migrations/
  seed.sql
```

Essa estrutura é uma direção de evolução, não uma exigência para mover todos os arquivos de uma vez.

## POO, classes e injeção de dependências

Não há motivo para transformar cada regra ou caso de uso em classe.

- Regras de categoria, idioma, quantidade e completude de tradução devem continuar como funções puras quando não mantêm estado.
- Casos de uso podem ser funções que recebem repositórios e serviços como dependências.
- Repositórios podem começar como objetos/fábricas com métodos e cliente Supabase recebido por parâmetro.
- Uma classe de repositório só se justifica se houver estado/ciclo de vida próprio ou mais de uma implementação que beneficie de um contrato polimórfico.
- Uma classe `Recipe` para espelhar uma linha do banco não é necessária enquanto os dados e invariantes puderem ser representados por objetos simples e funções.

## Integração com a Seção 2 do roadmap

- **2.1 Autenticação:** manter Auth SSR e autorização server-side no módulo administrativo.
- **2.2 Dashboard:** separar cálculo puro, caso de uso e repositório de leitura.
- **2.3 Receitas:** manter validação de domínio e salvamento relacionado em operação transacional.
- **2.4 Ingredientes:** separar catálogo, traduções e vínculos com receitas.
- **2.5 Traduções:** compartilhar a regra de idiomas suportados e de completude.
- **2.6 Imagens:** manter Storage no adaptador server-side, com bucket privado e URLs assinadas conforme publicação.
- **2.7 Validação:** validar no backend e testar domínio, casos de uso, handlers e constraints/RLS localmente.

O frontend administrativo permanece exclusivamente em português brasileiro. Os dados editoriais continuam aceitando `pt-BR` e `en`; a área pública continua bilíngue.

## Plano incremental recomendado

1. Preservar os contratos e o comportamento público com os testes já existentes.
2. Extrair casos de uso puros para consultas públicas de receitas e manter o Route Handler fino.
3. Definir contratos de repositório para receitas e ingredientes e mover consultas Supabase para adaptadores server-only.
4. Padronizar autorização, CSRF/origem, cabeçalhos sem cache e erros administrativos.
5. Construir telas editoriais menores que chamem apenas as APIs do backend.
6. Implementar imagens após validar políticas do bucket e a estratégia de URLs assinadas.
7. Reproduzir migrations em ambiente isolado e testar RLS como anônimo, usuário comum e administrador.
8. Manter domínio e contratos sem dependência de Next.js para facilitar o consumo futuro por Expo.

## Verificações realizadas

- `npm test`: **57 aprovados, 0 falhas**.
- `npm run lint`: **passou**.
- `npm run build`: **não executado** durante a auditoria.
- Não há testes end-to-end automatizados.
- Não foi executada migration nem alterado o Supabase remoto.

## Arquivos administrativos parciais existentes

Antes da solicitação desta auditoria, durante a implementação autorizada anteriormente, foram criados arquivos locais para iniciar Auth de recuperação e operações editoriais:

- `supabase/migrations/20261112035903_admin_editorial_and_storage.sql`
- `lib/admin/validation.mjs`
- `lib/api/admin-editorial.mjs`
- `lib/api/admin-password-recovery.mjs`
- `services/admin/editorial-data.js`
- `services/admin/readiness.js`
- `app/api/admin/auth/callback/route.js`
- `app/api/admin/auth/password/route.js`
- `app/api/admin/auth/recovery/route.js`
- `app/api/admin/recipes/route.js` e `app/api/admin/recipes/[id]/route.js`
- `app/api/admin/ingredients/route.js` e `app/api/admin/ingredients/[id]/route.js`

Esses arquivos são **parciais**: não há as telas de gerenciamento, os endpoints de imagem ou testes próprios. A migration é apenas local, não foi executada no Supabase remoto e ainda precisa de validação em ambiente isolado. A suíte com 57 testes não cobre esses arquivos novos.

## Limites desta auditoria

Esta auditoria não realizou refatoração. Depois da solicitação de auditoria, nenhuma alteração de código ou banco foi feita. O único arquivo criado para registrar os resultados é este relatório.
