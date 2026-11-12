# WhatToEat — Plano de Desenvolvimento

Roadmap oficial para desenvolver, proteger, lançar e monetizar o WhatToEat. Este documento registra o estado observado no código e no Supabase e organiza as próximas etapas para concluir primeiro a experiência web, mantendo as regras de domínio desacopladas para uma futura aplicação mobile.

## Estado atual verificado

Estado atualizado em 11/11/2026, com inspeção do repositório, testes existentes e consultas somente de leitura ao Supabase.

- **Aplicação:** Next.js App Router, JavaScript, React e Tailwind CSS. `package.json` contém comandos `dev`, `build`, `start`, `lint` e `test`.
- **Backend existente:** cliente Supabase server-only em `lib/supabase/server.js`; serviço de leitura em `services/recipes.js`; Route Handler `GET /api/meals/random`.
- **Frontend existente:** página inicial com sorteio, seleção das cinco categorias, estados de carregamento/erro/vazio e seletor ENGLISH/PORTUGUÊS. A página de receita em `app/recipes/slug/page.js` chama `notFound()`; não existe página dinâmica de detalhe.
- **Idiomas:** interface em `lib/i18n.js`; serviço permite `en` e `pt-BR`; as consultas selecionam exatamente `recipe_translations.language_code` e `ingredient_translations.language_code`.
- **Arquivos e histórico do banco:** existem `supabase/seed.sql`, `supabase/config.toml` e o baseline `supabase/migrations/20261111233556_initial_schema_baseline.sql`. A CLI Supabase v2.122.1 está fixada como dependência de desenvolvimento. O histórico remoto do projeto `agihkhcwaqprtftfjyyn` registra `20261111233556` como aplicada; o SQL do baseline não foi executado novamente no remoto.
- **Supabase remoto — tabelas e registros:** `recipes` (10), `recipe_translations` (20), `ingredients` (33), `ingredient_translations` (66) e `recipe_ingredients` (73). As 10 receitas estão publicadas, duas em cada categoria; existem 10 traduções de receita e 33 de ingrediente em cada idioma atual.
- **Relacionamentos principais:** receita → traduções e receita → itens de receita; item de receita → ingrediente; ingrediente → traduções. As chaves estrangeiras e unicidades foram inspecionadas. `instructions` tem constraint que exige array JSONB.
- **Integridade e acesso:** as cinco tabelas têm RLS habilitado. Há políticas públicas de `SELECT` para receitas publicadas e seus dados relacionados; não há políticas públicas de escrita. Existem índices de categoria/status, traduções e relações de ingredientes, além do trigger `recipes_updated_at`.
- **Testes:** `tests/api/random-meals.test.mjs` contém 15 testes automatizados do contrato e da seleção aleatória da API. `npm test` passou com 15/15 testes nesta revisão; não há testes end-to-end da interface.
- **Limitações atuais confirmadas:** o baseline ainda não foi reproduzido em banco isolado, e o procedimento de promoção/rollback não está documentado. Não há bucket de Storage, Supabase Auth no código, autorização administrativa, painel, página pública de detalhe, busca, filtros avançados, funcionalidades de usuário ou monetização. A validação formal de responsividade e a configuração equivalente na Vercel também estão pendentes.
- **Configuração:** `.env.local` existe localmente. Valores não são reproduzidos neste documento. A presença do arquivo não comprova configuração equivalente na Vercel.

## Como acompanhar

- `[ ] Não iniciado`: a funcionalidade ainda não foi implementada ou validada integralmente.
- `[~] Parcial/em andamento`: existe implementação ou preparação, mas falta cumprir todo o critério de conclusão.
- `[x] Concluído`: há evidência no código ou no banco para o escopo descrito no item.
- Itens concluídos representam o escopo atual expressamente descrito; não significam que etapas futuras listadas como dependências também estejam concluídas.
- Cada tarefa registra objetivo, trabalho de backend, trabalho de frontend, dependências, validação e critério de conclusão.

## Ordem recomendada e dependências

1. Concluir a tarefa 1.3: reproduzir o baseline em banco local isolado, comparar o resultado com o schema remoto e documentar promoção e rollback. O histórico remoto já registra o baseline como aplicado.
2. Concluir a experiência pública web usando a API existente: implementar primeiro a página individual de receita (3.4), depois filtros e busca (3.3 e 3.5), compartilhamento (3.6) e validação responsiva formal (3.7).
3. Ampliar os testes funcionais além dos 15 testes atuais da API; validar segurança, SEO, desempenho e acessibilidade dos fluxos públicos antes do deploy web.
4. Antes do painel administrativo, concluir Auth, autorização, RLS administrativa, Storage e testes de integridade/segurança (1.4–1.8 e 1.10); então implementar as tarefas da seção 2.
5. Preparar deploy, configuração segura por ambiente e monitoramento na Vercel após os critérios de lançamento web.
6. Manter `domain/` e os contratos de API sem dependência de Next.js ou do navegador. Planejar Expo e funcionalidades mobile depois de estabilizar a versão web; não antecipar essa implementação.
7. Desenvolver recomendações regionais, novos idiomas, publicidade e Premium depois de validar produto, conteúdo, segurança e privacidade.

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

### 1.4 Supabase Auth para administradores — [ ] Não iniciado

- **Objetivo:** habilitar acesso autenticado ao painel, sem introduzir contas de usuário final no MVP público.
- **Backend:** configurar Auth, sessão/cookies no servidor, callbacks, expiração e recuperação segura de sessão.
- **Frontend:** fornecer fluxos de login e recuperação de acesso no painel administrativo.
- **Dependências:** migrations versionadas; variáveis corretas por ambiente; fluxo de autorização de administrador definido.
- **Como testar e validar:** testar login, logout, sessão expirada, recuperação e acesso anônimo às rotas protegidas.
- **Critério para concluir:** somente uma sessão válida de administrador pode entrar no painel; o MVP público continua sem cadastro de usuários.

### 1.5 Autorização de administradores — [ ] Não iniciado

- **Objetivo:** separar autenticação de autorização e limitar operações editoriais a administradores aprovados.
- **Backend:** definir fonte confiável do papel administrativo, validar papel em APIs e proteger alterações contra IDOR/escalada de privilégios.
- **Frontend:** apresentar ações administrativas apenas a sessões autorizadas, mantendo a proteção também no servidor.
- **Dependências:** Supabase Auth; modelo de papéis; RLS e políticas administrativas.
- **Como testar e validar:** tentar operações como visitante, usuário autenticado sem papel administrativo e administrador; verificar respostas e auditoria.
- **Critério para concluir:** cada operação administrativa verifica identidade e permissão no servidor e no banco quando aplicável.

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

### 1.9 Serviços e APIs — [x] Sorteio público; administração pendente

- **Objetivo:** centralizar regras de domínio em serviços e expor contratos estáveis por Route Handlers.
- **Backend:** `GET /api/meals/random` e `services/recipes.js` já consultam receitas publicadas, categoria, idioma, exclusão e receita específica; adicionar APIs administrativas depois.
- **Frontend:** página inicial consome a API existente; integrar novas telas aos contratos publicados, sem acesso privilegiado no cliente.
- **Dependências:** schema; políticas de leitura para API pública; Auth/RLS para APIs administrativas.
- **Como testar e validar:** conferir locale/categoria/UUID inválidos, estados 404/503/500, traduções e filtro por publicação; testar autorização das futuras rotas.
- **Cobertura atual:** 15 testes automatizados cobrem parâmetros da API, categorias, idiomas, IDs, seleção aleatória e respostas de erro. A cobertura administrativa ainda não existe.
- **Critério para concluir:** sorteio existente permanece funcional e cada novo endpoint tem validação de entrada, erros previsíveis e autorização adequada.

### 1.10 Testes de segurança e integridade do backend — [ ] Não iniciado

- **Objetivo:** detectar acesso indevido e dados inconsistentes antes de expor novas operações.
- **Backend:** criar verificações de constraints, consistência de traduções, relações receita/ingrediente, RLS, Auth e Storage.
- **Frontend:** validar respostas de erro sem expor detalhes internos nem credenciais.
- **Dependências:** esquema versionado, APIs, Auth, autorização e Storage.
- **Como testar e validar:** executar testes automatizados em ambiente isolado com papéis anon, autenticado e administrador; manter nenhuma escrita na produção durante testes.
- **Critério para concluir:** cenários críticos de leitura, escrita, RLS, integridade e uploads têm resultados repetíveis e registrados.

---

## 2. Painel administrativo

### 2.1 Login e recuperação de senha — [ ] Não iniciado

- **Objetivo:** permitir que administradores entrem e recuperem acesso ao painel.
- **Backend:** usar Supabase Auth e rotas de sessão protegidas.
- **Frontend:** criar formulários de login, solicitação de recuperação, retorno de erro e confirmação de sucesso.
- **Dependências:** tarefas 1.4 e 1.5.
- **Como testar e validar:** testar credenciais válidas/inválidas, links expirados, fluxo em mobile e redirecionamento de sessão.
- **Critério para concluir:** fluxos não revelam se uma conta existe e não permitem acessar o painel sem sessão autorizada.

### 2.2 Dashboard — [ ] Não iniciado

- **Objetivo:** oferecer uma visão operacional do catálogo e dos itens que exigem revisão.
- **Backend:** criar consultas agregadas para receitas publicadas, rascunhos, traduções faltantes e itens sem imagem.
- **Frontend:** criar dashboard com contagens, estados e links para ações editoriais.
- **Dependências:** APIs administrativas, autorização e modelos editoriais.
- **Como testar e validar:** comparar indicadores com consultas SQL de leitura e testar carregamento, erro e ausência de dados.
- **Critério para concluir:** cada indicador coincide com o banco e cada ação leva a uma área autorizada.

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

### 3.4 Página individual de receita — [ ] Não iniciado

- **Objetivo:** oferecer URL compartilhável com conteúdo completo de uma receita por idioma.
- **Backend:** consultar por slug e idioma, ingredientes localizados, imagem e estado publicado; retornar 404 para conteúdo indisponível.
- **Frontend:** substituir o placeholder atual `notFound()` por rota dinâmica e layout de detalhe responsivo.
- **Dependências:** API de leitura por slug, traduções e Storage opcional.
- **Como testar e validar:** testar slugs válidos/inválidos por idioma, receita despublicada, conteúdo sem imagem e navegação mobile.
- **Critério para concluir:** páginas apresentam receita, ingredientes, preparo, metadados e idioma corretos sem revelar rascunhos.

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
- **Estado atual:** há 15 testes automatizados da API de sorteio em `tests/api/random-meals.test.mjs`; `npm test` passou com 15/15 testes em 11/11/2026. Faltam testes da interface, da página de receita, integração ponta a ponta e execução em CI.
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
