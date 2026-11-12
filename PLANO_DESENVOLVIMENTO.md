# WhatToEat — Plano de Desenvolvimento

Roadmap oficial para desenvolver, proteger, lançar e monetizar o WhatToEat. Este documento registra o estado observado no código e no Supabase e organiza as próximas etapas para concluir primeiro a experiência web, mantendo as regras de domínio desacopladas para uma futura aplicação mobile.

## Estado atual verificado

Estado atualizado em 12/11/2026, com inspeção do repositório, execução de testes/lint/build, validações manuais relatadas pelo usuário e consultas somente de leitura ao Supabase realizadas anteriormente.

- **Aplicação:** Next.js App Router, JavaScript, React e Tailwind CSS. `package.json` contém comandos `dev`, `build`, `start`, `lint` e `test`.
- **Backend existente:** módulos de receitas/administração, casos de uso, repositórios Supabase server-only e Route Handlers públicos e administrativos. As APIs editoriais validam identidade e papel admin no servidor, sem service_role.
- **Autenticação administrativa:** login e logout via Route Handlers com `@supabase/ssr`, cookies geridos no servidor e autorização baseada em `app_metadata.role = "admin"`. O usuário relata que cadastro público está desativado no Supabase e que criou/promoveu sua conta pelo Dashboard/SQL Editor.
- **Área administrativa:** `/admin/login`, rota protegida, layout responsivo, endpoint de resumo e cards do dashboard estão implementados. A rota verifica admin no servidor; o cliente só apresenta a resposta da API. A interface usa pt-BR. Devido às políticas RLS remotas atuais, apenas a contagem de receitas publicadas está disponível como dado real; os outros indicadores aparecem indisponíveis.
- **Frontend existente:** página inicial com sorteio, seleção das cinco categorias, estados de carregamento/erro/vazio, seletor ENGLISH/PORTUGUÊS e link “Ver receita”. A rota dinâmica `app/recipes/[slug]/page.js` apresenta detalhes e ajuste local das porções.
- **Idiomas:** interface em `lib/i18n.js`; `pt-BR` é o padrão e `en` é selecionado explicitamente por `?locale=en`. A seleção é preservada nos links entre a página inicial e os detalhes; a resolução do slug é independente do idioma solicitado.
- **Arquivos e histórico do banco:** existem `supabase/seed.sql`, `supabase/config.toml` e o baseline `supabase/migrations/20261111233556_initial_schema_baseline.sql`. A CLI Supabase v2.122.1 está fixada como dependência de desenvolvimento. O histórico remoto do projeto `agihkhcwaqprtftfjyyn` registra `20261111233556` como aplicada; o SQL do baseline não foi executado novamente no remoto.
- **Supabase remoto — tabelas e registros:** `recipes` (10), `recipe_translations` (20), `ingredients` (33), `ingredient_translations` (66) e `recipe_ingredients` (73). As 10 receitas estão publicadas, duas em cada categoria; existem 10 traduções de receita e 33 de ingrediente em cada idioma atual.
- **Relacionamentos principais:** receita → traduções e receita → itens de receita; item de receita → ingrediente; ingrediente → traduções. As chaves estrangeiras e unicidades foram inspecionadas. `instructions` tem constraint que exige array JSONB.
- **Integridade e acesso:** inspeção somente de leitura confirmou RLS nas cinco tabelas e políticas públicas de SELECT para conteúdo publicado. Também confirmou ALL PRIVILEGES para anon e authenticated nas cinco tabelas, incluindo TRUNCATE, REFERENCES e TRIGGER; RLS não limita TRUNCATE. A migration local revoga esses grants amplos e concede permissões mínimas com RLS administrativa. Nenhuma alteração foi aplicada no remoto.
- **Testes e validação:** em 12/11/2026, npm test passou com 84 testes, npm run lint passou e npm run build passou. Os testes incluem API pública, autenticação/autorização, dashboard, validações editoriais e imagens. Não há E2E nem validação contra Supabase isolado; Docker não está instalado.
- **Validação manual anterior:** o usuário confirmou login real, autenticação e acesso administrativo. Não há confirmação manual de logout, expiração de sessão ou bloqueio de usuários comuns. Recuperação de senha continua pendente.
- **Limites da validação administrativa:** não há evidência manual de logout, sessão expirada ou bloqueio de usuário comum; esses cenários não estão registrados como validados manualmente. Recuperação de senha continua pendente. Testes automatizados de unidade/handlers não equivalem a validação end-to-end.
- **Limitações atuais confirmadas:** baseline e migration administrativa ainda precisam de validação em banco isolado, indisponível sem Docker. A migration 20261112035903_admin_editorial_and_storage.sql está preparada localmente, não foi aplicada no remoto e tem 37 verificações pgTAP ainda não executadas. A inspeção remota encontrou ALL PRIVILEGES incluindo TRUNCATE nas cinco tabelas para anon/authenticated e não encontrou bucket recipe-images; a migration propõe revogar os grants amplos, aplicar RLS administrativa e criar bucket privado. Dashboard completo, CRUD e imagens permanecem bloqueados pelos gates server-side até aprovação/aplicação. Não há testes E2E nem validação manual do ciclo editorial. Busca, filtros, compartilhamento, validação formal de responsividade, configuração Vercel, funcionalidades de usuário e monetização continuam pendentes.
- **Configuração:** `.env.local` existe localmente. Valores não são reproduzidos neste documento. A presença do arquivo não comprova configuração equivalente na Vercel.

## Como acompanhar

- `[ ] Não iniciado`: a funcionalidade ainda não foi implementada ou validada integralmente.
- `[~] Parcial/em andamento`: existe implementação ou preparação, mas falta cumprir todo o critério de conclusão.
- `[x] Concluído`: há evidência no código ou no banco para o escopo descrito no item.
- Itens concluídos representam o escopo atual expressamente descrito; não significam que etapas futuras listadas como dependências também estejam concluídas.
- Cada tarefa registra objetivo, trabalho de backend, trabalho de frontend, dependências, validação e critério de conclusão.

## Ordem recomendada e dependências

1. Fechar a tarefa 1.3 reproduzindo o baseline em banco local isolado e documentando promoção/rollback; o histórico remoto já registra o baseline como aplicado.
2. Revisar a migration administrativa já preparada, validar baseline e migration em banco isolado e executar o pgTAP; obter aprovação antes de qualquer aplicação remota.
3. Após autorização e aplicação da migration, configurar ADMIN_DASHBOARD_RLS_READY somente no servidor, conferir as cinco métricas contra consultas independentes e concluir 2.2.
4. Recuperação de senha (2.1) continua pendente; realizá-la sem criar fluxos públicos de cadastro.
5. Para habilitar as funcionalidades locais 2.3–2.7, primeiro validar baseline/migration em banco isolado, aprovar a migration RLS/Storage e aplicá-la remotamente apenas mediante autorização explícita; depois configurar os gates server-side e validar o ciclo por papel.
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

### 1.7 Políticas RLS administrativas — [~] Migration local preparada; remota não aplicada

- **Objetivo:** permitir operações administrativas sem ampliar acesso público.
- **Backend:** a migration local 20261112035903_admin_editorial_and_storage.sql prepara políticas para as cinco tabelas editoriais usando app_metadata.role = admin e estreita privilégios SQL. Ainda não foi validada em banco isolado nem aplicada no remoto. Os handlers Next.js também autorizam cada requisição no servidor.
- **Frontend:** formulários chamam somente APIs administrativas protegidas; não acessam Supabase diretamente.
- **Dependências:** aprovação e validação isolada da migration, baseline reproduzível e ambiente Supabase local disponível.
- **Como testar e validar:** supabase/tests/admin_access.test.sql contém 37 verificações pgTAP previstas para anon, usuário comum, admin, RLS e privilégios. Não foi executado porque Docker e banco Supabase local não estão disponíveis. O remoto permaneceu sem alterações.
- **Critério para concluir:** validar os testes em ambiente isolado, revisar e aprovar a migration, aplicá-la apenas com autorização explícita e conferir a matriz de grants/RLS por papel no remoto.

### 1.8 Supabase Storage para imagens — [~] Migration e integração local preparadas

- **Objetivo:** armazenar fotos reais de receitas com acesso controlado.
- **Backend:** a migration local define bucket privado recipe-images, limite de 5 MiB, JPEG/PNG/WebP, políticas para imagens ligadas a receitas publicadas e gestão por admin. O servidor valida formato, assinatura e tamanho e encapsula as operações em repositório. A inspeção remota não encontrou o bucket; nada foi aplicado.
- **Frontend:** o editor permite selecionar, pré-visualizar, substituir e remover imagem e editar texto alternativo por idioma. As operações ficam bloqueadas até ADMIN_STORAGE_READY estar ativo após a política estar pronta.
- **Dependências:** aprovação e validação da migration e do bucket em ambiente isolado.
- **Como testar e validar:** 7 testes automatizados cobrem autorização, origem, readiness, formatos e limpeza após falha. Falta validar o Storage real e políticas por papel.
- **Critério para concluir:** bucket/políticas aplicados e fluxo integrado testado para upload, substituição e remoção por anon, usuário comum e admin.

### 1.9 Serviços e APIs — [~] APIs públicas e autenticação administrativa inicial

- **Objetivo:** centralizar regras de domínio em serviços e expor contratos estáveis por Route Handlers.
- **Backend:** GET /api/meals/random e GET /api/recipes/[slug] atendem os fluxos públicos; APIs administrativas de dashboard, receitas, ingredientes e imagens já existem em Route Handlers e delegam para os módulos de domínio, aplicação e infraestrutura. Cada endpoint administrativo autoriza no servidor.
- **Frontend:** interface pública consome as APIs existentes; as páginas administrativas de receitas e ingredientes consomem somente endpoints protegidos no mesmo domínio.
- **Dependências:** schema; políticas de leitura para API pública; Auth/RLS para APIs administrativas.
- **Como testar e validar:** conferir locale/categoria/UUID inválidos, estados 404/503/500, traduções e filtro por publicação; testar autorização das futuras rotas.
- **Cobertura atual:** 84 testes automatizados executados nesta revisão, cobrindo contratos públicos, Auth/admin, dashboard, validação editorial e imagens. Ainda não há testes E2E.
- **Critério para concluir:** sorteio existente permanece funcional e cada novo endpoint tem validação de entrada, erros previsíveis e autorização adequada.

### 1.10 Testes de segurança e integridade do backend — [~] Parcial

- **Objetivo:** detectar acesso indevido e dados inconsistentes antes de expor novas operações.
- **Backend:** 84 testes Node passaram nesta execução. Há 37 verificações pgTAP preparadas em supabase/tests/admin_access.test.sql, mas não executadas; faltam RLS real, constraints em banco isolado, consistência relacional e integração Storage.
- **Frontend:** validar respostas de erro sem expor detalhes internos nem credenciais.
- **Dependências:** esquema versionado, APIs, Auth, autorização e Storage.
- **Como testar e validar:** npm test, npm run lint e npm run build passaram. Para fechar a etapa, executar as verificações SQL em banco isolado com papéis anon, usuário comum e admin, sem escrita na produção.
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
- **Frontend:** /admin/login, área protegida com navegação, dashboard e páginas locais de receitas/ingredientes; todas as telas administrativas usam pt-BR. Recuperação de senha continua pendente.
- **Dependências:** Auth e autorização iniciais (1.4–1.5) existem; recuperação segura e políticas RLS administrativas (1.7) ainda pendentes.
- **Como testar e validar:** os testes automatizados de Auth/admin permanecem cobertos dentro do conjunto de 84 testes. Validação manual relatada pelo usuário: login real, autenticação e acesso administrativo funcionaram. Logout, expiração e negativa a usuários comuns não foram confirmados manualmente. Recuperação e E2E seguem pendentes.
- **Critério para concluir:** login, logout e recuperação com mensagens que não enumeram contas; acesso negado sem sessão/role válida; cenários automatizados e manuais registrados.

### 2.2 Dashboard — [~] Interface e cálculo prontos; leitura integral aguarda RLS

- **Objetivo:** oferecer uma visão operacional do catálogo e itens que exigem revisão.
- **Indicadores:** total, publicadas, rascunhos, sem imagem e traduções pendentes em pt-BR/en.
- **Backend:** GET /api/admin/dashboard/summary verifica requireAdmin antes da consulta. O repositório usa cliente SSR autenticado e pagina os dados para calcular os indicadores, sem chave privilegiada. Sem RLS completa validada, falha fechado e não apresenta contagens incompletas como totais.
- **Frontend:** shell responsivo em pt-BR, cinco indicadores, carregamento, erro, vazio, tentativa novamente e aviso quando a leitura completa está indisponível. Navegação aponta para as telas administrativas locais.
- **Supabase:** as políticas remotas atuais permitem ao público apenas linhas publicadas. ADMIN_DASHBOARD_RLS_READY deve permanecer desativado até aprovação/aplicação das políticas administrativas e validação dos resultados. Nenhuma migration foi aplicada nesta execução.
- **Arquitetura:** regras em modules/admin/domain, caso de uso em application, repositório em infrastructure/supabase, handler em presentation/http, composição server-side em services/admin, Route Handler como adaptador e interface em app/admin.
- **Testes:** npm test passou com 84 testes; inclui autorização, falha segura quando RLS não está pronta e cálculo/paginação. Não há E2E nem validação contra banco isolado ou sessão real nesta execução.
- **Critério para concluir:** validar todas as métricas contra banco/RLS, manter autenticação server-side e confirmar interface pt-BR após a configuração aprovada.

### 2.3 Cadastro, edição, exclusão e publicação de receitas — [~] Implementação local; aguarda RLS

- **Objetivo:** gerir o ciclo editorial de receitas revisadas manualmente.
- **Backend:** APIs protegidas por sessão/admin, validação server-side e de origem, repositório e persistência transacional via RPC estão implementados. As operações respondem indisponível enquanto ADMIN_EDITORIAL_RLS_READY estiver desativado.
- **Frontend:** lista com pesquisa, categoria, status e paginação; formulário para rascunho, edição, publicação/despublicação e exclusão confirmada. Conteúdo pode ser editado em pt-BR e en.
- **Dependências:** migration administrativa aprovada/aplicada, validação da RLS e configuração server-side do gate.
- **Como testar e validar:** testes automatizados cobrem autorização, origem, validação e bloqueio pela RLS pendente. Falta executar o ciclo completo contra banco isolado com anon, usuário comum e admin.
- **Critério para concluir:** confirmar ciclo editorial integrado por papel e que publicação exige traduções, instruções e ingredientes válidos.

### 2.4 Cadastro de ingredientes, quantidades e unidades — [~] Interface e API local; aguarda RLS

- **Objetivo:** reutilizar ingredientes e preservar vínculos ordenados nas receitas.
- **Backend:** endpoints protegidos e repositório usam a RPC de gravação; validações de chave, nomes traduzidos e vínculos estão implementadas. Exclusão respeita a FK RESTRICT. Operações ficam bloqueadas até a migration/RLS ser aprovada e aplicada.
- **Frontend:** páginas em pt-BR para pesquisar, cadastrar, editar e remover ingredientes; editor da receita permite selecionar itens, quantidades numéricas/textuais, unidade, nota e ordem.
- **Dependências:** integração editorial habilitada somente após validação/aprovação da RLS.
- **Como testar e validar:** testes cobrem validação e autorização; falta confirmar persistência, reutilização, ordem e FK em banco isolado.
- **Critério para concluir:** testar dados e relações reais no banco isolado, inclusive exclusão restrita por FK.

### 2.5 Traduções de receitas e ingredientes — [~] Formulários locais; integração aguarda RLS

- **Objetivo:** manter conteúdo editorial em português brasileiro e inglês.
- **Backend:** validação de idiomas e campos, instruções em array e persistência em repositórios/RPCs estão implementadas; constraints atuais preservam unicidade.
- **Frontend:** formulários administrativos em português oferecem conteúdo em pt-BR e en; o dashboard identifica tradução pendente quando a leitura completa for autorizada.
- **Dependências:** RLS administrativa habilitada e integração validada em banco isolado.
- **Como testar e validar:** há testes automatizados de validação e publicação; falta validar gravação, slug duplicado e leitura pública depois da edição.
- **Critério para concluir:** testar ambos os idiomas e comprovar que publicação é bloqueada diante de conteúdo obrigatório incompleto.

### 2.6 Upload e gestão de imagens — [~] Fluxo local implementado; bucket remoto ausente

- **Objetivo:** associar imagens reais às receitas de forma segura.
- **Backend:** endpoint protegido verifica origem, identidade, autorização, limite, MIME e assinatura; Storage é encapsulado em repositório server-only e a associação é feita por RPC. A migration define bucket e políticas, mas não foi aplicada. A consulta remota de leitura não encontrou o bucket recipe-images.
- **Frontend:** editor permite seleção, pré-visualização, substituição, remoção e texto alternativo em cada idioma. O fluxo fica bloqueado até ADMIN_STORAGE_READY estar habilitado após aprovação da política.
- **Dependências:** migration validada/aprovada e bucket criado conforme a configuração revisada.
- **Como testar e validar:** 7 testes cobrem formatos, tamanho, autorização, falhas e limpeza; falta integração real com Storage e testes de políticas por papel.
- **Critério para concluir:** testar upload, substituição e remoção no ambiente isolado para anon, usuário comum e admin, sem referências quebradas.

### 2.7 Validação dos formulários administrativos — [~] Validação local implementada; integração pendente

- **Objetivo:** impedir dados incompletos ou incompatíveis com o schema.
- **Backend:** validadores verificam receitas, traduções, UUIDs, duplicidade de ingredientes, quantidades, unidades, ordem e imagens. Handlers validam sessão, papel, origem e entrada; erros internos são mapeados para mensagens seguras em pt-BR.
- **Frontend:** formulários apresentam campos e feedback em português; validações de cliente auxiliam, mas o servidor e o banco continuam como autoridade.
- **Dependências:** execução de migration e validação das constraints em banco Supabase isolado.
- **Como testar e validar:** testes automatizados cobrem regras e chamadas diretas aos endpoints; faltam constraints reais e testes E2E no Supabase isolado.
- **Critério para concluir:** cobrir limites e constraints no banco isolado e confirmar no navegador o fluxo completo sem depender de validação client-side.
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
- **Estado atual:** em 12/11/2026 passaram npm test (84 testes), npm run lint e npm run build. Os testes cobrem API pública, autenticação/autorização, dashboard, validação editorial e imagens. O usuário validou manualmente detalhes/navegação/porções e login/acesso administrativo em sessões anteriores. Não há E2E automatizado nem validação manual registrada de logout, expiração, usuário comum ou ciclo editorial.
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
