# WhatToEat — Análise da Arquitetura Web e Mobile

## Objetivo

Avaliar a arquitetura atual do WhatToEat para uma futura aplicação web com Next.js, aplicativo Android e iOS com React Native/Expo e compartilhamento de regras de negócio entre plataformas.

Estado revisado em 12/11/2026 após a implementação inicial de autenticação administrativa, dashboard parcial e validação das políticas RLS remotas em consulta somente de leitura.

## Estado após a refatoração arquitetural incremental

Em 12/11/2026, foram criadas fronteiras modulares por domínio para receitas, ingredientes e administração. As regras puras ficam em `modules/<módulo>/domain`, os casos de uso em `application`, os adaptadores Supabase em `infrastructure/supabase` e os handlers administrativos compartilhados em `presentation/http`. `shared/http/admin-http.mjs` reúne validação de requisição, respostas sem cache e conversão segura de erros administrativos.

As integrações Supabase continuam exclusivamente no servidor e foram movidas para repositórios. Os casos de uso recebem repositórios por injeção de dependência; não foram introduzidas classes artificiais porque funções e objetos de dependências atendem às necessidades atuais. Arquivos antigos de `domain/`, `services/` e `lib/api/` permanecem como fachadas de compatibilidade para reduzir o risco da mudança.

A suíte automatizada passou de 57 para 74 testes; `npm test`, `npm run lint` e `npm run build` passaram após a refatoração. O primeiro build foi bloqueado por permissão de escrita em `.next`; ao executar com permissão temporária para os arquivos de saída, o build de produção foi concluído. Não há testes end-to-end automatizados nem teste de integração dos repositórios contra Supabase. Nenhum schema, dado, migration ou configuração remota foi alterado.

## Diagnóstico atualizado

O projeto mantém Next.js App Router e JavaScript, com módulos de negócio para receitas, ingredientes e administração. A página pública inicial permanece um Client Component extenso e é o maior ponto de concentração na apresentação. A página de detalhes continua em rota dinâmica. Os casos de uso e regras puras agora são separados dos adaptadores Supabase; o app mobile ainda não existe.

### Estrutura atual observada

- **app/**: páginas públicas e administrativas, além de Route Handlers; handlers administrativos encaminham para os módulos de apresentação HTTP.
- **modules/recipes/domain/**: categorias, idiomas, resolução de slug, seleção aleatória, porções e validações puras.
- **modules/recipes/application/**: casos de uso para sortear receita publicada e buscar detalhes por slug, recebendo repositório injetado.
- **modules/recipes/infrastructure/supabase/**: repositório de leitura pública e repositório editorial administrativo.
- **modules/ingredients/domain/**: tradução/mapeamento de ingredientes e validação editorial; infraestrutura Supabase administrativa separada.
- **modules/admin/domain/**: política de acesso e cálculo de indicadores do dashboard.
- **modules/admin/application/**: caso de uso do dashboard e regras de navegação/cache administrativo.
- **modules/admin/infrastructure/supabase/**: autorização vinculada à requisição e repositório de leitura do dashboard.
- **modules/admin/presentation/http/**: handlers de autenticação, resumo do dashboard, recuperação de senha e operações editoriais já existentes.
- **shared/http/admin-http.mjs**: parsing e validação comum de requisições administrativas, respostas sem cache, validação de origem e tradução segura de falhas.
- **services/**, **domain/** e **lib/api/**: algumas entradas antigas permanecem como fachadas de compatibilidade e composição server-only, sem duplicar a implementação de domínio.
- **lib/supabase/server.js**: cliente Supabase de servidor com chave publicável e RLS; nenhum acesso privilegiado foi introduzido.
- **tests/**: 74 testes automatizados após a extração; não há E2E nem teste de integração real contra Supabase.
- **package.json**: scripts `test`, `lint` e `build`; as três verificações passaram após a refatoração.
- **Validação manual:** o usuário confirmou anteriormente no navegador o fluxo público de detalhes, navegação e ajuste de porções. Isso não substitui E2E automatizado.
- **supabase/**: contém migrations e seed versionados; nesta refatoração não foram executados ou alterados.

### Separação atual

Os Route Handlers mantêm o adaptador HTTP e delegam operações às funções de apresentação/casos de uso. Regras puras de receita, porções, tradução de ingredientes, autorização de papel e cálculo de indicadores não dependem do Next.js ou do Supabase. Os casos de uso recebem seus repositórios por dependência explícita.

As consultas `.from()` e RPCs estão encapsuladas nos adaptadores `modules/*/infrastructure/supabase/`. As fachadas em `services/` criam clientes no servidor no contexto da chamada e compõem repositórios com casos de uso. A autorização administrativa permanece server-side e usa a identidade validada pelo Supabase Auth; respostas privadas mantêm política de não cache. Não foram introduzidas classes: funções puras, factories e objetos de dependência são suficientes no estado atual.

A página inicial, **app/page.js**, permanece um Client Component grande com interface, estado e chamada HTTP; dividir sua apresentação pode ser uma refatoração futura separada. O catálogo de mensagens permanece em **lib/i18n.js**. `pt-BR` continua o padrão público e `en` é selecionado explicitamente. A página de detalhes **app/recipes/[slug]/page.js** permanece funcional e o componente cliente de porções usa a regra pura do módulo de receitas.

O compartilhamento mobile possível hoje está nas regras puras em JavaScript, especialmente porções, normalização/tradução de ingredientes e seleção/locale. O mobile deverá consumir os Route Handlers por HTTP; os módulos de infraestrutura Supabase e autenticação são exclusivos do backend web. Ainda não há pacote mobile, cliente HTTP compartilhado nem contrato formal de API.

### Autenticação e segurança administrativas

- Toda rota administrativa protegida e endpoint administrativo deve autenticar no servidor com Supabase Auth e autorizar somente `user.app_metadata.role === "admin"`, usando o usuário retornado por `auth.getUser()` no cliente SSR com cookies.
- Cada Route Handler ou Server Action administrativo deve repetir a autorização antes de executar sua operação. Ausência de sessão válida retorna HTTP 401; identidade autenticada sem papel admin retorna HTTP 403.
- Nenhuma decisão de permissão pode depender da interface, de botões ocultos ou de dados enviados pelo navegador. Validar no backend os dados recebidos antes de qualquer escrita.
- RLS continua como camada independente no PostgreSQL; não utilizar `service_role` para contornar política, autorização ou grants. Operações mutáveis devem validar origem/CSRF quando aplicável.
- Respostas administrativas privadas devem ser `no-store`; erros internos devem ser convertidos em códigos e mensagens amigáveis em pt-BR sem vazar dados internos.
- Toda interface em `/admin` é exclusivamente em português brasileiro. Conteúdo de receitas continua podendo ser cadastrado em `pt-BR` e `en`; a regra não altera a área pública bilíngue.
- Estado observado: as cinco tabelas têm RLS, mas foram encontradas somente políticas públicas de SELECT limitadas a receitas publicadas e respectivos dados. Não há política administrativa de leitura ou escrita. O dashboard, portanto, mostra apenas o contador exato de publicadas; os indicadores que precisam de rascunhos ficam indisponíveis até uma migration RLS revisada.

### Compartilhamento entre web e mobile

**Boas candidatas a compartilhamento:**

- Regras puras de domínio, como categorias, idiomas, seleção e ajuste de porções.
- Contratos de entrada e saída da API, incluindo erros e formato da receita.
- Funções puras de validação ou formatação que não dependam do DOM.
- Catálogo e convenções de tradução, desde que organizado para uso multiplataforma.
- Tokens de design, como cores e espaçamentos — não necessariamente os componentes visuais.

**Partes que devem permanecer específicas:**

- Componentes visuais: React para web usa elementos HTML e CSS; React Native usa componentes nativos e outro sistema de estilos. Não é recomendável tentar compartilhar a página ou os botões atuais.
- Route Handlers, **next/link**, **next/font**, **Response.json** e configuração de ambiente Next.js.
- Acesso ao Supabase no servidor. O app mobile não deve receber credenciais privilegiadas; deve consumir a mesma API pública do Next.js.

Para que web e mobile sigam o mesmo comportamento, a API deve ser a fonte autoritativa das regras de consulta e seleção. O mobile pode compartilhar contratos e regras puras, mas não deve reimplementar por conta própria as decisões que o servidor já toma.

### TypeScript e POO

**Vale a pena adotar TypeScript gradualmente.** O benefício fica maior quando houver um segundo cliente — o app Expo — porque tipos compartilhados ajudam a manter compatíveis as respostas da API, os idiomas, categorias, ingredientes e erros. A adoção não precisa acompanhar uma reescrita da interface.

Sugiro começar pelos contratos e módulos compartilhados, depois avançar para casos de uso, adaptador Supabase e endpoints. As telas existentes podem continuar em JavaScript durante essa transição.

POO não precisa ser um objetivo por si só. Para seleção, validação e formatação, funções puras e dados imutáveis tendem a ser suficientes. Interfaces de repositório e injeção de dependência são úteis para separar casos de uso do Supabase. Classes de domínio só se justificam se precisarem proteger invariantes ou manter estado próprio.

## Arquitetura recomendada

A direção recomendada é um **monólito modular em workspace**, com Next.js e Expo como aplicações separadas e pacotes compartilhados para regras puras e contratos.

    apps/
      web/
        src/
          app/                 # páginas e Route Handlers do Next.js
          components/          # componentes exclusivos da web
          features/            # composição de fluxos da interface
      mobile/
        app/                    # telas e navegação Expo
        src/
          components/          # componentes exclusivos do React Native
          features/

    packages/
      domain/                   # entidades, valores e regras puras
      application/              # casos de uso e portas/repositórios
      contracts/                # contratos da API, validações e erros
      api-client/               # cliente HTTP multiplataforma
      i18n/                     # mensagens, idiomas e helpers puros
      design-tokens/            # cores, tipografia e espaçamentos
      infrastructure-supabase/  # adaptadores Supabase exclusivos do servidor

    supabase/
      migrations/
      seed.sql

### Responsabilidades principais

- **Domain:** tipos e regras independentes de Next.js, Supabase, navegador ou React Native.
- **Application:** casos de uso, como obter uma refeição aleatória, usando portas em vez de importar Supabase.
- **Infrastructure:** implementações das portas, incluindo o repositório Supabase, restritas ao servidor.
- **Contracts e API client:** formato estável de requisições, respostas e erros para web e mobile.
- **Apps:** navegação, telas e componentes próprios de cada plataforma.
- **i18n:** catálogo e funções sem dependência de DOM. O servidor continua responsável por selecionar conteúdo de receita no idioma solicitado.

Essa estrutura é um destino, não uma proposta para mover tudo agora. A pasta **application** deve executar do lado servidor quando depender de dados. O mobile acessa esses casos por HTTP, não importando o repositório Supabase.

## Plano de reorganização

### Etapas já realizadas nesta refatoração

1. **Comportamento e testes:** os contratos observados dos endpoints de sorteio e detalhes foram preservados; novos testes cobrem casos de uso, traduções/mapeamentos e validação editorial. O contrato da API ainda não está formalizado em módulo compartilhável.
2. **Domínio, aplicação e infraestrutura:** regras puras foram organizadas por módulo; casos de uso de receitas e dashboard recebem dependências; consultas Supabase foram encapsuladas em repositórios do servidor.
3. **Handlers administrativos:** a apresentação HTTP administrativa foi agrupada e preocupações comuns de origem, parsing, cache e erros foram centralizadas. Os Route Handlers continuam como adaptadores de entrada. Não houve alteração de endpoints públicos ou de seus formatos.

### Etapas ainda pendentes

4. **Reduzir o acoplamento da página inicial:** dividir `app/page.js` em componentes de apresentação menores mantendo estados, idioma e chamada HTTP; preservar a interface e cobrir o comportamento com testes.
5. **Formalizar contratos da API:** descrever parâmetros, payloads, respostas e erros em JavaScript reutilizável, sem migrar para TypeScript nesta etapa.
6. **Validar infraestrutura de dados:** adicionar testes de integração para repositórios em ambiente isolado quando disponível; os testes unitários atuais não executam consultas reais.
7. **Preparar workspace e mobile somente quando priorizados:** planejar `apps/web`, `apps/mobile`/Expo, pacotes compartilhados e cliente HTTP após a versão web e o contrato da API estarem estáveis.

## Riscos a controlar

- Ainda pode haver duplicação de nomes de categorias, traduções e formatação entre a interface e módulos de domínio.
- O formato da resposta da API ainda não está declarado como contrato compartilhado.
- Refatorar a página ou mover diretórios antes de testes cria risco de regressão na troca de idioma e no sorteio.
- Componentes web não serão reutilizáveis diretamente em React Native; tentar compartilhar esses componentes aumentaria a complexidade.
- O acesso mobile dependerá da disponibilidade e estabilidade da API hospedada; não existe hoje um cliente HTTP reutilizável ou estratégia offline.
- Ainda não há teste end-to-end automatizado nem contrato tipado compartilhado; os testes de handlers usam funções de serviço simuladas.
- Os serviços Supabase não têm cobertura de integração automatizada, portanto build e testes unitários não substituem validação de consultas reais.
- Filtros de tempo e ingredientes disponíveis ainda não existem; a API atual cobre sorteio, categoria, locale, exclusão e busca por ID.

## Próximo passo recomendado

Para retomar a Seção 2, concluir a tarefa 2.2 antes de iniciar 2.3: validar o baseline em ambiente isolado (1.3), preparar e aplicar somente mediante autorização as políticas administrativas de SELECT necessárias, e validar a matriz RLS. Em seguida, habilitar e verificar todos os indicadores do dashboard. O CRUD de 2.3 permanece fora do escopo desta refatoração. Não há E2E automatizado.
