# WhatToEat — Análise da Arquitetura Web e Mobile

## Objetivo

Avaliar a arquitetura atual do WhatToEat para uma futura aplicação web com Next.js, aplicativo Android e iOS com React Native/Expo e compartilhamento de regras de negócio entre plataformas.

Esta análise é apenas diagnóstica. Nenhum código, configuração ou objeto do Supabase foi alterado.

## Diagnóstico

O WhatToEat já tem uma separação inicial entre interface, endpoint e acesso ao Supabase, mas as regras de negócio ainda estão misturadas com a consulta ao banco e a interface está concentrada em uma página cliente extensa. É uma base funcional para a web; ainda não está preparada para compartilhar regras entre web e mobile sem extrações.

### Estrutura observada

- **app/**: rotas do Next.js App Router, incluindo a página inicial, o endpoint de sorteio e um placeholder de receita.
- **services/recipes.js**: consulta receitas publicadas, escolhe uma sugestão, busca ingredientes traduzidos e monta o objeto retornado à interface.
- **lib/supabase/server.js**: cria o cliente Supabase no servidor, usando a chave publicável e exigindo RLS.
- **lib/i18n.js**: catálogo de textos para inglês e português brasileiro.
- **supabase/**: seed e uma migração baseline. Não encontrei código de aplicação nessa pasta.
- **components/**, **config/** e **database/**: existem, mas não têm arquivos.
- Não encontrei testes nem script de testes no **package.json**.
- A aplicação usa JavaScript. O **jsconfig.json** configura o alias **@/**; não há **tsconfig.json** nem dependência de TypeScript.

### Separação atual

A separação existente é um bom começo:

- O Route Handler faz a validação dos parâmetros e traduz resultados em respostas HTTP: **app/api/meals/random/route.js**.
- O serviço concentra a consulta Supabase e a montagem da receita: **services/recipes.js**.
- O cliente Supabase está isolado e marcado como exclusivo do servidor: **lib/supabase/server.js**.

Mas **services/recipes.js** também decide a seleção aleatória e contém validações de categorias e idiomas. Assim, aplicação e infraestrutura estão acopladas: a regra de sugestão depende diretamente do cliente Supabase. A resposta retornada pela API também é um objeto JavaScript sem contrato ou tipo compartilhado explícito.

A página inicial, **app/page.js**, é um único Client Component. Ela contém layout, componentes visuais locais, estados, troca de idioma, seleção de categoria e chamada HTTP. O código usa **document**, eventos do navegador e **fetch** relativo à origem da aplicação. Isso torna a página específica para Next.js e navegador, e impede seu uso direto no React Native.

O catálogo de mensagens em **lib/i18n.js** é a parte mais próxima de um módulo compartilhável. Ainda assim, categorias e idiomas aparecem em mais de um lugar: na página, no serviço e nas mensagens. Essa duplicação pode causar divergências.

A página de receita em **app/recipes/slug/page.js** é um placeholder que sempre chama **notFound()**. Além disso, **slug** é um segmento literal da rota; ainda não é uma rota dinâmica para **/recipes/<slug>**.

### Compartilhamento entre web e mobile

**Boas candidatas a compartilhamento:**

- Regras puras de domínio, como categorias e idiomas suportados.
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

### Etapa 1 — Estabelecer contratos e comportamento atual

- Definir formatos de requisição, resposta, erros, categorias e idiomas.
- Adicionar validações e cobertura automatizada antes de refatorar.

### Etapa 2 — Separar domínio de infraestrutura

- Extrair regras puras de categoria, idioma e seleção.
- Criar uma porta de repositório e mover consultas para um adaptador Supabase exclusivo do servidor.

### Etapa 3 — Manter o Route Handler fino

- Deixar nele apenas parsing HTTP, chamada ao caso de uso e conversão de resultado em resposta.
- Preservar o endpoint existente para não quebrar o frontend.

### Etapa 4 — Reduzir o acoplamento da página

- Separar a interface em componentes e fluxo de apresentação.
- Manter browser APIs nos componentes cliente e reaproveitar apenas lógica pura.

### Etapa 5 — Introduzir TypeScript aos poucos

- Começar por **contracts**, **domain** e **application**.
- Migrar serviços, Route Handlers e telas em etapas.

### Etapa 6 — Criar o workspace quando o mobile entrar no escopo

- Separar **apps/web**.
- Criar **apps/mobile** com Expo.
- Configurar os pacotes compartilhados sem misturar componentes web e nativos.

### Etapa 7 — Integrar o mobile pela API

- Usar um cliente HTTP compartilhado, com configuração da URL por ambiente, erros previsíveis e timeout.
- Não expor chave **service_role** nem conectar o app mobile diretamente ao banco com privilégios.

## Riscos a controlar

- A duplicação atual de categorias e idiomas pode gerar comportamento diferente entre interface e serviço.
- O formato da resposta da API ainda não está declarado como contrato compartilhado.
- Refatorar a página ou mover diretórios antes de testes cria risco de regressão na troca de idioma e no sorteio.
- Componentes web não serão reutilizáveis diretamente em React Native; tentar compartilhar esses componentes aumentaria a complexidade.
- O acesso mobile dependerá da disponibilidade e estabilidade da API hospedada; não existe hoje um cliente HTTP reutilizável ou estratégia offline.
- A rota de detalhe ainda não está implementada como segmento dinâmico.

## Próximo passo recomendado

Antes de criar o app mobile ou mover a estrutura, formalizar e testar o contrato do endpoint de sorteio. Isso estabelece a fronteira que web e Expo poderão consumir e permite extrair regras sem interromper o que já funciona.