# WhatToEat — Plano de Desenvolvimento

Roadmap oficial para desenvolver, proteger, lançar e monetizar o WhatToEat. Este documento registra o estado observado no código e no Supabase e organiza as próximas etapas para concluir primeiro a experiência web, mantendo as regras de domínio desacopladas para uma futura aplicação mobile.

## Estado atual verificado

Estado atualizado em 12/11/2026, com inspeção do repositório, execução de testes/lint/build, validações manuais relatadas pelo usuário e consultas somente de leitura ao Supabase realizadas anteriormente.

- **Aplicação:** Next.js App Router, JavaScript, React e Tailwind CSS. `package.json` contém comandos `dev`, `build`, `start`, `lint` e `test`.
- **Backend existente:** cliente Supabase server-only em `lib/supabase/server.js`; serviços em `services/recipes.js`; Route Handlers `GET /api/meals/random` e `GET /api/recipes/[slug]`.
- **Autenticação administrativa:** login e logout via Route Handlers com `@supabase/ssr`, cookies geridos no servidor e autorização baseada em `app_metadata.role = "admin"`. O usuário relata que cadastro público está desativado no Supabase e que criou/promoveu sua conta pelo Dashboard/SQL Editor.
- **Área administrativa:** `/admin/login`, rota protegida, layout responsivo, endpoint de resumo e cards do dashboard estão implementados. A rota verifica admin no servidor; o cliente só apresenta a resposta da API. A interface usa pt-BR. Devido às políticas RLS remotas atuais, apenas a contagem de receitas publicadas está disponível como dado real; os outros indicadores aparecem indisponíveis.
- **Frontend existente:** página inicial com sorteio, seleção das cinco categorias, estados de carregamento/erro/vazio, seletor ENGLISH/PORTUGUÊS e link “Ver receita”. A rota dinâmica `app/recipes/[slug]/page.js` apresenta detalhes e ajuste local das porções.
- **Idiomas:** interface em `lib/i18n.js`; `pt-BR` é o padrão e `en` é selecionado explicitamente por `?locale=en`. A seleção é preservada nos links entre a página inicial e os detalhes; a resolução do slug é independente do idioma solicitado.
- **Arquivos e histórico do banco:** existem `supabase/seed.sql`, `supabase/config.toml` e o baseline `supabase/migrations/20261111233556_initial_schema_baseline.sql`. A CLI Supabase v2.122.1 está fixada como dependência de desenvolvimento. O histórico remoto do projeto `agihkhcwaqprtftfjyyn` registra `20261111233556` como aplicada; o SQL do baseline não foi executado novamente no remoto.
- **Supabase remoto — tabelas e registros:** `recipes` (10), `recipe_translations` (20), `ingredients` (33), `ingredient_translations` (66) e `recipe_ingredients` (73). As 10 receitas estão publicadas, duas em cada categoria; existem 10 traduções de receita e 33 de ingrediente em cada idioma atual.
- **Relacionamentos principais:** receita → traduções e receita → itens de receita; item de receita → ingrediente; ingrediente → traduções. As chaves estrangeiras e unicidades foram inspecionadas. `instructions` tem constraint que exige array JSONB.
- **Integridade e acesso:** consulta somente de leitura de 12/11/2026 confirmou RLS nas cinco tabelas e políticas apenas de `SELECT` público sobre receitas publicadas e relações correspondentes. Não existe política administrativa. Grants amplos observados não removem a restrição de RLS. Nenhuma política foi alterada.
- **Testes e validação:** `npm test` passou com 57 testes (31 de API/domínio público, 13 de Auth/admin e 13 novos de API/serviço/cálculo do dashboard). `npm run lint` e `npm run build` passaram em 12/11/2026. Não há testes E2E; o dashboard não foi validado com uma sessão real nesta execução.
- **Validação manual anterior:** o usuário confirmou login real, autenticação e acesso administrativo. Não há confirmação manual de logout, expiração de sessão ou bloqueio de usuários comuns. Recuperação de senha continua pendente.
- **Limites da validação administrativa:** não há evidência manual de logout, sessão expirada ou bloqueio de usuário comum; esses cenários não estão registrados como validados manualmente. Recuperação de senha continua pendente. Testes automatizados de unidade/handlers não equivalem a validação end-to-end.
- **Limitações atuais confirmadas:** o baseline ainda não foi reproduzido em banco isolado, e o procedimento de promoção/rollback não está documentado. Faltam políticas RLS administrativas; dashboard está parcial e as métricas completas dependem delas. Não há bucket de Storage nem gestão editorial. Permanecem pendentes busca, filtros além de categoria, compartilhamento, funcionalidades de usuário ou monetização. A validação formal de responsividade e a configuração equivalente na Vercel também estão pendentes.
- **Configuração:** `.env.local` existe localmente. Valores não são reproduzidos neste documento. A presença do arquivo não comprova configuração equivalente na Vercel.

## Como acompanhar

- `[ ] Não iniciado`: a funcionalidade ainda não foi implementada ou validada integralmente.
- `[~] Parcial/em andamento`: existe implementação ou preparação, mas falta cumprir todo o critério de conclusão.
- `[x] Concluído`: há evidência no código ou no banco para o escopo descrito no item.
- Itens concluídos representam o escopo atual expressamente descrito; não significam que etapas futuras listadas como dependências também estejam concluídas.
- Cada tarefa registra objetivo, trabalho de backend, trabalho de frontend, dependências, validação e critério de conclusão.

## Ordem recomendada e dependências

1. Fechar a tarefa 1.3 reproduzindo o baseline em banco local isolado e documentando promoção/rollback; o histórico remoto já registra o baseline como aplicado.
2. Preparar a migration de leitura administrativa para `recipes` e `recipe_translations` (1.7), revisar e obter autorização antes de qualquer aplicação remota; validar anon/admin em ambiente isolado (1.10).
3. Após aprovação e aplicação da política, configurar `ADMIN_DASHBOARD_RLS_READY=true` somente no servidor, validar as cinco métricas contra o banco e então concluir 2.2.
4. Recuperação de senha (2.1) continua pendente; realizá-la sem criar fluxos públicos de cadastro.
5. Iniciar 2.3 somente após autorização própria, aplicando a regra de autenticação/autorização/RLS para cada operação de leitura ou escrita.
6. Depois da etapa administrativa planejada, retomar os fluxos públicos web pendentes (filtros 3.3, busca 3.5, compartilhamento 3.6 e validação responsiva formal 3.7); ainda faltam E2E, SEO, desempenho e acessibilidade antes do deploy.
7. Preparar deploy, configuração segura por ambiente e monitoramento na Vercel; manter `domain/` e contratos sem dependência de Next.js ou navegador; deixar Expo, recomendações regionais, publicidade e Premium para etapas posteriores.

---

## 1. Backend e banco de dados

### 1.1 Revisar a arquitetura atual — [x] Concluído

- **Objetivo:** registrar os limites atuais do monólito modular e identificar o que já existe antes de evoluir o backend.
- **Backend:** mapear `services/`, `lib/supabase/`, Route Handlers e chamadas ao banco.
- **Frontend:** mapear páginas App Router, componentes e chamadas feitas pela interface.
- **Dependências:** nenhuma.
- **Como testar e validar:** comparar inventário do repositório com `package.json` e o estado remoto do Supabase.
- **Critério para concluir:** este documento registra arquitetura, capacidades presentes e lacunas com evidências observadas.

### 1.2 Estrutura e relacionamentos das tabelas atuais — [x] Concluído

- **Objetivo:** estabelecer a fonte de verdade existente para receitas, traduções, ingredientes e quantidades.
- **Backend:** preservar as cinco tabelas e suas chaves, constraints, índices, RLS e trigger ao planejar mudanças.
- **Frontend:** manter os contratos de dados consumidos por página inicial, sorteador e futuras páginas.
- **Dependências:** revisão da arquitetura.
- **Como testar e validar:** comparar migrations futuras com as tabelas reais; conferir FKs, unicidades, constraints JSONB e políticas.
- **Critério para concluir:** relacionamentos e restrições reais foram inspecionados e estão descritos na seção “Estado atual verificado”.

### 1.3 Migrations e versionamento do banco — [~] Parcial

- **Objetivo:** tornar toda evolução do banco reproduzível, revisável e segura entre ambientes.
- **Backend:** baseline criado em `supabase/migrations/20261111233556_initial_schema_baseline.sql` e registrado como aplicado no histórico remoto pelo comando `supabase migration repair 20261111233556 --status applied`. O SQL não foi reaplicado no remoto. Ainda falta documentar o fluxo de aplicação, promoção e rollback.
- **Frontend:** não se aplica diretamente; alinhar versões de API e interface com mudanças de schema.
- **Dependências:** inventário atual do schema; acesso ao projeto local e remoto; cópia de segurança antes de alterações estruturais.
- **Como testar e validar:** reproduzir o baseline em banco local isolado, comparar o schema resultante com o remoto e revisar cada diff. O ambiente atual ainda precisa de runtime de contêiner para essa validação.
- **Critério para concluir:** schema reproduzível em ambiente novo, histórico versionado no repositório e procedimento de promoção/rollback documentado. O histórico remoto já contém a versão baseline.

### 1.4 Supabase Auth para administradores — [~] Parcial

- **Objetivo:** habilitar acesso autenticado ao painel, sem introduzir contas de usuário final no MVP público.
- **Backend:** integração SSR, sessão/cookies no servidor e endpoints de login/logout implementados. A configuração de recuperação de acesso não foi implementada.
- **Frontend:** login implementado; recuperação de senha permanece pendente. A interface administrativa usa pt-BR, sem seletor de idioma.
- **Dependências:** migrations versionadas; variáveis corretas por ambiente; fluxo de autorização de administrador definido.
- **Como testar e validar:** existem testes automatizados de handlers e sessão. O usuário validou manualmente login real, autenticação e acesso administrativo. Logout, sessão expirada e recuperação ainda não foram validados manualmente.
- **Critério para concluir:** fluxos de login/logout/recuperação e expiração cobertos; somente uma sessão válida de administrador entra; acesso público continua sem cadastro.

### 1.5 Autorização de administradores — [~] Parcial

- **Objetivo:** separar autenticação de autorização e limitar operações editoriais a administradores aprovados.
- **Backend:** `app_metadata.role = "admin"` é validado server-side em páginas/handlers de autenticação; autorização não depende do frontend. Ainda faltam proteger APIs editoriais futuras e integrar a matriz RLS administrativa.
- **Frontend:** login e página `/admin` provisória; a proteção efetiva é feita no servidor.
- **Dependências:** Supabase Auth; modelo de papéis; RLS e políticas administrativas.
- **Como testar e validar:** testes automatizados cobrem sem sessão, usuário sem role, administrador e falha do serviço. O usuário validou manualmente seu acesso como admin. Não há evidência manual registrada de bloqueio de usuário comum.
- **Critério para concluir:** cada operação administrativa futura verifica identidade e permissão no servidor e no banco quando aplicável; matriz de RLS correspondente validada.

### 1.6 Políticas RLS públicas — [x] Concluído para leitura pública

- **Objetivo:** permitir que o catálogo publicado seja lido publicamente sem liberar escrita anônima.
- **Backend:** as cinco tabelas têm RLS habilitado; as políticas verificadas limitam SELECT a receitas publicadas e dados relacionados.
- **Frontend:** a página pública lê receitas por meio da API server-side; não realiza escrita direta ao Supabase.
- **Dependências:** schema e relacionamentos existentes.
- **Como testar e validar:** consultas anônimas veem apenas dados de receitas publicadas; confirmar que INSERT/UPDATE/DELETE públicos não são permitidos.
- **Critério para concluir:** políticas observadas cobrem as cinco tabelas e preservam leitura publicada sem escrita pública.

### 1.7 Políticas RLS administrativas — [ ] Não iniciado

- **Objetivo:** permitir operações do painel apenas às identidades administrativas autorizadas.
- **Backend:** criar políticas de escrita e leitura de rascunhos vinculadas ao papel administrativo; evitar confiar em metadados editáveis pelo usuário.
- **Frontend:** enviar operações apenas pelas rotas administrativas protegidas.
- **Dependências:** Supabase Auth, autorização de administradores e migrations.
- **Como testar e validar:** testar cada operação por papel e estado; confirmar negação por anon e usuário sem permissão.
- **Critério para concluir:** matriz de autorização cobre tabelas e operações sem ampliar acesso público.

### 1.8 Supabase Storage para imagens — [ ] Não iniciado

- **Objetivo:** armazenar fotos reais de receitas com caminhos controlados e políticas adequadas.
- **Backend:** criar bucket privado ou público conforme a estratégia aprovada, validar MIME/tamanho, nomear objetos e definir regras de leitura/escrita/remoção.
- **Frontend:** permitir upload, pré-visualização, substituição e remoção no painel; renderizar imagens cadastradas no público.
- **Dependências:** autorização de administradores; políticas RLS; campos atuais `image_path` e `image_alt`.
- **Como testar e validar:** testar upload autorizado, bloqueio de upload anônimo, leitura conforme política, arquivos inválidos e imagens ausentes.
- **Critério para concluir:** imagens reais podem ser geridas por administradores e servidas no site sem caminhos fictícios ou permissões excessivas.

### 1.9 Serviços e APIs — [~] APIs públicas e autenticação administrativa inicial

- **Objetivo:** centralizar regras de domínio em serviços e expor contratos estáveis por Route Handlers.
- **Backend:** `GET /api/meals/random` consulta receitas publicadas, categoria, idioma, exclusão e receita específica. `GET /api/recipes/[slug]` carrega detalhes publicados, traduções e ingredientes; adicionar APIs administrativas depois.
- **Frontend:** página inicial consome a API existente; integrar novas telas aos contratos publicados, sem acesso privilegiado no cliente.
- **Dependências:** schema; políticas de leitura para API pública; Auth/RLS para APIs administrativas.
- **Como testar e validar:** conferir locale/categoria/UUID inválidos, estados 404/503/500, traduções e filtro por publicação; testar autorização das futuras rotas.
- **Cobertura atual:** 44 testes automatizados: 31 de API/domínio público e 13 de autenticação/autorização administrativa. Não existem ainda APIs de dashboard/escrita nem testes end-to-end.
- **Critério para concluir:** sorteio existente permanece funcional e cada novo endpoint tem validação de entrada, erros previsíveis e autorização adequada.

### 1.10 Testes de segurança e integridade do backend — [~] Parcial

- **Objetivo:** detectar acesso indevido e dados inconsistentes antes de expor novas operações.
- **Backend:** testes automatizados cobrem aspectos do fluxo Auth/admin e contratos públicos; faltam testes de RLS real, constraints no banco isolado, consistência relacional e Storage.
- **Frontend:** validar respostas de erro sem expor detalhes internos nem credenciais.
- **Dependências:** esquema versionado, APIs, Auth, autorização e Storage.
- **Como testar e validar:** executar testes automatizados em ambiente isolado com papéis anon, autenticado e administrador; manter nenhuma escrita na produção durante testes.
- **Critério para concluir:** cenários críticos de leitura, escrita, RLS, integridade e uploads têm resultados repetíveis e registrados.

---

## 2. Painel administrativo

### Regra permanente de segurança administrativa

- Cada Route Handler ou Server Action deve validar a sessão no backend com Supabase Auth e confirmar `app_metadata.role === "admin"` antes de ler dados privados ou executar operações.
- Responder HTTP 401 sem sessão válida e HTTP 403 para usuário autenticado sem autorização. Essas decisões nunca dependem do frontend ou dos parâmetros enviados pelo navegador.
- Validar dados no backend antes de persistir; proteger escritas contra CSRF e validar a origem quando aplicável.
- Manter RLS como defesa independente no Supabase. Nunca usar `service_role` para contornar autorização/RLS. Rotas privadas devem usar `no-store`.
- Mensagens técnicas não devem ser expostas; toda interface e mensagem administrativa é pt-BR. Traduções de receitas continuam disponíveis em pt-BR e en.
- Aplicar estas regras a toda funcionalidade administrativa futura, inclusive receitas, ingredientes, traduções, imagens, publicação e estatísticas.

### 2.1 Login e recuperação de senha — [~] Parcial

- **Objetivo:** permitir que administradores entrem e recuperem acesso ao painel.
- **Backend:** login/logout via Route Handlers e sessão SSR implementados; autorização de administrador verificada no servidor por `app_metadata.role`. Recuperação de senha não implementada.
- **Frontend:** `/admin/login`, mensagens genéricas em pt-BR, formulário e página administrativa provisória com logout. O idioma pt-BR é regra permanente para toda a área administrativa.
- **Dependências:** Auth e autorização iniciais (1.4–1.5) existem; recuperação segura e políticas RLS administrativas (1.7) ainda pendentes.
- **Como testar e validar:** 13 testes automatizados de autenticação/autorização. Validação manual relatada pelo usuário: login real, autenticação e acesso administrativo funcionaram. Não registrar como validação manual logout, expiração ou negativa a usuários comuns, pois não há evidência. Recuperação e end-to-end seguem pendentes.
- **Critério para concluir:** login, logout e recuperação com mensagens que não enumeram contas; acesso negado sem sessão/role válida; cenários automatizados e manuais registrados.

### 2.2 Dashboard — [~] Parcial

- **Objetivo:** oferecer uma visão operacional do catálogo e dos itens que exigem revisão.
- **Indicadores:** total de receitas; publicadas (`status = 'published'`); rascunhos (`status = 'draft'`); sem imagem (`image_path` nulo ou vazio); traduções pendentes para `pt-BR` e `en`. Proposta para pendência: contar uma receita uma única vez se faltar qualquer um dos dois idiomas ou se uma tradução tiver título vazio/instruções sem etapas; descrição é opcional no schema atual e não deve ser exigida sem decisão editorial.
- **Backend implementado:** `GET /api/admin/dashboard/summary` verifica `requireAdmin()` antes de qualquer consulta. `services/admin/dashboard-summary.js` usa o cliente Supabase SSR autenticado, sem chave privilegiada. A rota retorna HTTP 401/403 e aplica `no-store`.
- **Frontend implementado:** shell administrativo responsivo com navegação, botão de saída, cinco cards, carregamento, erro, tentativa novamente, aviso de permissão RLS incompleta e atalhos desabilitados para receitas/ingredientes. Todo texto está em pt-BR; o client chama apenas a API e não acessa Supabase.
- **RLS remota confirmada:** as cinco tabelas têm RLS ativo e foram encontradas apenas políticas públicas de SELECT para linhas ligadas a receitas publicadas. Como PostgREST oculta linhas sem erro, contar `recipes` no escopo completo seria incorreto. Por isso, sem a configuração server-side `ADMIN_DASHBOARD_RLS_READY=true`, a API retorna somente a contagem exata de publicadas; total, rascunhos, sem imagem e traduções pendentes ficam `null`/“Indisponível”, nunca como zero ou totais incompletos.
- **Dependências para concluir:** validar o baseline em ambiente isolado (1.3); revisar e aprovar migration de SELECT administrativo em `recipes` e `recipe_translations` (1.7); testar políticas para anon/admin em ambiente isolado (1.10). Só então definir `ADMIN_DASHBOARD_RLS_READY=true` no ambiente server-side e validar todas as métricas. Nenhuma migration foi executada nesta etapa.
- **Regra de tradução pendente:** uma receita conta uma vez se faltar tradução `pt-BR` ou `en`, se o título estiver vazio ou se o array de instruções não tiver etapas. `description` é opcional pelo schema atual.
- **Arquivos criados/modificados:** `domain/admin-dashboard.mjs`, `services/admin/dashboard-summary.mjs`, `services/admin/dashboard-summary.js`, `lib/api/admin-dashboard.mjs`, `app/api/admin/dashboard/summary/route.js`, `app/admin/admin-shell.js`, `app/admin/dashboard-client.js`, `app/admin/(protected)/layout.js` e `app/admin/(protected)/page.js`.
- **Testes:** 57 passaram. Foram acrescentados 10 testes de autorização do endpoint, comportamento seguro com RLS pendente e cálculo/paginação das métricas. Ainda não há E2E nem verificação visual automatizada em navegador.
- **Critério para concluir:** indicadores completos e conferidos contra o banco após RLS revisada; endpoint exige admin para acesso direto; consultas usam usuário autenticado e RLS; interface é apenas apresentação em pt-BR; atalhos não apontam para páginas inexistentes.

### 2.3 Cadastro, edição, exclusão e publicação de receitas — [ ] Não iniciado

- **Objetivo:** gerir o ciclo editorial de receitas revisadas manualmente.
- **Backend:** implementar endpoints protegidos para criar, atualizar, arquivar/excluir e mudar `draft`/`published`, respeitando constraints e relações.
- **Frontend:** implementar formulário e lista de receitas com rascunho, publicação, despublicação e confirmação de exclusão.
- **Dependências:** migrations, Auth, autorização, RLS e APIs administrativas.
- **Como testar e validar:** validar ciclo completo em ambiente de teste, incluindo erro de tradução incompleta e bloqueio por papel insuficiente.
- **Critério para concluir:** ações são autorizadas e atômicas; apenas conteúdo completo e revisado pode ser publicado.

### 2.4 Cadastro de ingredientes, quantidades e unidades — [ ] Não iniciado

- **Objetivo:** manter ingredientes reutilizáveis e vínculos ordenados com cada receita.
- **Backend:** criar operações para ingredientes, traduções e `recipe_ingredients`; validar quantidade, unidade, exclusividade e ordem.
- **Frontend:** oferecer busca/seleção de ingredientes, edição de quantidade/unidade, observações e reordenação.
- **Dependências:** tarefa 2.3; schema atual e políticas administrativas.
- **Como testar e validar:** testar ingrediente reutilizado, quantidades numéricas/textuais, unidade opcional, ordem e remoção respeitando FKs.
- **Critério para concluir:** receita salva mantém vínculos íntegros e a ordem apresentada corresponde à ordem cadastrada.

### 2.5 Traduções de receitas e ingredientes — [ ] Não iniciado

- **Objetivo:** permitir conteúdo editorial consistente em todos os idiomas habilitados.
- **Backend:** persistir traduções únicas por idioma para receitas e ingredientes; validar slug por idioma e instruções em array JSONB.
- **Frontend:** fornecer campos por idioma, estado de completude e indicação de tradução faltante.
- **Dependências:** tarefa 2.3, tarefa 2.4 e arquitetura da seção 5.
- **Como testar e validar:** salvar/editar cada idioma, detectar slug duplicado e testar que o público recebe o idioma solicitado.
- **Critério para concluir:** nenhum conteúdo publicado é apresentado como traduzido sem os campos obrigatórios naquele idioma.

### 2.6 Upload e gestão de imagens — [ ] Não iniciado

- **Objetivo:** associar imagens reais às receitas e textos alternativos localizados.
- **Backend:** usar Storage com políticas administrativas e salvar/remover o caminho do objeto de forma consistente.
- **Frontend:** implementar upload, pré-visualização, substituição, remoção e entrada de texto alternativo.
- **Dependências:** tarefa 1.8 e formulário de receitas.
- **Como testar e validar:** testar arquivos permitidos/negados, acessibilidade sem imagem e consistência entre objeto e `image_path`.
- **Critério para concluir:** imagens podem ser atualizadas sem deixar referências quebradas e sem aceitar uploads não autorizados.

### 2.7 Validação dos formulários administrativos — [ ] Não iniciado

- **Objetivo:** impedir publicação de dados incompletos ou incompatíveis com o schema.
- **Backend:** validar novamente todas as entradas no servidor e mapear constraints para erros compreensíveis.
- **Frontend:** validar campos obrigatórios, duração, porções, categoria, dificuldade, ingredientes, instruções, slugs e traduções.
- **Dependências:** tarefas 2.3–2.6 e constraints existentes.
- **Como testar e validar:** submeter entradas vazias, limites inválidos, duplicados, strings extensas e payloads alterados diretamente.
- **Critério para concluir:** validação no cliente ajuda o editor e validação no servidor/banco continua sendo a autoridade final.

---

## 3. Frontend público

### 3.1 Página inicial — [x] Concluído para o escopo atual

- **Objetivo:** apresentar a proposta do WhatToEat e iniciar a descoberta de uma refeição.
- **Backend:** a página consome a API pública de sorteio e recebe dados reais do Supabase.
- **Frontend:** página existente com identidade visual, estados de carregamento/erro/vazio, conteúdo traduzido e espaço gráfico quando não há imagem.
- **Dependências:** API pública e conteúdo publicado.
- **Como testar e validar:** verificar que a página não inventa receitas quando a consulta falha e que estados vazios/erro aparecem corretamente.
- **Critério para concluir:** a página inicia o fluxo sem depender de cadastro e exibe apenas dados reais retornados pelo serviço.

### 3.2 Sorteador e categorias — [x] Concluído para o escopo atual

- **Objetivo:** sortear uma receita publicada, opcionalmente dentro de uma categoria.
- **Backend:** endpoint aceita categoria, idioma, exclusão da última receita e busca por ID para troca de idioma.
- **Frontend:** botão de sorteio e cinco categorias já estão conectados; a próxima sugestão evita repetir a atual quando há alternativas.
- **Dependências:** RLS pública e traduções do catálogo.
- **Como testar e validar:** testar cada categoria, idioma, catálogo vazio, erro de conexão e repetição quando só existe uma alternativa.
- **Critério para concluir:** sorteio usa receitas publicadas e mantém categoria/idioma selecionados sem duplicar registros.

### 3.3 Filtros além da categoria — [ ] Não iniciado

- **Objetivo:** ajudar visitantes a restringir receitas por critérios úteis, como tempo ou ingredientes disponíveis.
- **Backend:** definir filtros permitidos e consultas indexadas sem ampliar exposição de dados.
- **Frontend:** adicionar controles acessíveis e manter o sorteio coerente com filtros ativos.
- **Dependências:** catálogo consistente, API pública e definição de critérios editoriais.
- **Como testar e validar:** combinar filtros, categoria e idioma; confirmar resultados e estado vazio para combinações sem receitas.
- **Critério para concluir:** filtros documentados funcionam em conjunto e não escondem erros como ausência de resultados.

### 3.4 Página individual de receita — [x] Concluído para o escopo atual

- **Objetivo:** oferecer URL compartilhável com conteúdo completo de uma receita por idioma.
- **Backend:** `GET /api/recipes/[slug]` e `services/recipes.js` resolvem o slug independentemente do idioma, retornam a tradução e ingredientes no idioma solicitado e filtram receitas publicadas; conteúdo ausente/despublicado retorna 404.
- **Frontend:** `app/recipes/[slug]/page.js` apresenta detalhes, imagem quando disponível e espaço reservado quando ausente. `RecipePortionAdjuster` recalcula quantidades na aplicação a partir das porções originais, sem gravar no Supabase.
- **Dependências:** API de leitura por slug, traduções e Storage opcional.
- **Como testar e validar:** 8 testes automatizados cobrem o contrato da API e 8 testes cobrem regras de idioma, slug e porções. O usuário validou manualmente no navegador a página, a navegação e o ajuste de porções. Não há teste end-to-end automatizado; responsividade formal segue na tarefa 3.7.
- **Critério para concluir:** páginas apresentam receita, ingredientes, preparo, metadados e idioma corretos sem revelar rascunhos. Critério atendido para o escopo atual, com validação manual registrada; automação end-to-end permanece pendente em 7.1.

### 3.5 Busca — [ ] Não iniciado

- **Objetivo:** localizar receitas pelo título ou ingrediente no idioma selecionado.
- **Backend:** definir busca textual e índices adequados, com filtro por publicação e idioma.
- **Frontend:** adicionar campo de busca, resultados, estado sem correspondências e limpeza da busca.
- **Dependências:** página individual, conteúdo traduzido e decisão de busca do banco/API.
- **Como testar e validar:** testar acentos, termos parciais, ingredientes, idioma, paginação e entradas vazias.
- **Critério para concluir:** busca não retorna rascunhos e os resultados levam a páginas de receita válidas.

### 3.6 Compartilhamento — [ ] Não iniciado

- **Objetivo:** permitir que visitantes compartilhem receitas por URL e canais comuns.
- **Backend:** fornecer URLs canônicas e metadados por slug/idioma.
- **Frontend:** adicionar ação de copiar link e compartilhamento nativo quando suportado, com fallback acessível.
- **Dependências:** página individual e metadados SEO.
- **Como testar e validar:** abrir links em nova sessão e validar URL, idioma, preview e feedback de cópia.
- **Critério para concluir:** link compartilhado abre a mesma receita publicada e mostra idioma e preview corretos.

### 3.7 Layout responsivo — [~] Parcial

- **Objetivo:** manter uso confortável em mobile, tablet e desktop.
- **Backend:** garantir respostas e payloads que não dependam do tamanho de tela.
- **Frontend:** a página inicial contém breakpoints responsivos; aplicar os mesmos critérios às futuras telas.
- **Dependências:** cada página pública e administrativa.
- **Como testar e validar:** validar larguras pequenas, tablet e desktop, rolagem, área de toque e ausência de overflow horizontal.
- **Critério para concluir:** fluxos essenciais são utilizáveis nos viewports definidos e a validação está registrada por página.

---

## 4. Funcionalidades inteligentes

### 4.1 Modelo regional — [ ] Não iniciado

- **Objetivo:** representar regiões de forma consistente para adaptar sugestões sem depender de inferências não confirmadas.
- **Backend:** decidir taxonomia, vínculo de receitas/regiões e forma de obter região escolhida pelo visitante.
- **Frontend:** oferecer escolha explícita da região e explicar como ela influencia resultados.
- **Dependências:** arquitetura de conteúdo; idiomas; política de privacidade se forem usados dados de localização.
- **Como testar e validar:** testar regiões sem conteúdo, mudança manual de região e ausência de geolocalização.
- **Critério para concluir:** região usada é explícita, documentada e não exige localização precisa por padrão.

### 4.2 Receitas típicas e recomendações regionais — [ ] Não iniciado

- **Objetivo:** destacar pratos típicos e adequados à região selecionada.
- **Backend:** manter associações revisadas entre receita e região e fornecer consulta filtrada.
- **Frontend:** identificar sugestões regionais e manter sorteio/categorias utilizáveis sem região selecionada.
- **Dependências:** modelo regional e catálogo editorial ampliado.
- **Como testar e validar:** revisar exemplos com pessoas familiarizadas com cada região e confirmar fallback quando não houver sugestões.
- **Critério para concluir:** recomendações regionais têm origem editorial verificável e não classificam pratos por suposição automática.

### 4.3 Ingredientes fáceis de encontrar localmente — [ ] Não iniciado

- **Objetivo:** priorizar receitas cujos ingredientes sejam acessíveis na região escolhida.
- **Backend:** definir disponibilidade, sinônimos locais e substituições revisadas sem alterar ingredientes originais silenciosamente.
- **Frontend:** mostrar disponibilidade/substituições com contexto e permitir ao visitante desativar essa preferência.
- **Dependências:** modelo regional, traduções, curadoria e validação culinária.
- **Como testar e validar:** revisar nomes e substituições por região e testar que a receita original continua identificável.
- **Critério para concluir:** sugestão de disponibilidade é transparente, revisada e não substitui ingrediente sem consentimento.

### 4.4 Preferências do visitante — [ ] Não iniciado

- **Objetivo:** permitir escolhas como restrições, tempo e categorias preferidas sem adicionar contas no MVP.
- **Backend:** definir se preferências serão apenas locais ou persistidas posteriormente; validar filtros recebidos.
- **Frontend:** oferecer controles claros, opcionais e fáceis de limpar.
- **Dependências:** filtros públicos; decisão de privacidade e retenção; Auth futura caso a sincronização entre dispositivos seja aprovada.
- **Como testar e validar:** testar preferências combinadas, limpeza, recusa e comportamento sem perfil persistido.
- **Critério para concluir:** a experiência funciona sem cadastro e explica quando uma preferência é salva localmente ou remotamente.

### 4.5 Recomendações personalizadas — [ ] Não iniciado

- **Objetivo:** adaptar sugestões às escolhas declaradas e ao uso, com regras compreensíveis.
- **Backend:** começar com regras determinísticas e conteúdo revisado; definir eventos mínimos e retenção antes de coleta de uso.
- **Frontend:** explicar motivos da recomendação e oferecer controle para redefinir preferências.
- **Dependências:** preferências, catálogo regional, política de privacidade e validação de qualidade.
- **Como testar e validar:** comparar recomendações com cenários conhecidos e testar ausência de histórico ou dados pessoais.
- **Critério para concluir:** recomendações são úteis, explicáveis e degradam para o sorteio atual sem dados do visitante.

---

## 5. Internacionalização

### 5.1 Português brasileiro e inglês — [x] Concluído para o catálogo atual

- **Objetivo:** oferecer interface e conteúdo de receita em pt-BR e en.
- **Backend:** serviço filtra `recipe_translations` e `ingredient_translations` pelo código solicitado.
- **Frontend:** dicionário `lib/i18n.js`, seletor de idioma e atualização do `lang` do documento já existem.
- **Dependências:** tabelas de tradução e políticas públicas.
- **Como testar e validar:** foram confirmadas 10 traduções de receitas e 33 de ingredientes por idioma no banco; testar alternância de idioma na mesma receita.
- **Critério para concluir:** os dois idiomas funcionam na interface e para as 10 receitas atuais, inclusive ingredientes e instruções.

### 5.2 Arquitetura para novos idiomas — [ ] Não iniciado

- **Objetivo:** permitir adicionar idiomas sem duplicar páginas ou lógica de negócio.
- **Backend:** documentar código de idioma, cobertura de tradução e comportamento quando faltar conteúdo; ajustar allowlist somente junto com conteúdo completo.
- **Frontend:** organizar dicionários e seletor para novas opções com fallback da interface claramente definido.
- **Dependências:** processo editorial de tradução e cobertura de receitas/ingredientes.
- **Como testar e validar:** adicionar idioma de teste em ambiente isolado e verificar interface, API, slugs e dados incompletos.
- **Critério para concluir:** um novo idioma pode ser habilitado sem fallback silencioso de conteúdo no idioma errado.

### 5.3 Fluxo de revisão e completude das traduções — [ ] Não iniciado

- **Objetivo:** manter qualidade e consistência das traduções de interface, receitas, ingredientes e imagens.
- **Backend:** definir relatórios de campos faltantes por idioma e impedir publicação incompleta conforme a regra editorial aprovada.
- **Frontend:** mostrar completude no painel e indicar idioma do conteúdo ao editor.
- **Dependências:** painel administrativo, novos idiomas e política de publicação.
- **Como testar e validar:** criar receita com campos ausentes e confirmar que o painel sinaliza o problema e o público não recebe conteúdo incorreto.
- **Critério para concluir:** cada idioma publicado tem checklist de conteúdo completo e revisão registrada.

---

## 6. Monetização

### 6.1 Google AdSense e estratégia de publicidade — [ ] Não iniciado

- **Objetivo:** avaliar publicidade sem prejudicar leitura, acessibilidade ou confiança no catálogo.
- **Backend:** preparar configuração de domínio, anúncios e controles de privacidade exigidos para os mercados atendidos.
- **Frontend:** definir posições que não interrompam instruções, sorteio ou navegação mobile.
- **Dependências:** lançamento público, conteúdo original suficiente, SEO, política de privacidade e requisitos atuais do AdSense.
- **Como testar e validar:** revisar requisitos vigentes, desempenho, layout shift, acessibilidade e experiência com/sem anúncios.
- **Critério para concluir:** estratégia documentada e aprovação/configuração concluída antes de inserir anúncios em produção.

### 6.2 Recursos Premium — [ ] Não iniciado

- **Objetivo:** definir valor pago futuro sem incluir recursos Premium no MVP atual.
- **Backend:** desenhar catálogo de planos, cobrança, entitlement e proteção de operações pagas; decidir Auth de usuários finais.
- **Frontend:** apresentar benefícios, estado de assinatura e fluxos de pagamento após aprovação do produto.
- **Dependências:** pesquisa de usuários, Auth, política de cobrança, segurança e privacidade.
- **Como testar e validar:** testar estados de compra, falha, cancelamento e expiração em sandbox, incluindo acesso revogado.
- **Critério para concluir:** recursos pagos têm regras verificadas no servidor e não bloqueiam funcionalidades gratuitas já anunciadas.

### 6.3 Aquisição e retenção de usuários — [ ] Não iniciado

- **Objetivo:** atrair visitantes relevantes e incentivar retorno sem coleta excessiva.
- **Backend:** definir analytics mínimos e eventos agregados com política de retenção e consentimento quando aplicável.
- **Frontend:** planejar landing, conteúdo compartilhável, newsletter ou retorno apenas após decisão de privacidade e produto.
- **Dependências:** SEO, páginas de receita, política de privacidade e estratégia de monetização.
- **Como testar e validar:** medir canais e conversão com eventos aprovados, sem enviar dados pessoais desnecessários.
- **Critério para concluir:** estratégia documentada com métricas, limites de privacidade e metas revisáveis.

---

## 7. Testes e lançamento

### 7.1 Testes funcionais — [~] Parcial

- **Objetivo:** validar fluxos públicos e administrativos antes de cada lançamento.
- **Backend:** cobrir contratos de API, validações, traduções, consultas e respostas de erro.
- **Frontend:** cobrir sorteio, idioma, categorias, páginas de receita, formulários e estados de erro.
- **Dependências:** funcionalidades correspondentes e decisão de framework de testes.
- **Como testar e validar:** executar testes automatizados em CI e uma lista de verificação manual para fluxos críticos.
- **Estado atual:** há 44 testes automatizados: 15 da API de sorteio, 8 da API de detalhes, 8 de regras de domínio e 13 de autenticação/autorização administrativa. Em 12/11/2026, `npm test`, `npm run lint` e `npm run build` passaram. O usuário confirmou manualmente detalhes/navegação/porções e, separadamente, login real/autenticação/acesso administrativo. Não há testes end-to-end automatizados; logout, expiração e bloqueio manual de usuários comuns não foram confirmados.
- **Critério para concluir:** fluxos críticos públicos e administrativos têm cobertura repetível e bloqueiam regressões antes do deploy.

### 7.2 Testes de segurança — [ ] Não iniciado

- **Objetivo:** comprovar que dados de rascunho, operações administrativas e uploads não são acessíveis sem autorização.
- **Backend:** testar RLS, papéis, rotas, Storage, entradas malformadas, segredos e limites de abuso.
- **Frontend:** confirmar que erros não expõem chaves, tokens ou detalhes internos.
- **Dependências:** Auth, autorização, RLS administrativas e Storage.
- **Como testar e validar:** executar matriz anon/usuário/admin e revisar logs e configuração em ambiente não produtivo.
- **Critério para concluir:** não há acesso não autorizado nos cenários definidos e achados críticos foram corrigidos.

### 7.3 SEO — [ ] Não iniciado

- **Objetivo:** tornar receitas públicas encontráveis e compartilháveis em cada idioma.
- **Backend:** gerar metadados por slug, sitemap, canonical e alternates de idioma somente para conteúdo publicado.
- **Frontend:** ampliar metadados atuais da aplicação com título/descrição, dados estruturados e preview por receita.
- **Dependências:** página individual, slugs traduzidos e política de publicação.
- **Como testar e validar:** inspecionar HTML renderizado, sitemap, canonical, hreflang e previews com validadores públicos.
- **Critério para concluir:** páginas indexáveis descrevem o conteúdo correto e páginas não publicadas ficam fora do índice.

### 7.4 Desempenho — [ ] Não iniciado

- **Objetivo:** manter carregamento rápido e consultas eficientes em redes e dispositivos comuns.
- **Backend:** medir consultas, limites, índices e payloads; otimizar com evidência antes de alterar o banco.
- **Frontend:** otimizar imagens reais, fontes, JavaScript e renderização responsiva.
- **Dependências:** páginas e imagens implementadas, tráfego de referência e orçamento de performance definido.
- **Como testar e validar:** coletar métricas de laboratório e produção, incluindo Core Web Vitals e carga das APIs.
- **Critério para concluir:** metas acordadas são atingidas nos fluxos e dispositivos prioritários sem perda funcional.

### 7.5 Acessibilidade — [ ] Não iniciado

- **Objetivo:** tornar sorteio, seletor de idioma, receitas e painel operáveis por teclado e tecnologias assistivas.
- **Backend:** garantir mensagens de erro e conteúdo semântico no contrato de API.
- **Frontend:** revisar foco, nomes acessíveis, contraste, ordem de navegação, leitores de tela e movimento reduzido.
- **Dependências:** cada interface implementada.
- **Como testar e validar:** auditoria automática mais revisão manual de teclado e leitor de tela em desktop/mobile.
- **Critério para concluir:** não há barreiras críticas nos fluxos essenciais e as pendências restantes têm plano registrado.

### 7.6 Deploy na Vercel — [ ] Não iniciado

- **Objetivo:** publicar versões reproduzíveis com configuração segura por ambiente.
- **Backend:** configurar URLs e publishable key do Supabase na Vercel; garantir ausência de chaves privilegiadas no cliente.
- **Frontend:** validar build de produção, domínio, rotas, cache, páginas e funcionamento mobile no deploy.
- **Dependências:** migrations aprovadas, variáveis seguras, conteúdo publicado e checks de lançamento.
- **Como testar e validar:** deploy de preview, smoke tests, revisão de logs e promoção controlada para produção.
- **Critério para concluir:** versão publicada passa build e smoke tests, usa variáveis corretas e tem procedimento de rollback.

### 7.7 Monitoramento e operação — [ ] Não iniciado

- **Objetivo:** detectar falhas de API, banco, uploads e experiência após o lançamento.
- **Backend:** configurar logs e alertas sem registrar segredos ou conteúdo sensível desnecessário.
- **Frontend:** medir erros de navegação e desempenho com a política de privacidade aprovada.
- **Dependências:** deploy na Vercel, política de retenção e plano de suporte.
- **Como testar e validar:** provocar falhas controladas em staging e confirmar alertas, contexto e procedimento de resposta.
- **Critério para concluir:** alertas têm responsáveis, limites, documentação de resposta e revisão periódica.

---

## Decisões de escopo registradas

- O MVP público permanece sem cadastro/autenticação de usuários finais.
- Auth e autorização administrativa são requisitos do painel e devem ser planejados separadamente do usuário público.
- Receitas permanecem cadastradas e revisadas manualmente; o roadmap não pressupõe geração por IA.
- Favoritos e planejamento semanal não fazem parte da implementação atual; podem ser reavaliados junto às preferências/Premium, sem antecipar mudanças no schema.
- Nenhuma etapa futura deste documento autoriza, por si só, alterações no Supabase de produção. Migrations e deploys devem passar pelo fluxo de revisão e validação descrito acima.
- A versão web é a prioridade imediata. A futura versão Expo deve reutilizar regras de domínio e contratos independentes de plataforma; interface, Route Handlers e acesso server-only ao Supabase permanecem específicos da web/backend.
