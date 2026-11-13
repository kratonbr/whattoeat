# WhatToEat — Plano de Desenvolvimento

Roadmap oficial para desenvolver, proteger, lançar e monetizar o WhatToEat. Este documento registra o estado observado no código e no Supabase e organiza as próximas etapas para concluir primeiro a experiência web, mantendo as regras de domínio desacopladas para uma futura aplicação mobile.

## Estado atual verificado

Atualizado em 12/11/2026 após revisão do catálogo e da responsividade. O usuário confirmou manualmente 11 de 13 comportamentos do catálogo: busca em português e inglês, mensagem sem resultados, filtros de categoria/tempo/dificuldade, combinação e limpeza dos filtros, ordenações por mais recentes/rápidas/alfabética e navegação correta dos cartões. Carregamento incremental e imagens continuam sem confirmação manual no navegador. O usuário confirmou que os problemas responsivos anteriores — indicadores da receita e visibilidade do sorteio no celular — foram corrigidos. Nesta alteração, a ordem móvel das seções foi ajustada e atalhos por âncora foram incluídos; essas mudanças ainda aguardam conferência manual em celular, tablet e desktop. O código mantém desempate estável e deduplicação entre páginas, renovação de URL assinada expirada, ordem de leitura correspondente ao layout por viewport e rolagem de âncora compatível com movimento reduzido. `npm run lint` passou após estas alterações. Nenhuma suíte automatizada foi executada. O último resultado anterior registrado foi 84 testes, lint e build aprovados; ele não valida estas alterações.

- **Stack:** Next.js 16.4.6 com App Router, JavaScript, React 19, Tailwind CSS 4 e Supabase (`@supabase/ssr` e `@supabase/supabase-js`). Não há TypeScript nem aplicação mobile.
- **Arquitetura:** monólito modular com módulos `recipes`, `ingredients` e `admin`, separados em `domain`, `application`, `infrastructure/supabase` e, para administração, `presentation/http`. Route Handlers adaptam HTTP; serviços fazem composição no servidor; `shared/http` contém utilitários HTTP administrativos. Fachadas legadas em `domain/`, `services/` e `lib/api/` ainda existem.
- **Supabase:** baseline `20261111233556_initial_schema_baseline.sql` e migration administrativa `20261112035903_admin_editorial_and_storage.sql` constam como aplicados no histórico remoto do projeto `agihkhcwaqprtftfjyyn`. A migration administrativa revoga privilégios amplos, mantém leitura pública de conteúdo publicado, cria políticas administrativas baseadas em `app_metadata.role = 'admin'` e configura o bucket privado `recipe-images`. As inspeções estruturais anteriores confirmaram a remoção de `TRUNCATE`, `REFERENCES` e `TRIGGER` de `anon` e `authenticated` nas tabelas editoriais. A reprodução das migrations em banco isolado e as 43 verificações pgTAP ainda não foram executadas.
- **Segurança administrativa:** autenticação SSR com cookies geridos no servidor; páginas e Route Handlers validam a identidade e o papel admin server-side. A aplicação não usa `service_role` para contornar RLS. O usuário relata que desativou o cadastro público e criou/promoveu sua conta existente pelo Supabase Dashboard/SQL Editor. Isso não equivale a uma validação independente da matriz de permissões para usuários comuns.
- **Painel:** login, dashboard, lista/edição de receitas e ingredientes, tradução pt-BR/en, upload e remoção de imagem existem no código. O usuário confirmou manualmente os fluxos listados na seção “Validação manual relatada pelo usuário”. O dashboard tem contagens, lista resumida de traduções pendentes e links/filtros de receitas sem imagem e traduções pendentes; a correspondência de cada contagem com a listagem filtrada ainda precisa de conferência direcionada.
- **Recuperação de senha:** páginas, endpoints e callback estão implementados; o envio utiliza o fluxo de recuperação do Supabase Auth e evita revelar se o e-mail existe. A validação por e-mail/link está pendente porque o serviço de e-mail do usuário está temporariamente indisponível. Não marcar como concluída.
- **Site público:** página inicial, sorteador por categoria, detalhes de receita, porções ajustáveis, checklist, Modo Cozinha, compartilhamento, locale `pt-BR`/`en`, imagens/placeholder e telas 404/erro estão implementados no código. A home inclui catálogo consultado no backend, busca por título em ambos os idiomas, filtros de categoria/tempo/dificuldade e ordenação por data de criação, duração ou título localizado. O usuário confirmou manualmente 11 de 13 comportamentos do catálogo (detalhados abaixo); paginação incremental e imagens aguardam conferência no navegador. O usuário confirmou a correção dos dois problemas responsivos anteriores; a nova ordem mobile das seções da receita e os atalhos por âncora ainda aguardam verificação.
- **Slug:** a aplicação resolve slug de qualquer tradução para a receita, escolhe o slug pt-BR como canônico e redireciona para ele preservando `locale`. A edição atual usa o mesmo slug nos dois idiomas para conteúdo salvo por ela. Porém, o schema segue armazenando `slug` por linha de tradução e conserva unicidade por idioma; migração/consolidação total dos slugs existentes não foi feita.
- **Testes:** existem 15 arquivos de testes Node com 84 chamadas `test()` no código atual. O último resultado registrado foi 84 testes aprovados, `npm run lint` e `npm run build` aprovados em 12/11/2026, antes das alterações mais recentes de recuperação de senha e apresentação da página de receita. Nenhuma suíte foi executada nesta atualização. Não há testes end-to-end automatizados nem testes pgTAP executados.
- **Validação manual relatada pelo usuário:** em 12/11/2026, o usuário confirmou no navegador: login administrativo; indicadores do dashboard; listagem de receitas e ingredientes; cadastro de receita como rascunho; pesquisa/seleção de ingredientes; edição e salvamento; publicação e despublicação; upload, substituição e remoção de imagens; exclusão da receita de teste; correção do erro de renderização na página de receitas. Também confirmou 11 de 13 comportamentos do catálogo: busca nos dois idiomas, estado sem resultados, filtros de categoria/tempo/dificuldade, combinação e limpeza, três ordenações e navegação dos cartões. Confirmou ainda a correção dos dois problemas responsivos anteriores na página de receita e no sorteio mobile. A ordem recém-alterada das seções e os atalhos por âncora ainda não foram verificados manualmente. Não foram confirmados logout, expiração de sessão, bloqueio de usuário comum ou recuperação de senha.
- **Pendências transversais:** conferir a nova ordem e os atalhos da página de receita em celular, tablet e desktop; conferir manualmente carregamento incremental e imagens/placeholders do catálogo; verificar que os indicadores do dashboard correspondem aos resultados filtrados; concluir e validar recuperação de senha quando o serviço de e-mail estiver disponível; terminar revisão visual/funcional pública; consolidar slugs canônicos com compatibilidade; revisar módulos legados desnecessários; investigar lentidão; completar auditorias de segurança, SEO, acessibilidade e responsividade; preparar deploy. A aplicação não foi publicada.

### Evidência e limites

- “Implementado” significa que há código correspondente; não implica teste integrado ou uso real.
- “Confirmado manualmente” refere-se somente aos fluxos explicitamente relatados pelo usuário acima.
- Migrações e políticas foram aplicadas/remotamente inspecionadas em execução anterior, mas a validação SQL isolada e o teste comportamental completo por papel seguem pendentes.
- Os gates de leitura/administração/Storage são configuração local server-side. Não foi confirmada configuração equivalente na Vercel; não registrar seus valores nem conteúdo de `.env.local` em documentação pública.

## Como acompanhar

- `[ ] Não iniciado`: a funcionalidade ainda não foi implementada ou validada integralmente.
- `[~] Parcial/em andamento`: existe implementação ou preparação, mas falta cumprir todo o critério de conclusão.
- `[x] Concluído`: há evidência no código ou no banco para o escopo descrito no item.
- Itens concluídos representam o escopo atual expressamente descrito; não significam que etapas futuras listadas como dependências também estejam concluídas.
- Cada tarefa registra objetivo, trabalho de backend, trabalho de frontend, dependências, validação e critério de conclusão.

## Ordem recomendada e dependências

1. Concluir no navegador os dois pontos ainda pendentes do catálogo: carregar páginas adicionais e conferir imagens reais, URLs assinadas, placeholder, falha e atualização após substituição/remoção. Os outros 11 comportamentos já foram confirmados pelo usuário. Em seguida, conferir que os indicadores “Sem imagem” e “Traduções pendentes” correspondem às listas do dashboard.
2. Concluir a validação manual de recuperação de senha quando o serviço de e-mail estiver disponível; manter o cadastro público desativado.
3. Auditar a arquitetura e remover ou consolidar fachadas/módulos somente após confirmar referências e testes; manter as APIs e os fluxos existentes.
4. Investigar a lentidão relatada, medir rotas/API/consultas e otimizar com evidência.
5. Completar a auditoria de segurança, incluindo execução isolada das migrations e pgTAP e matriz comportamental de anônimo, usuário comum e administrador; corrigir achados antes de liberar produção.
6. Verificar as funcionalidades públicas pendentes, responsividade, acessibilidade e SEO; completar o filtro por ingredientes disponíveis e validar busca, filtros, ordenação, detalhes e compartilhamento em dispositivos reais.
7. Preparar configuração de produção, deploy de preview e monitoramento na Vercel. A publicação depende de validações de segurança, privacidade, desempenho e recuperação operacional.

Expo/mobile, publicidade, Premium e recomendações inteligentes permanecem posteriores à conclusão da versão web.

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
- **Como testar e validar:** reproduzir o baseline em banco local isolado, comparar o schema resultante com o remoto e revisar cada diff. Ainda não foi usado ambiente isolado para essa validação.
- **Critério para concluir:** schema reproduzível em ambiente novo, histórico versionado no repositório e procedimento de promoção/rollback documentado. O histórico remoto já contém a versão baseline.

### 1.4 Supabase Auth para administradores — [~] Login validado; recuperação pendente

- **Objetivo:** habilitar acesso autenticado ao painel, sem introduzir contas de usuário final no MVP público.
- **Backend:** integração SSR, sessão/cookies no servidor, login/logout e endpoints/callback de recuperação estão implementados. A autorização é baseada em identidade validada e `app_metadata.role = "admin"`.
- **Frontend:** `/admin/login`, `/admin/esqueci-senha` e `/admin/redefinir-senha` estão implementadas em pt-BR; recuperação não revela se a conta existe.
- **Dependências:** migrations versionadas; variáveis corretas por ambiente; fluxo de autorização de administrador definido.
- **Como testar e validar:** o usuário confirmou login e acesso administrativo. Recuperação por e-mail aguarda disponibilidade do serviço de e-mail e validação do link/callback. Logout, sessão expirada e bloqueio de usuário sem papel admin não foram confirmados manualmente. Não há E2E.
- **Critério para concluir:** validar manualmente login, logout, expiração, usuário sem permissão, solicitação genérica de recuperação, callback válido/inválido e redefinição de senha; configurar e-mail/URLs sem reabrir cadastro público.

### 1.5 Autorização de administradores — [~] Parcial

- **Objetivo:** separar autenticação de autorização e limitar operações editoriais a administradores aprovados.
- **Backend:** app_metadata.role = admin é validado server-side nas páginas e APIs administrativas. As políticas RLS administrativas agora estão aplicadas; a validação de operações reais por papel continua pendente.
- **Frontend:** login e dashboard administrativo estão implementados; as páginas privadas são protegidas no servidor.
- **Dependências:** Supabase Auth, modelo de papéis e validação comportamental das políticas administrativas.
- **Como testar e validar:** testes automatizados cobrem sem sessão, usuário sem role, administrador e falha do serviço. O usuário validou manualmente seu acesso como admin. Não há evidência manual registrada de bloqueio de usuário comum.
- **Critério para concluir:** cada operação administrativa futura verifica identidade e permissão no servidor e no banco quando aplicável; matriz de RLS correspondente validada.

### 1.6 Políticas RLS públicas — [x] Concluído para leitura pública

- **Objetivo:** permitir que o catálogo publicado seja lido publicamente sem liberar escrita anônima.
- **Backend:** as cinco tabelas têm RLS habilitado; as políticas verificadas limitam SELECT a receitas publicadas e dados relacionados.
- **Frontend:** a página pública lê receitas por meio da API server-side; não realiza escrita direta ao Supabase.
- **Dependências:** schema e relacionamentos existentes.
- **Como testar e validar:** consultas anônimas veem apenas dados de receitas publicadas; confirmar que INSERT/UPDATE/DELETE públicos não são permitidos.
- **Critério para concluir:** políticas observadas cobrem as cinco tabelas e preservam leitura publicada sem escrita pública.

### 1.7 Políticas RLS administrativas — [~] Migration aplicada; validação comportamental pendente

- **Objetivo:** permitir operações administrativas sem ampliar acesso público.
- **Backend:** a migration 20261112035903_admin_editorial_and_storage.sql foi aplicada ao projeto agihkhcwaqprtftfjyyn. As políticas para as cinco tabelas editoriais usam app_metadata.role = admin; grants de anon e authenticated foram restringidos. Os handlers Next.js também autorizam cada requisição no servidor.
- **Frontend:** formulários chamam somente APIs administrativas protegidas; não acessam Supabase diretamente.
- **Dependências:** baseline reproduzível e ambiente Supabase isolado para validação comportamental.
- **Como testar e validar:** a inspeção pós-aplicação confirmou políticas e grants no catálogo remoto, preservação das políticas públicas e ausência de TRUNCATE, REFERENCES e TRIGGER para anon/authenticated. As 43 verificações pgTAP de supabase/tests/admin_access.test.sql não foram executadas. Ainda falta testar leitura/escrita por sessão anônima, usuário comum e administrador.
- **Critério para concluir:** executar pgTAP em ambiente isolado e validar operações reais por papel, incluindo negações, sem usar service_role na aplicação.

### 1.8 Supabase Storage para imagens — [~] Integração e fluxo editorial confirmados; matriz de segurança pendente

- **Objetivo:** armazenar fotos reais de receitas com acesso controlado.
- **Backend:** o bucket privado recipe-images foi criado com limite de 5 MiB e MIME JPEG/PNG/WebP. As políticas para leitura de imagens de receitas publicadas e gestão por admin foram verificadas no catálogo. O servidor valida formato, assinatura e tamanho e encapsula operações em repositório.
- **Frontend:** o editor permite selecionar, pré-visualizar, substituir e remover imagem e editar texto alternativo por idioma. ADMIN_STORAGE_READY=true foi configurado somente no servidor local após a verificação das políticas.
- **Dependências:** validação do fluxo real de Storage por papel e reinício do servidor Next.js para carregar o gate local.
- **Como testar e validar:** o usuário confirmou manualmente upload, substituição e remoção no painel. Permanecem pendentes a execução das verificações SQL em ambiente isolado e a validação de permissões/negações no Storage por anônimo, usuário comum e administrador. Não há E2E.
- **Critério para concluir:** bucket/políticas e fluxo integrado validados por papel, com negações demonstradas e testes reproduzíveis em ambiente isolado.

### 1.9 Serviços e APIs — [~] APIs públicas e autenticação administrativa inicial

- **Objetivo:** centralizar regras de domínio em serviços e expor contratos estáveis por Route Handlers.
- **Backend:** GET /api/meals/random e GET /api/recipes/[slug] atendem os fluxos públicos; APIs administrativas de dashboard, receitas, ingredientes e imagens já existem em Route Handlers e delegam para os módulos de domínio, aplicação e infraestrutura. Cada endpoint administrativo autoriza no servidor.
- **Frontend:** interface pública consome as APIs existentes; as páginas administrativas de receitas e ingredientes consomem somente endpoints protegidos no mesmo domínio.
- **Dependências:** schema; políticas de leitura para API pública; Auth/RLS para APIs administrativas.
- **Como testar e validar:** conferir locale/categoria/UUID inválidos, estados 404/503/500, traduções e filtro por publicação; testar autorização das futuras rotas.
- **Cobertura atual:** a validação automatizada anterior incluiu 84 testes sobre contratos públicos, Auth/admin, dashboard, validação editorial e imagens. Não há testes E2E; nenhuma suíte foi executada nesta atualização.
- **Critério para concluir:** sorteio existente permanece funcional e cada novo endpoint tem validação de entrada, erros previsíveis e autorização adequada.

### 1.10 Testes de segurança e integridade do backend — [~] Parcial

- **Objetivo:** detectar acesso indevido e dados inconsistentes antes de expor novas operações.
- **Backend:** na validação automatizada anterior, 84 testes Node passaram. Há 43 verificações pgTAP preparadas em supabase/tests/admin_access.test.sql, mas não executadas; faltam testes comportamentais de RLS por papel, constraints em banco isolado, consistência relacional e integração Storage.
- **Frontend:** validar respostas de erro sem expor detalhes internos nem credenciais.
- **Dependências:** esquema versionado, APIs, Auth, autorização e Storage.
- **Como testar e validar:** npm test, npm run lint e npm run build passaram na validação anterior. Nesta atualização não foram executados. Para fechar a etapa, executar as verificações SQL em banco isolado com papéis anon, usuário comum e admin, sem escrita na produção.
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

### 2.1 Login e recuperação de senha — [~] Login validado; recuperação aguardando e-mail

- **Objetivo:** permitir que administradores entrem e recuperem acesso ao painel.
- **Backend:** login/logout via Route Handlers e sessão SSR; callback de recuperação valida `token_hash` com `type=recovery`; a redefinição exige usuário admin validado no servidor e uma autorização HMAC curta, HttpOnly e vinculada à sessão de recuperação. Nenhuma chave `service_role` é usada.
- **Frontend:** `/admin/login`, `/admin/esqueci-senha` e `/admin/redefinir-senha` usam interface pt-BR. O pedido de recuperação retorna a mesma confirmação independente da existência do e-mail.
- **Dependências:** requer `APP_BASE_URL` no ambiente de produção, `ADMIN_RECOVERY_COOKIE_SECRET` (segredo privado com pelo menos 32 bytes) e URL de callback permitida no Supabase Auth. O template de recuperação deve direcionar o `token_hash` ao callback do Next.js com `type=recovery`; o cadastro público permanece controlado no Supabase.
- **Como testar e validar:** código de pedido, callback de recuperação e atualização de senha está presente. O usuário confirmou login real e acesso administrativo. O envio/link ainda não pôde ser validado porque o serviço de e-mail está temporariamente indisponível. Logout, expiração e usuário sem papel não têm confirmação manual; não há E2E.
- **Critério para concluir:** quando o e-mail estiver disponível, validar solicitação genérica, link válido, inválido/expirado/reutilizado e troca de senha, além de logout, expiração e bloqueio de usuário comum. Até então, manter parcial.

### 2.2 Dashboard — [~] Implementado e confirmado; conferência dos filtros pendente

- **Objetivo:** oferecer uma visão operacional do catálogo e itens que exigem revisão.
- **Indicadores:** total, publicadas, rascunhos, sem imagem e traduções pendentes em pt-BR/en.
- **Backend:** GET /api/admin/dashboard/summary verifica requireAdmin antes da consulta. O repositório usa cliente SSR autenticado e pagina os dados para calcular indicadores, sem chave privilegiada. ADMIN_DASHBOARD_RLS_READY=true foi configurado no servidor local após a verificação da política.
- **Frontend:** shell responsivo em pt-BR, cinco indicadores, carregamento, erro, vazio, tentativa novamente e aviso quando a leitura completa está indisponível. O indicador “Sem imagem” abre a lista filtrada por `withoutImage=true`; “Traduções pendentes” abre a lista filtrada por `translationsPending=true`, com seção resumida e links para corrigir.
- **Supabase:** políticas administrativas aplicadas e inspecionadas estruturalmente. O usuário confirmou manualmente os indicadores do dashboard. Ainda falta conferir que as contagens desses dois indicadores coincidem com os totais das listagens filtradas e registrar como as receitas sem imagem/pendências são resolvidas.
- **Arquitetura:** regras em modules/admin/domain, caso de uso em application, repositório em infrastructure/supabase, handler em presentation/http, composição server-side em services/admin, Route Handler como adaptador e interface em app/admin.
- **Testes:** a última suíte registrada tinha 84 testes e cobria autorização, gate de RLS e cálculo/paginação; alterações recentes não foram revalidadas pela suíte. Não há E2E.
- **Critério para concluir:** conferir contagens e resultados filtrados contra a mesma consulta/dados reais, validar erro/indisponibilidade sem números parciais apresentados como totais e manter autorização server-side.

### 2.3 Cadastro, edição, exclusão e publicação de receitas — [~] Fluxo principal confirmado manualmente

- **Objetivo:** gerir o ciclo editorial de receitas revisadas manualmente.
- **Backend:** APIs protegidas por sessão/admin, validação server-side e de origem, repositório e persistência transacional via RPC estão implementados. A RLS foi aplicada. O usuário confirmou operações editoriais principais no navegador.
- **Frontend:** lista com pesquisa, categoria, status e paginação; formulário para rascunho, edição, publicação/despublicação e exclusão confirmada. Conteúdo pode ser editado em pt-BR e en.
- **Dependências:** migration aplicada; falta executar validação isolada e testar operações/negações por papel. A confirmação manual do fluxo de administrador não comprova isolamento contra usuários comuns.
- **Como testar e validar:** usuário confirmou rascunho, edição/salvamento, publicação, despublicação e exclusão de uma receita de teste. Ainda faltam testes de matriz RLS, E2E e validação de todas as regras de publicação em dados incompletos.
- **Critério para concluir:** confirmar ciclo editorial integrado por papel e que publicação exige traduções, instruções e ingredientes válidos.

### 2.4 Cadastro de ingredientes, quantidades e unidades — [~] Uso integrado confirmado; validação de segurança pendente

- **Objetivo:** reutilizar ingredientes e preservar vínculos ordenados nas receitas.
- **Backend:** endpoints protegidos e repositório usam a RPC de gravação; validações de chave, nomes traduzidos e vínculos estão implementadas. Exclusão respeita a FK RESTRICT. O usuário confirmou listagem e pesquisa/seleção no editor; cadastro inline e operações completas do catálogo devem ser validados conforme o alcance do fluxo manual.
- **Frontend:** o menu lateral mantém Dashboard e Receitas como opções principais. O editor de receita pesquisa o catálogo por identificador e nomes pt-BR/en, permite cadastrar um ingrediente inline (identificador, unidade padrão e nomes nos dois idiomas) e o adiciona automaticamente à receita. Quantidade numérica/textual, unidade, observação e ordem continuam configuráveis na relação. A tela completa do catálogo permanece disponível para editar e remover ingredientes, acessível pelo formulário e pelo atalho existente do dashboard.
- **Dependências:** validar integração editorial, reutilização, ordenação e FK por sessão administrativa.
- **Como testar e validar:** usuário confirmou lista de ingredientes e pesquisa/seleção dentro do formulário de receita. Ainda faltam testes por papel, validação de ordenação/FK e evidência manual específica de todas as operações da tela completa de catálogo.
- **Critério para concluir:** testar dados e relações reais no banco isolado, inclusive exclusão restrita por FK.

### 2.5 Traduções de receitas e ingredientes — [~] Formulários implementados; cobertura operacional parcial

- **Objetivo:** manter conteúdo editorial em português brasileiro e inglês.
- **Backend:** validação de idiomas e campos, instruções em array e persistência em repositórios/RPCs estão implementadas; constraints atuais preservam unicidade.
- **Frontend:** formulários administrativos em português oferecem conteúdo em pt-BR e en; dashboard/lista identificam traduções incompletas com a regra de domínio compartilhada.
- **Dependências:** RLS administrativa aplicada; falta validar gravação, unicidade de slug e leitura pública depois da edição.
- **Como testar e validar:** o usuário confirmou editar/salvar uma receita, mas não confirmou especificamente todos os campos dos dois idiomas. Falta validar gravação bilíngue, conflitos de slug e leitura pública após edição, além das regras de completude no ciclo de publicação.
- **Critério para concluir:** testar ambos os idiomas e comprovar que publicação é bloqueada diante de conteúdo obrigatório incompleto.

### 2.6 Upload e gestão de imagens — [~] Upload, substituição e remoção confirmados

- **Objetivo:** associar imagens reais às receitas de forma segura.
- **Backend:** endpoint protegido verifica origem, identidade, autorização, limite, MIME e assinatura; Storage é encapsulado em repositório server-only e a associação é feita por RPC. O bucket e suas políticas foram aplicados. O usuário confirmou upload, substituição e remoção no painel.
- **Frontend:** editor permite seleção, pré-visualização, substituição, remoção e texto alternativo em cada idioma. O gate está ativo no servidor local, sujeito a reinício do Next.js para carregar a configuração.
- **Dependências:** testar permissões e negações por papel e executar verificações SQL isoladas; a migration já foi aplicada.
- **Como testar e validar:** os fluxos de upload, substituição e remoção foram confirmados manualmente pelo usuário. A leitura de imagem pelo público e a matriz de acesso Storage ainda não foram confirmadas em todos os papéis.
- **Critério para concluir:** testar upload, substituição e remoção no ambiente isolado para anon, usuário comum e admin, sem referências quebradas.

### 2.7 Validação dos formulários administrativos — [~] Validação local implementada; validação integrada pendente

- **Objetivo:** impedir dados incompletos ou incompatíveis com o schema.
- **Backend:** validadores verificam receitas, traduções, UUIDs, duplicidade de ingredientes, quantidades, unidades, ordem e imagens. Handlers validam sessão, papel, origem e entrada; erros internos são mapeados para mensagens seguras em pt-BR.
- **Frontend:** formulários apresentam campos e feedback em português; validações de cliente auxiliam, mas o servidor e o banco continuam como autoridade.
- **Dependências:** migration aplicada; falta validar constraints e RPCs em ambiente Supabase isolado.
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

### 3.3 Filtros além da categoria — [~] Filtros confirmados; ingrediente disponível pendente

- **Objetivo:** ajudar visitantes a restringir receitas por critérios úteis, como tempo ou ingredientes disponíveis.
- **Backend:** `GET /api/recipes` valida e aplica categoria, tempo máximo e dificuldade em conjunto, sempre limitando a receitas publicadas. O filtro por ingredientes disponíveis ainda não existe. Os filtros do catálogo não restringem o sorteador.
- **Frontend:** a home oferece filtros responsivos de categoria, tempo máximo e dificuldade junto da busca e ordenação, além de ação para limpar filtros. O sorteador atual por categoria foi preservado.
- **Dependências:** catálogo consistente, API pública e definição de critérios editoriais.
- **Como testar e validar:** o usuário confirmou manualmente categoria, tempo, dificuldade, combinações, limpeza e estados de busca no navegador. Filtro por ingredientes disponíveis não existe e permanece pendente. Nesta revisão, carregamento incremental e imagens ainda precisam de conferência visual; lint passou. Não foram executados testes automatizados nesta tarefa.
- **Critério para concluir:** filtros documentados, incluindo ingredientes quando definido, funcionam em conjunto e não escondem erros como ausência de resultados; validar as combinações em navegador e API.

### 3.4 Página individual de receita — [x] Concluído para o escopo atual

- **Objetivo:** oferecer URL compartilhável com conteúdo completo de uma receita por idioma.
- **Backend:** `GET /api/recipes/[slug]` e `services/recipes.js` resolvem o slug independentemente do idioma, retornam a tradução e ingredientes no idioma solicitado e filtram receitas publicadas; conteúdo ausente/despublicado retorna 404.
- **Frontend:** `app/recipes/[slug]/page.js` apresenta detalhes, imagem/placeholder, ajuste de porções, checklist de ingredientes, modo de preparo e Modo Cozinha. A interface oferece compartilhamento nativo quando disponível e cópia do link como alternativa; a troca de locale preserva o slug.
- **Dependências:** API de leitura por slug, traduções e Storage opcional.
- **Como testar e validar:** testes de API, domínio e porções existem na suíte. O usuário confirmou no navegador a página, navegação e ajuste de porções, e depois confirmou a correção do erro de renderização. Não há teste end-to-end automatizado; o redesenho recente ainda requer revisão manual formal nos viewports prioritários.
- **Critério para concluir:** páginas apresentam receita, ingredientes, preparo, metadados e idioma corretos sem revelar rascunhos. Critério atendido para o escopo atual, com validação manual registrada; automação end-to-end permanece pendente em 7.1.

### 3.5 Busca — [~] Busca por título confirmada; busca por ingrediente pendente

- **Objetivo:** localizar receitas pelo título ou ingrediente, respeitando o idioma selecionado para exibição.
- **Backend:** `GET /api/recipes` busca títulos em `pt-BR` e `en`, retorna somente receitas publicadas e aplica locale para a tradução apresentada. Busca por ingrediente ainda não foi implementada.
- **Frontend:** campo com debounce de 350 ms, estados de carregamento/erro/sem resultados, limpeza dos filtros, paginação incremental e cancelamento/controle sequencial para ignorar respostas antigas.
- **Dependências:** página individual, conteúdo traduzido e decisão de busca do banco/API.
- **Como testar e validar:** o usuário confirmou a busca em português e inglês e a mensagem sem resultados. Busca por ingrediente segue ausente. A revisão do código confirma debounce e proteção contra resposta obsoleta; paginação ainda requer validação manual. Lint passou; não foram executados testes automatizados nesta tarefa.
- **Critério para concluir:** busca por título e ingrediente (caso a busca por ingrediente permaneça no escopo), sem rascunhos, com resultados que levam a URLs canônicas válidas e validação manual/API registrada.

### 3.6 Compartilhamento — [~] Implementado no código; validação manual direcionada pendente

- **Objetivo:** permitir que visitantes compartilhem receitas por URL e canais comuns.
- **Backend:** fornecer URLs canônicas e metadados por slug/idioma.
- **Frontend:** a página de receita tem ação de compartilhar via Web Share API quando suportada e alternativa para copiar o link, preservando `locale`.
- **Dependências:** página individual e metadados SEO.
- **Como testar e validar:** conferir Web Share API, fallback de cópia, locale, URL canônica e abertura em nova sessão/dispositivo. Não há confirmação manual específica nem E2E registrado para estes caminhos.
- **Critério para concluir:** link compartilhado abre a mesma receita publicada e mostra idioma e preview corretos.

### 3.7 Layout responsivo — [~] Correções principais confirmadas; ordem responsiva aguarda validação

- **Objetivo:** manter uso confortável em mobile, tablet e desktop.
- **Backend:** garantir respostas e payloads que não dependam do tamanho de tela.
- **Frontend:** home, formulários e detalhes contêm breakpoints e controles voltados a toque. O usuário confirmou no celular que os ajustes anteriores dos indicadores e da visibilidade do sorteio corrigiram os problemas encontrados. Nesta alteração, a página de receita passou a renderizar modo de preparo antes dos ingredientes em telas abaixo de 768 px e a preservar a ordem ingredientes/preparo a partir do breakpoint `md` em tablets e desktops. A ordem é atualizada no DOM de acordo com a viewport, mantendo coerentes a leitura assistiva e a navegação por teclado; os componentes são renderizados uma vez e têm chaves estáveis para preservar estado. Dois atalhos por âncora foram acrescentados abaixo dos indicadores. A validação manual desses novos comportamentos ainda está pendente.
- **Dependências:** cada página pública e administrativa.
- **Como testar e validar:** no celular, confirmar a ordem foto/dados → preparo → ingredientes; testar os dois atalhos e conferir que o título não fica escondido; marcar ingredientes, ajustar porções e iniciar/navegar/sair do Modo Cozinha. Em tablet e desktop, confirmar ingredientes antes do preparo e o layout existente. Repetir atalhos com movimento reduzido e testar navegação por teclado/leitor de tela. As correções anteriores do celular foram confirmadas pelo usuário; esta mudança de ordem e navegação ainda requer confirmação. Também faltam auditoria mais ampla de overflow, áreas de toque, orientação e demais páginas.
- **Critério para concluir:** fluxos essenciais são utilizáveis nos viewports definidos e a validação está registrada por página.

### 3.8 Páginas de erro públicas — [~] Implementadas; revisão de cobertura pendente

- **Objetivo:** orientar a recuperação de páginas inexistentes e falhas inesperadas em português e inglês.
- **Backend:** a página de detalhes usa resolução de receita publicada e `notFound()` para ausência/despublicação; falhas temporárias permanecem erros, não 404.
- **Frontend:** existem páginas personalizadas 404/erro com links de retorno e nova tentativa; erros administrativos têm apresentação pt-BR própria.
- **Dependências:** App Router, resolução pública por slug e tratamento dos erros de serviço.
- **Como testar e validar:** verificar slug inexistente, receita não publicada, falha temporária, botão de retry e links em ambos os idiomas; confirmar proteção das páginas administrativas.
- **Critério para concluir:** cada situação produz a tela correta sem mascarar erros de servidor nem divulgar informação privada.

### 3.9 Ordenação do catálogo público — [~] Três ordenações confirmadas; paginação pendente

- **Objetivo:** facilitar a descoberta de receitas no catálogo sem inventar métricas de popularidade.
- **Backend:** `GET /api/recipes` ordena por `recipes.created_at` (mais recentes adicionadas), `prep_time_minutes` (mais rápidas) ou título da tradução selecionada (ordem alfabética). O schema não possui `published_at`; portanto, “mais recentes” significa criadas no catálogo, não publicadas mais recentemente.
- **Frontend:** seletor de ordenação pt-BR/en integrado à busca e aos filtros, grade responsiva, exibição inicial paginada e botão para carregar mais receitas.
- **Dependências:** conteúdo publicado, traduções, consulta pública e slug canônico.
- **Como testar e validar:** o usuário confirmou manualmente as três opções de ordenação e os links dos cartões. No código, empates usam critérios de desempate estáveis e a consulta aplica os filtros antes do intervalo de página. Ainda é necessário validar no navegador mais de uma página combinando ordenação, busca e filtros; não houve confirmação visual nesta tarefa.
- **Critério para concluir:** ordem e contagens correspondem aos dados publicados para todos os filtros, locales e páginas; verificação manual registrada.

### 3.10 Avaliações e popularidade — [ ] Não iniciado; proposta para fase futura

- **Objetivo:** permitir futuramente ordenações “Mais avaliadas” e “Mais populares” somente quando existirem dados reais e confiáveis.
- **Backend:** antes de criar schema, definir identidade/limite de avaliações, prevenção de duplicação e abuso, retenção e privacidade. Uma opção futura é tabela de avaliações ligada a `recipe_id`, nota inteira de 1–5 e identidade validada quando houver conta, ou um mecanismo anônimo com token de uso e limites documentados. Visualizações devem ser registradas como eventos agregáveis, idealmente com agregação diária por receita, evitando atualizar um contador único a cada acesso; não armazenar IP bruto. Ingestão, rate limit e regras anti-bot precisam ser definidas antes de migration.
- **Frontend:** só oferecer médias, contagens e ordenações quando calculadas de registros reais; explicar a janela usada para popularidade e não exibir valores fictícios.
- **Dependências:** decisão de privacidade, identidade e moderação; migrations revisadas; RLS e limites contra abuso; catálogo público.
- **Como testar e validar:** testar duplicidade, spam, abuso, agregados, janelas temporais, RLS e exclusão/anonimização conforme política definida.
- **Critério para concluir:** dados reais com regras contra abuso, privacidade documentada e agregados verificáveis; nenhum número de exemplo apresentado como métrica real.

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
- **Como testar e validar:** a inspeção remota anterior encontrou traduções em pt-BR e en para o catálogo existente. O usuário confirmou navegação pública e ajuste de porções; a alternância em todas as rotas/receitas deve continuar coberta nas verificações públicas. Não tomar as contagens observadas anteriormente como inventário atual após operações editoriais posteriores.
- **Critério para concluir:** os dois idiomas funcionam na interface e para as 10 receitas atuais, inclusive ingredientes e instruções.

### 5.2 Arquitetura para novos idiomas — [ ] Não iniciado

- **Objetivo:** permitir adicionar idiomas sem duplicar páginas ou lógica de negócio.
- **Backend:** documentar código de idioma, cobertura de tradução e comportamento quando faltar conteúdo; ajustar allowlist somente junto com conteúdo completo.
- **Frontend:** organizar dicionários e seletor para novas opções com fallback da interface claramente definido.
- **Dependências:** processo editorial de tradução e cobertura de receitas/ingredientes.
- **Como testar e validar:** adicionar idioma de teste em ambiente isolado e verificar interface, API, slugs e dados incompletos.
- **Critério para concluir:** um novo idioma pode ser habilitado sem fallback silencioso de conteúdo no idioma errado.

### 5.3 Fluxo de revisão e completude das traduções — [~] Regra e indicadores implementados; revisão editorial pendente

- **Objetivo:** manter qualidade e consistência das traduções de interface, receitas, ingredientes e imagens.
- **Backend:** `modules/recipes/domain/translation-completeness.mjs` define campos essenciais (título, slug válido e ao menos uma instrução); a regra é compartilhada por validação editorial, dashboard e lista. Publicação é validada no backend/RPC; descrições opcionais vazias não contam como pendência.
- **Frontend:** dashboard e listagem indicam receita, idioma e campos faltantes e levam ao editor; rascunhos podem ser salvos incompletos.
- **Dependências:** painel administrativo, novos idiomas e política de publicação.
- **Como testar e validar:** testes de domínio/validação existem, mas a atualização mais recente não foi reexecutada; conferir contagens do dashboard e filtros e testar rascunho incompleto versus publicação bloqueada. Não há confirmação manual completa desses cenários.
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

### 7.1 Testes funcionais — [~] Suíte existente; fluxos recentes sem nova execução

- **Objetivo:** validar fluxos públicos e administrativos antes de cada lançamento.
- **Backend:** cobrir contratos de API, validações, traduções, consultas e respostas de erro.
- **Frontend:** cobrir sorteio, idioma, categorias, páginas de receita, formulários e estados de erro.
- **Dependências:** funcionalidades correspondentes e decisão de framework de testes.
- **Como testar e validar:** executar testes automatizados em CI e uma lista de verificação manual para fluxos críticos.
- **Estado atual:** o repositório tem 15 arquivos `*.test.mjs` e 84 chamadas `test()` no momento da inspeção. A última execução registrada em 12/11/2026 passou `npm test` (84 testes), `npm run lint` e `npm run build`, antes das alterações mais recentes de recuperação de senha e apresentação da página de receita. Essas alterações não foram verificadas pela suíte automatizada. Confirmações manuais atuais estão enumeradas no Estado atual; não há E2E automatizado. Logout, expiração, usuário comum e recuperação de senha não foram confirmados manualmente.
- **Critério para concluir:** fluxos críticos públicos e administrativos têm cobertura repetível e bloqueiam regressões antes do deploy.

### 7.2 Testes de segurança — [~] Inspeção estrutural feita; validação comportamental incompleta

- **Objetivo:** comprovar que dados de rascunho, operações administrativas e uploads não são acessíveis sem autorização.
- **Backend:** testar RLS, papéis, rotas, Storage, entradas malformadas, segredos e limites de abuso.
- **Frontend:** confirmar que erros não expõem chaves, tokens ou detalhes internos.
- **Dependências:** Auth, autorização, RLS administrativas e Storage.
- **Como testar e validar:** inspeção remota anterior confirmou grants, políticas RLS, bucket privado e leitura pública. O usuário confirmou operações admin do fluxo editorial e imagens, mas não foram validados anon/usuário comum, expiração, tentativas diretas sem permissão ou negação no Storage. As 43 verificações pgTAP e a reprodução isolada seguem pendentes.
- **Critério para concluir:** não há acesso não autorizado nos cenários definidos e achados críticos foram corrigidos.

### 7.3 SEO — [~] Base parcial; requisitos de publicação pendentes

- **Objetivo:** tornar receitas públicas encontráveis e compartilháveis em cada idioma.
- **Backend:** gerar metadados por slug, sitemap, canonical e alternates de idioma somente para conteúdo publicado.
- **Frontend:** layout e páginas têm metadados básicos; metadados específicos por receita, dados estruturados, sitemap, hreflang e previews ainda precisam ser avaliados/implementados. Não considerar SEO concluído.
- **Dependências:** página individual, slugs traduzidos e política de publicação.
- **Como testar e validar:** inspecionar HTML renderizado, sitemap, canonical, hreflang e previews com validadores públicos.
- **Critério para concluir:** páginas indexáveis descrevem o conteúdo correto e páginas não publicadas ficam fora do índice.

### 7.4 Desempenho — [~] Lentidão relatada; diagnóstico não iniciado

- **Objetivo:** investigar a lentidão relatada e manter carregamento rápido e consultas eficientes em redes e dispositivos comuns.
- **Backend:** medir consultas, limites, índices e payloads; otimizar com evidência antes de alterar o banco.
- **Frontend:** otimizar imagens reais, fontes, JavaScript e renderização responsiva.
- **Dependências:** páginas e imagens implementadas, tráfego de referência e orçamento de performance definido.
- **Como testar e validar:** primeiro reproduzir e medir rotas, consultas e Core Web Vitals; não há diagnóstico ou baseline de desempenho registrado.
- **Critério para concluir:** metas acordadas são atingidas nos fluxos e dispositivos prioritários sem perda funcional.

### 7.5 Acessibilidade — [~] Recursos pontuais implementados; auditoria pendente

- **Objetivo:** tornar sorteio, seletor de idioma, receitas e painel operáveis por teclado e tecnologias assistivas.
- **Backend:** garantir mensagens de erro e conteúdo semântico no contrato de API.
- **Frontend:** há rótulos, estados de foco e anúncios acessíveis em diversos controles; falta auditoria sistemática de teclado, contraste, leitor de tela, movimento reduzido e telas públicas/administrativas.
- **Dependências:** cada interface implementada.
- **Como testar e validar:** auditoria automática mais revisão manual de teclado e leitor de tela em desktop/mobile.
- **Critério para concluir:** não há barreiras críticas nos fluxos essenciais e as pendências restantes têm plano registrado.

### 7.6 Deploy na Vercel — [ ] Não iniciado; aplicação não publicada

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
