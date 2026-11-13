# WhatToEat

O WhatToEat ajuda a decidir o que preparar por meio de receitas revisadas manualmente, sorteio por categoria e páginas de detalhes. O MVP público não exige cadastro. O projeto está em desenvolvimento e ainda não foi publicado.

## Funcionalidades atuais

### Site público

- Sorteio de receitas publicadas por categoria.
- Interface em português brasileiro (padrão) e inglês (`?locale=en`).
- Página individual com ingredientes, quantidades ajustáveis, checklist e instruções.
- Modo Cozinha com navegação por etapas.
- Compartilhamento nativo quando suportado e cópia do link como alternativa.
- Exibição de fotos cadastradas ou placeholder e páginas personalizadas de erro.

### Painel administrativo

- Login administrativo Supabase Auth e rotas protegidas no servidor.
- Dashboard com indicadores editoriais e acesso às listas filtradas.
- Cadastro/edição de receitas, rascunhos, publicação/despublicação e exclusão.
- Catálogo de ingredientes com pesquisa e integração ao editor de receitas.
- Traduções editoriais em pt-BR e inglês.
- Upload, substituição e remoção de fotos no Supabase Storage.
- Formulários e mensagens administrativas exclusivamente em pt-BR.
- Recuperação de senha implementada no código; o envio e o callback ainda aguardam validação por e-mail, temporariamente indisponível.

O usuário confirmou manualmente no navegador login, indicadores do dashboard, listagem, criação de rascunho, pesquisa/seleção de ingredientes, edição/salvamento, publicação/despublicação, upload/substituição/remoção de imagens, exclusão de uma receita de teste e correção de renderização dos detalhes. Essas confirmações não equivalem a E2E ou à auditoria de acesso por papéis. Consulte o roadmap para estados e pendências completos.

## Tecnologia e organização

- Next.js 16 App Router e Route Handlers.
- JavaScript, React 19 e Tailwind CSS 4.
- Supabase PostgreSQL, Auth e Storage.
- Arquitetura de monólito modular organizada por receitas, ingredientes e administração, com funções de domínio, casos de uso, repositórios e adaptadores HTTP.

O acesso ao Supabase ocorre no servidor. Páginas e componentes do navegador chamam as APIs Next.js. Autenticação e autorização administrativas são verificadas no backend; RLS é uma camada adicional. A aplicação não usa `service_role` para contornar RLS e não deve conter credenciais privilegiadas no navegador.

As migrations `20261111233556_initial_schema_baseline.sql` e `20261112035903_admin_editorial_and_storage.sql` estão registradas como aplicadas no projeto remoto. Ainda faltam reproduzir o schema em ambiente isolado e executar as verificações pgTAP preparadas. Não execute migration remota sem revisar o procedimento e obter autorização explícita.

Veja [PLANO_DESENVOLVIMENTO.md](PLANO_DESENVOLVIMENTO.md) para o status por etapa e [ANALISE_ARQUITETURA_WEB_MOBILE.md](ANALISE_ARQUITETURA_WEB_MOBILE.md) para a arquitetura atual e compatibilidade mobile.

## Requisitos para desenvolvimento local

- Node.js compatível com o Next.js 16 instalado.
- npm.
- Projeto Supabase configurado para o ambiente local.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Configure localmente as variáveis necessárias, sem adicioná-las ao Git ou compartilhá-las em mensagens:

| Variável | Uso |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Chave publicável utilizada pelos clientes server-side e APIs públicas |
| `APP_BASE_URL` | URL base permitida para o callback de recuperação em ambientes configurados |
| `ADMIN_RECOVERY_COOKIE_SECRET` | Segredo server-only para a autorização temporária do fluxo de redefinição de senha |
| `ADMIN_DASHBOARD_RLS_READY` | Gate server-side para consultas administrativas completas do dashboard |
| `ADMIN_EDITORIAL_RLS_READY` | Gate server-side para operações editoriais após verificar RLS |
| `ADMIN_STORAGE_READY` | Gate server-side para operações de imagens após verificar políticas do Storage |

Os três gates administrativos devem ficar no servidor, nunca como `NEXT_PUBLIC_*`. Configurá-los não substitui revisão de políticas nem validação por papel. Não configure chaves `service_role` na aplicação. A recuperação de senha também depende das URLs e do template de e-mail configurados no Supabase Auth; a validação por e-mail está pendente.

## Verificações automatizadas

```bash
npm test
npm run lint
npm run build
```

Na revisão documental de 12/11/2026 havia 15 arquivos de testes Node e 84 testes registrados. A última execução conhecida passou nos testes, lint e build antes de alterações recentes na recuperação de senha e no visual da página de receita. Essas mudanças recentes não foram revalidadas pela suíte nesta atualização. Não há testes end-to-end automatizados nem teste SQL pgTAP executado.

## Pendências principais

- Conferir que as contagens “Sem imagem” e “Traduções pendentes” do dashboard correspondem exatamente às listas filtradas.
- Validar recuperação de senha quando o serviço de e-mail estiver disponível.
- Reproduzir migrations e executar testes SQL/RLS em ambiente isolado; completar matriz de segurança por papel.
- Consolidar a estratégia de slug canônico sem quebrar URLs antigas.
- Revisar os módulos/fachadas existentes e investigar a lentidão relatada.
- Validar responsividade, acessibilidade, SEO e funcionalidades públicas ainda não implementadas.
- Preparar deploy e configuração de produção na Vercel; o site ainda não está publicado.

## Escopo

Receitas são cadastradas e revisadas manualmente. O MVP não inclui autenticação de usuários finais. Aplicativo mobile Expo, recomendações personalizadas, favoritos, planejamento semanal e monetização continuam fora da implementação atual.
