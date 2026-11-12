<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Regra permanente — idioma da área administrativa

- Toda interface em `/admin` deve ser exclusivamente em português brasileiro (`pt-BR`), incluindo títulos, navegação, botões, formulários, validações, carregamento, notificações, erros e páginas não encontradas.
- Mensagens técnicas ou códigos de erro do backend nunca devem ser exibidos diretamente; converta-os em mensagens amigáveis em português antes de apresentá-los.
- A área administrativa não oferece seletor de idioma. O cadastro e a edição de conteúdo continuam aceitando traduções de receitas em `pt-BR` e `en`.
- Preserve o suporte bilíngue existente na área pública. A regra aplica-se automaticamente a toda página ou funcionalidade administrativa nova.
