# Auditoria de arquitetura, organização e desempenho

**Projeto:** WhatToEat  
**Data da análise:** 12/11/2026  
**Escopo:** somente leitura; nenhum arquivo de aplicação, dado ou estrutura remota foi alterado. Não foram executados testes automatizados nem instaladas dependências.

## Resumo executivo

A aplicação já está organizada como monólito modular em Next.js, com módulos de receitas, ingredientes e administração, além de camadas de domínio, casos de uso e infraestrutura. Não há evidência de que o número de módulos, por si só, cause a lentidão percebida.

Os indícios mais fortes de trabalho adicional no caminho de carregamento são as consultas Supabase encadeadas na página de receita e as consultas administrativas que carregam catálogos e filtram parte dos dados em memória. A home não consulta o Supabase no carregamento inicial; a consulta acontece quando o usuário solicita um sorteio.

Os registros disponíveis do Supabase mostram latências relevantes nas APIs, mas não permitem atribuir o tempo total a uma página específica. Não havia servidor local ativo nem medições de navegador, waterfall de rede, TTFB, LCP ou tamanho do bundle de produção disponíveis durante esta auditoria. Portanto, a causa exata da lentidão percebida ainda precisa ser medida.

## 1. Visão geral da arquitetura atual

- Aplicação web em Next.js App Router, JavaScript, React e Tailwind CSS.
- Monólito modular por áreas de negócio: receitas, ingredientes e administração.
- Separação pragmática entre domínio, casos de uso, repositórios/infraestrutura e apresentação.
- Route Handlers fazem a fronteira HTTP; autenticação e autorização administrativas são verificadas no servidor.
- O acesso ao Supabase ocorre no backend, com RLS como camada adicional de proteção.
- O site público oferece sorteio e detalhes de receitas, conteúdo bilíngue e interação de porções, checklist, Modo Cozinha e compartilhamento.
- A área administrativa contém login e operações editoriais. Sua interface é exclusivamente pt-BR.
- Há migrations versionadas e as migrations baseline e editorial/Storage constam no histórico remoto como aplicadas. O comentário inicial da migration editorial ainda diz que ela não foi aplicada, criando documentação contraditória.

Arquivos de apresentação relativamente grandes incluem `app/page.js` (619 linhas) e `app/admin/recipe-editor.js` (412 linhas). Tamanho, isoladamente, não justifica reescrita; a decisão deve considerar coesão e medições.

## 2. Arquivos comprovadamente desnecessários

Não foi possível declarar com segurança nenhum arquivo como removível sem verificar consumidores fora da aplicação, scripts locais e links diretos. A busca estática encontrou alguns módulos sem import local direto, mas isso não prova que sejam inúteis: podem ser fachadas de compatibilidade, APIs de importação externa ou dependências de testes.

### Candidatos a investigação, não à exclusão automática

- `domain/admin-dashboard.mjs`
- `domain/portions.mjs`
- `lib/admin/validation.mjs`
- `lib/api/admin-editorial.mjs`
- `lib/api/admin-password-recovery.mjs`
- `lib/auth/admin.js`

Alguns podem ser fachadas antigas para módulos atuais. Antes de removê-los, verificar imports dinâmicos, testes, scripts, documentação e referências externas.

Os SVGs padrão `file.svg`, `globe.svg`, `next.svg`, `vercel.svg` e `window.svg` não têm referências internas encontradas. São candidatos a limpeza somente após confirmar que não são usados por URL direta ou documentação.

Os diretórios vazios `config/` e `database/` parecem não conter implementação. Podem ser removidos ou documentados quando a organização final for decidida; a existência vazia não comprova dano nem impacto de desempenho.

O módulo `domain/recipes.mjs` está em uso e não deve ser removido por ser pequeno ou por coexistir com o módulo mais novo.

## 3. Arquivos que exigem investigação e documentação possivelmente obsoleta

- `docs/api/get-random-meal.md` descreve inglês como idioma padrão, enquanto a implementação atual usa pt-BR. Atualizar o contrato documentado após confirmar todos os comportamentos e parâmetros atuais.
- `RELATORIO_AUDITORIA_ARQUITETURA.md` é um registro histórico e contém afirmações antigas de que migration/RLS ainda estariam pendentes. Não deve ser usado como fonte do estado atual sem contextualização.
- O cabeçalho de `supabase/migrations/20261112035903_admin_editorial_and_storage.sql` indica que a migration não foi aplicada, embora ela apareça aplicada no histórico remoto. Corrigir o comentário em uma alteração documental futura, sem reexecutar o SQL.
- `PLANO_DESENVOLVIMENTO.md` e `ANALISE_ARQUITETURA_WEB_MOBILE.md` são as referências mais atuais, mas precisam continuar alinhadas às evidências de código e validação manual.

## 4. Duplicações e abstrações

### Abstrações que parecem justificadas

Os módulos de domínio, aplicação e infraestrutura ajudam a manter consultas Supabase fora da interface e regras reutilizáveis fora dos Route Handlers. Repositórios e casos de uso são adequados onde há dependências reais e comportamento testável. Não há motivo para introduzir classes em funções puras apenas para adotar POO.

### Duplicações observadas

- O mapeamento dos campos/idiomas usados para verificar traduções pendentes aparece em mais de um fluxo, incluindo dashboard e listagem. Deve haver uma regra de domínio única consumida por ambos.
- Categorias e idiomas aparecem em módulos de domínio e novamente em estruturas de interface. A UI deve derivar opções de uma fonte única quando o contrato permitir.
- Algumas fachadas antigas coexistem com os módulos novos. Isso pode ser compatibilidade deliberada, mas precisa ser documentado e removido somente depois de analisar os consumidores.
- Os componentes de campos de ingredientes já são reutilizados; essa reutilização deve ser preservada em vez de copiar formulários.

A varredura estática encontrou 123 arquivos JavaScript e 170 imports locais; não encontrou ciclo entre esses imports. Importações dinâmicas e dependências indiretas podem não ser cobertas por essa contagem, então o resultado não prova ausência absoluta de ciclos.

Não foi comprovada dependência npm sem uso. As dependências principais de Next.js, React, Supabase, Tailwind, ESLint e Turbopack têm uso aparente; a CLI Supabase é intencionalmente ferramenta de desenvolvimento. Uma análise de bundle/licenças seria necessária antes de remover dependências.

## 5. Gargalos e evidências de desempenho

### Página inicial

- O carregamento inicial não consulta o Supabase. O pedido de receita ocorre quando o usuário solicita um sorteio.
- A página concentra estado de interface, seletor, botões e elementos SVG em um Client Component grande. Isso merece revisão de divisão e medição do JavaScript enviado, mas não prova que seja a causa da demora.
- O endpoint de sorteio busca o conjunto candidato e escolhe uma receita na aplicação. Em catálogos maiores, trazer todos os candidatos pode crescer em custo e transferência.
- O tamanho aproximado de 31,8 KB do arquivo-fonte não representa o bundle final do navegador.

### Página de detalhes da receita

O fluxo executa etapas de resolução/consulta em sequência: resolver o slug, buscar a receita, buscar relações de ingredientes, traduções dos ingredientes e URL assinada da imagem, quando aplicável. A serialização pode aumentar o tempo percebido. Uma consulta PostgREST com relações embutidas pode reduzir round trips, desde que preserve RLS, publicação e locale.

Dados disponíveis nos logs do projeto para a janela observada de 24 horas:

| Origem/endpoint | Requisições | p95 observado |
|---|---:|---:|
| `/auth/v1/user` | 763 | 657 ms |
| Data API de `recipes` | 474 | 637 ms |
| Data API de `recipe_translations` | 393 | 474 ms |
| Data API de `recipe_ingredients` | 189 | 444 ms |
| Data API de `ingredient_translations` | 139 | 424 ms |
| Storage | 26 | 730 ms |

O agregado não informa que chamadas pertencem à mesma navegação, nem é possível somar os p95 para obter o tempo de uma página. Os dados incluem tráfego total do projeto. Não foi observado erro 5xx no resumo consultado. A assinatura da URL de Storage pode adicionar uma etapa, mas não foi comprovada como causa principal.

O índice único remoto de slug é composto por `(language_code, slug)`, enquanto a busca canônica pode filtrar apenas por slug. Não foi encontrado índice isolado de slug. Para o catálogo atual uma varredura sequencial pode ser rápida; com o crescimento, a estratégia deve ser medida e compatibilizada com os slugs históricos.

### Painel administrativo

- O proxy atualiza a sessão e os layouts/handlers também verificam o usuário e a autorização. Esse trabalho repetido é uma sobrecarga potencial, mas é uma proteção deliberada e não deve ser removido sem preservar autorização por endpoint.
- O dashboard carrega dados após hidratação via `useEffect`, e depois chama API que autentica novamente e consulta os indicadores. Isso pode atrasar a exibição inicial.
- Os filtros `sem imagem` e `traduções pendentes` do repositório de receitas carregam listas de receitas/traduções e filtram em memória.
- A busca pode disparar requisições enquanto o administrador digita; o padrão observado não cancela necessariamente as requisições anteriores. Respostas podem competir e gerar tráfego adicional.
- A busca `ILIKE '%termo%'` não aproveita um índice B-tree convencional. A necessidade de índice específico depende do volume e de medição.
- A listagem de ingredientes carrega até 500 itens; avaliar paginação apenas se o catálogo justificar.

### Imagens, fontes e renderização

- Há uso de `<img>` em páginas públicas em vez de `next/image`; isso não oferece automaticamente `srcset`/redimensionamento e pode transferir imagens originais.
- Proporções e dimensões reservadas ajudam a reduzir deslocamento visual. Não houve medição de CLS.
- As imagens administrativas são privadas e usam URLs assinadas. A otimização por proxy padrão do Next pode não encaminhar cabeçalhos de autenticação para origens protegidas. Não trocar por URLs públicas nem comprometer a privacidade; avaliar o fluxo de imagem e expiração antes de mudar.
- `Geist` e `Geist_Mono` são importadas, mas CSS do corpo força Arial e as classes de fonte aparentam pouco uso. Isso pode gerar assets desnecessários. Confirmar o CSS computado e bundle antes de remover.
- Há 21 diretivas `"use client"`; esse número não equivale ao número de bundles independentes. É necessário medir o JS de produção e analisar a árvore client/server.
- Não foram coletados dados do React Profiler nem relatório de bundle.

### Métricas oficiais consultadas

O uso de logs/planos deve seguir documentação oficial do Supabase: [Performance Tuning](https://supabase.com/docs/guides/platform/performance), [Query plans com explain()](https://supabase.com/docs/guides/api/query-plans) e [RLS: chamar funções com SELECT](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select).

## 6. Problemas comprovados e hipóteses a medir

### Confirmado por código ou informação remota consultada

- A home não busca uma receita no Supabase até a ação de sorteio.
- O carregamento de detalhes envolve consultas encadeadas.
- Os filtros administrativos de imagem/tradução consultam conjuntos amplos e filtram no servidor em memória.
- A busca administrativa pode enviar requisições sucessivas durante a digitação.
- A consulta canônica por slug não corresponde diretamente ao índice único composto existente.
- Os logs Supabase apresentam as latências p95 da tabela acima; são dados do projeto, não medições de página.
- A migration administrativa está aplicada no histórico remoto, apesar do comentário contrário no arquivo SQL.
- Os avisos de segurança consultados incluem proteção contra senhas vazadas desativada e políticas permissivas sobrepostas nas cinco tabelas públicas. O advisor também aponta `auth_rls_initplan`; as políticas live verificadas usam `(SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`. Qualquer mudança precisa comparar o advisor com as políticas reais e validar a matriz de papéis, sem remover acesso público nem segurança administrativa.

### Não comprovado

- A causa exata da lentidão vista pelo usuário, o TTFB/LCP e se afeta produção.
- O peso real dos bundles client-side, custo de hidratação e renders React.
- Se uma consulta específica executa scan caro no volume atual; requer `EXPLAIN` e dados de volume.
- Se as chamadas observadas pertencem ao mesmo pedido de página.
- Se a transferência de imagens ou fontes é um gargalo importante.
- Se a lentidão ocorre apenas no servidor de desenvolvimento.

## 7. Recomendações por prioridade

1. **Medir o fluxo real:** comparar home, sorteio, detalhe com/sem imagem e dashboard. Registrar TTFB, waterfall, tempo das chamadas Supabase, hidratação, imagem e JavaScript. Comparar servidor de desenvolvimento com build de produção.
2. **Reduzir requisições de busca administrativa:** aplicar debounce e cancelamento/controle de respostas antigas, mantendo autorização e filtros no backend.
3. **Melhorar o primeiro carregamento do dashboard/listagem:** avaliar renderização inicial no servidor para usuário autorizado; manter autorização dentro de cada API e não aplicar cache compartilhado a dados privados.
4. **Reduzir round trips públicos:** avaliar relações embutidas PostgREST na página de detalhes, preservando publicação, locale, RLS e tratamento de erros.
5. **Otimizar filtros conforme o volume:** medir custo e cardinalidade; considerar paginação ou consulta mais seletiva sem duplicar a regra de completude de tradução.
6. **Otimizar imagens e fontes com dados reais:** medir bytes/dimensões; considerar variantes responsivas e cache público apenas para recursos públicos. Preservar bucket privado e validade de URLs assinadas.
7. **Limpar com cautela:** confirmar referências internas/externas para fachadas, SVGs, fontes e diretórios vazios antes de remover ou consolidar.
8. **Revisar segurança e documentação:** reconciliar avisos do advisor com políticas efetivas e corrigir descrições desatualizadas sem executar mudanças remotas não autorizadas.

## 8. Riscos das refatorações

- Alterar RLS ou políticas permissivas pode bloquear leitura pública ou expor rascunhos; testar matriz anon/usuário/admin antes da aplicação.
- Duplicar a regra de completude em SQL, dashboard e domínio pode produzir contagens divergentes.
- Cache público não pode conter dados administrativos; dados privados precisam permanecer sem cache compartilhado.
- Cachear URL assinada além de sua validade pode quebrar imagens; substituição/remoção também precisa invalidar caminhos antigos.
- Remover fachadas, SVGs ou fontes pode quebrar scripts, referências diretas ou consumidores externos não encontrados por `rg`.
- Dividir a home sem preservar a fronteira client/server pode não reduzir JavaScript e pode afetar idioma e estado do sorteio.
- Otimizar somente em desenvolvimento pode mascarar problemas de produção, e o contrário também é possível.

## 9. Estrutura simplificada proposta

Preservar a arquitetura modular existente e consolidar gradualmente em torno dos módulos de negócio. Não é recomendada uma migração geral agora.

```text
app/                         # Rotas, layouts e Route Handlers Next.js
modules/
  recipes/
    domain/                  # Regras puras e contratos de receita
    application/             # Casos de uso
    infrastructure/
      supabase/              # Repositórios e mapeamento Supabase
    presentation/            # Componentes específicos de receitas, se útil
  ingredients/
    domain/
    application/
    infrastructure/supabase/
  admin/
    domain/
    application/
    infrastructure/supabase/
    presentation/http/       # Adaptadores administrativos HTTP
shared/
  http/                      # Erros e validação compartilhados
  i18n/                      # Locales e utilitários comuns
supabase/                    # Migrations e configuração local
tests/                       # Testes de domínio, casos de uso e integração
```

As fachadas em `domain/` e `lib/api/` devem permanecer enquanto houver consumidores. No futuro mobile, o Expo pode consumir Route Handlers via HTTPS e compartilhar funções puras/contratos de domínio; não deve compartilhar HTML, SSR nem credenciais Supabase do servidor.

## 10. Plano incremental

1. Registrar medições de referência e separar ambiente de desenvolvimento e produção.
2. Corrigir tráfego de busca administrativa com debounce e cancelamento, com testes do comportamento.
3. Medir o detalhe e prototipar uma leitura com menos round trips em ambiente seguro; conferir planos, RLS e locale.
4. Medir filtros com o catálogo real e escolher paginação/consulta adequada mantendo uma única regra de domínio.
5. Otimizar imagens/fontes somente após medir tamanho, dimensões e impacto visual.
6. Completar validação de segurança e integração para RLS, Storage e publicação em ambiente isolado antes de alterações remotas.
7. Consolidar/remover arquivos apenas após busca de referências e validação das rotas que os utilizam.

Cada etapa deve ser pequena, revisável e acompanhada por verificações proporcionais; a limpeza não deve preceder a medição nem remover controles de segurança.

## Conclusão

A auditoria encontrou padrões que podem aumentar a latência, em especial as consultas Supabase sequenciais na página de detalhes e filtros administrativos que carregam dados amplos para filtragem. Os registros do Supabase confirmam latência nas APIs, mas não identificam a causa da demora percebida em cada página. Sem waterfall do navegador e medição comparativa de produção, não é correto atribuir a lentidão à quantidade de módulos ou a um único arquivo.

O próximo passo recomendado é medir os caminhos principais em um build de produção e no navegador. Em paralelo, a busca administrativa pode ser melhorada com debounce/cancelamento sem mudar contratos ou segurança. Não há justificativa evidenciada para reescrever o projeto ou remover as camadas de domínio, casos de uso e repositórios.
