# WhatToEat — Análise da Arquitetura Web e Mobile

## Objetivo e estado da revisão

Este documento descreve a arquitetura que existe no repositório em 12/11/2026 e sua adequação a uma futura aplicação React Native/Expo. A leitura incluiu código, configuração e confirmações manuais relatadas pelo usuário. A atualização alterou apenas documentação: não foram executados testes nem operações no Supabase.

O WhatToEat é uma aplicação web em desenvolvimento, ainda não publicada. Utiliza Next.js 16.4.6 App Router, JavaScript, React 19, Tailwind CSS 4 e Supabase. O banco remoto tem o baseline `20261111233556` e a migration editorial `20261112035903_admin_editorial_and_storage` registrados como aplicados. A reprodução dessas migrations em banco isolado e as verificações SQL pgTAP permanecem pendentes.

## Diagnóstico da arquitetura atual

O projeto é um monólito modular: Next.js hospeda apresentação e Route Handlers, enquanto módulos de negócio isolam domínio, casos de uso e adaptadores Supabase. A arquitetura usa funções puras, factories/objetos de dependência e injeção de repositórios onde útil. Não é MVC tradicional e não introduz classes de domínio por convenção.

### Estrutura existente

```text
app/
  admin/                         # telas do painel e componentes de apresentação
  api/                           # Route Handlers públicos e administrativos
  recipes/[slug]/                # detalhe público de receita
  page.js                        # página inicial pública
modules/
  admin/
    domain/                      # autorização e métricas editoriais
    application/                 # caso de uso do dashboard e navegação
    infrastructure/supabase/     # autorização, leitura do dashboard e recovery
    presentation/http/           # handlers reutilizáveis de administração/Auth
  ingredients/
    domain/                      # tradução/mapeamento e validação
    infrastructure/supabase/     # repositório administrativo
  recipes/
    domain/                      # idiomas, slug, porções, status e validação
    application/                 # casos de uso públicos
    infrastructure/supabase/     # leitura pública, editorial e Storage
shared/http/                     # parsing, origem, respostas sem cache e erros admin
services/                        # composição server-only dos casos de uso
lib/                             # i18n, Auth e compatibilidade de APIs
domain/                          # fachadas legadas para funções puras
tests/                           # testes Node por domínio, aplicação e API
supabase/                        # migrations, seed e testes SQL preparados
```

Rotas administrativas existentes incluem login, recuperação/redefinição de senha, dashboard, receitas, ingredientes e upload/remoção de imagens. As APIs públicas expõem o sorteio e a leitura de uma receita publicada por slug.

### Responsabilidades por camada

- **Presentation:** `app/` contém páginas, componentes React e adaptadores HTTP do Next.js. Os componentes cuidam de entrada, estado visual, acessibilidade e chamadas HTTP; não devem consultar Supabase diretamente.
- **Application:** `modules/*/application/` coordena casos de uso e recebe dependências por parâmetro. Exemplo: carregar receita publicada ou calcular o resumo administrativo.
- **Domain:** `modules/*/domain/` concentra regras puras, como categorias/idiomas, slug, porções, validação editorial, completude de tradução e métricas do dashboard. Essa camada não deve importar Next.js, Supabase ou DOM.
- **Infrastructure:** `modules/*/infrastructure/supabase/` implementa repositórios e autorização ligada à sessão. A conexão usa cliente server-side com a chave publicável e RLS; nenhuma chave `service_role` é usada para contornar políticas.
- **Shared:** `shared/http/` contém regras HTTP transversais administrativas, como leitura de corpo, validação de origem, respostas `no-store`, mapeamento seguro de erro e autorização por requisição.
- **Composition:** `services/` cria o cliente de servidor e conecta repositórios aos casos de uso. As fachadas antigas em `domain/`, `services/` e `lib/api/` preservam imports existentes; não são automaticamente desnecessárias e devem ser removidas só após rastrear referências.

### Regras relevantes já implementadas

- Toda API e página administrativa valida sessão/identidade no servidor e `app_metadata.role === "admin"`; RLS permanece como segunda camada no PostgreSQL.
- A interface administrativa é exclusivamente pt-BR. Conteúdo editorial de receitas e ingredientes pode ser preenchido em pt-BR e inglês.
- Rascunhos podem ser salvos incompletos; publicação exige os campos editoriais essenciais. A regra de completude de tradução é função de domínio compartilhada, não regra exclusiva da interface.
- Dashboard e listagem calculam pendências de tradução e ausência de imagem a partir de regras de domínio. Os filtros e links existem; a reconciliação manual de cada contagem com os resultados filtrados ainda não está registrada.
- O usuário confirmou manualmente login, indicadores do dashboard, fluxos editoriais de receita, pesquisa/seleção de ingredientes, publicação/despublicação, upload/substituição/remoção de imagens e a correção de renderização dos detalhes. Isso não comprova a matriz completa de RLS nem substitui E2E.
- Recuperação de senha está implementada em código, incluindo solicitação genérica, callback Supabase e autorização temporária para redefinição; falta validar entrega e link porque o serviço de e-mail está temporariamente indisponível.

### Frontend público e estado de produto

A página inicial (`app/page.js`) combina apresentação, estado do sorteio e chamadas HTTP em um Client Component extenso; é o principal ponto de concentração visual identificado. A rota dinâmica `app/recipes/[slug]/page.js` busca conteúdo no servidor e delega interações a componentes cliente: quantidades, checklist, modo cozinha e compartilhamento.

O locale padrão é `pt-BR`; `en` é selecionado por `?locale=en`. A API resolve slug por receita e idioma. Atualmente o schema ainda guarda slug em `recipe_translations` por idioma. O código prefere o slug pt-BR e redireciona slugs alternativos para o canônico, e o editor usa um único slug para novas alterações; portanto, a experiência canônica está implementada em aplicação, mas a consolidação completa dos slugs no modelo/banco está pendente e requer estratégia/migração aprovada.

O catálogo e o editor administrativo integram receitas e ingredientes compartilhados. Ingredientes podem ser pesquisados pelo identificador e pelos nomes nos dois idiomas, vinculados com quantidade/unidade/observação e mantidos pela tela de catálogo.

## Supabase, autenticação e segurança

As migrations baseline e editorial estão registradas como aplicadas no histórico remoto. A migration editorial revoga privilégios excessivos nas tabelas editoriais, preserva leitura pública de conteúdo publicado, define operações administrativas com base em `app_metadata.role = 'admin'`, inclui funções RPC de persistência editorial e cria o bucket privado `recipe-images` com limites/tipos previstos. A inspeção estrutural remota anterior confirmou grants e políticas; isso não substitui testes comportamentais por papel.

Requisitos de implementação mantidos:

- Usar `@supabase/ssr` no servidor para Auth/sessão; decisões de permissão vêm de identidade validada pelo Supabase Auth, nunca de props ou controles de interface.
- Cada Route Handler/Server Action deve autorizar novamente a requisição direta. Sem sessão válida: 401; autenticado sem papel: 403.
- Validar corpo e origem para escritas quando aplicável, usar respostas administrativas sem cache e traduzir erros técnicos para mensagens pt-BR sem expor detalhes internos.
- Manter RLS como proteção independente. Não usar `service_role` para contornar autorização ou grants e não expor segredos ao browser.
- O Supabase público continua atendendo visitantes sem conta; cadastro público de Auth foi desativado segundo relato do usuário.

Pendências de segurança: executar baseline/migration em ambiente isolado, executar as 43 verificações SQL preparadas, testar anon/usuário comum/admin em banco e Storage, confirmar gates e configuração por ambiente antes de deploy e completar auditoria de abuse/CSRF, segredos e autorização.

## Testabilidade e qualidade

O repositório contém 15 arquivos de teste Node e 84 ocorrências `test()` observadas. O último resultado registrado (12/11/2026) foi 84 testes aprovados, lint e build aprovados, antes das alterações mais recentes de recuperação de senha e redesign da página de receita. Essa última alteração não foi revalidada pela suíte automatizada nesta atualização. Não há teste end-to-end automatizado nem integração de repositórios executada contra banco isolado. Os 43 testes pgTAP também não foram executados.

As confirmações manuais recentes devem ser entendidas como validação do fluxo administrativo pelo usuário, não como teste de segurança dos papéis nem cobertura E2E. Também não há confirmação manual de logout, sessão expirada, bloqueio de usuário comum, recuperação por e-mail, compartilhamento em dispositivos ou auditoria formal de todos os viewports.

## Preparação para React Native e Expo

### O que pode ser compartilhado futuramente

- Regras puras sem Next/DOM/Supabase: idioma/categoria, cálculo de porções, validação e normalização de dados, completude editorial quando fizer sentido, seleção determinística e formatação independente de plataforma.
- Contratos estáveis de API e catálogo de mensagens/labels, depois de formalizados e testados.
- Tokens de design em formato neutro, se a consistência visual justificar.

### O que deve continuar específico

- Componentes HTML/Tailwind, navegação `next/link`, páginas, Route Handlers, cookies e APIs Next.js.
- Clientes e repositórios Supabase do servidor, segredo e autorização administrativa.
- Componentes React Native, navegação Expo, armazenamento de sessão mobile e estilos nativos.

O futuro app mobile deve consumir os Route Handlers por HTTPS; não deve importar infraestrutura server-side nem receber segredo privilegiado. O aplicativo Expo ainda não existe e não há cliente HTTP compartilhado nem contrato de API formalizado.

### POO, SOLID e dependências

As decisões atuais seguem separação e inversão de dependências de forma funcional: casos de uso recebem repositórios, domain é puro e infraestrutura implementa os acessos externos. Classes só serão justificadas se houver estado/invariantes que realmente precisem ser encapsulados. Interfaces artificiais, hierarquias e microserviços não agregam valor neste estágio.

## Arquitetura de destino — somente quando web e contratos estiverem estáveis

Não há plano imediato de mover o repositório para monorepo. Se a segunda aplicação for priorizada, avaliar extração gradual, sem reescrita:

```text
apps/web/                       # Next.js, UI web e Route Handlers
apps/mobile/                    # Expo e UI React Native
packages/domain/                # regras puras compartilhadas
packages/contracts/             # parâmetros/respostas/erros estáveis
packages/api-client/            # cliente HTTP multiplataforma
packages/i18n/                  # mensagens/helpers independentes de DOM
supabase/                       # migrations, seed e testes SQL
```

`application` no servidor continua executando no backend; o mobile chama a API por HTTP. Não é necessário compartilhar a interface visual entre React web e React Native, nem mover a infraestrutura Supabase para o cliente mobile.

## Plano incremental e prioridades

1. Finalizar pendências funcionais/visuais da versão web, incluindo verificar correspondência entre contagens do dashboard e filtros de receitas.
2. Validar recuperação de senha quando o serviço de e-mail estiver disponível.
3. Auditar arquitetura e imports para decidir a necessidade real de fachadas antigas, sem apagar código antes de confirmar cobertura.
4. Investigar lentidão com medições de navegador, endpoints e consultas antes de otimizar.
5. Validar segurança em banco isolado e por matriz de papéis; corrigir falhas antes de produção.
6. Revisar funções públicas ainda pendentes, responsividade, acessibilidade, SEO e critérios de lançamento.
7. Preparar deploy Vercel e monitoramento; publicar somente depois de cumprir os critérios de segurança e operação.

## Principais riscos

- `app/page.js` acumula apresentação e estado; refatorar sem regressão exige testes e pequenas mudanças.
- Slugs são canônicos na experiência, mas armazenados por tradução no schema; antigos slugs podem existir como aliases até migração deliberada.
- Testes automatizados existentes não cobrem browser E2E, banco real ou RLS/Storage para todos os papéis.
- Código de recuperação não prova entrega de e-mail nem conclusão do callback no ambiente remoto.
- Desempenho ainda não tem baseline; alterações prematuras podem otimizar a causa errada.
- SEO, acessibilidade formal e deploy ainda não foram concluídos.
- O app Expo exigirá contratos estáveis, proteção de API e decisão própria de sessão; não deve compartilhar componentes web.
