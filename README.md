# 🍽️ WhatToEat

**Não sabe o que comer? Deixe o WhatToEat escolher por você!**

O **WhatToEat** é uma aplicação web que ajuda você a decidir o que preparar, sugerindo receitas de forma aleatória de acordo com a categoria selecionada.

O projeto está sendo desenvolvido com foco em uma experiência simples, rápida e intuitiva, com suporte a múltiplos idiomas e uma arquitetura preparada para futuras expansões.

---

## ✨ Funcionalidades

- 🎲 Sorteio aleatório de receitas.
- 🍕 Seleção de receitas por categoria.
- 📖 Visualização de ingredientes e modo de preparo.
- ⚖️ Ajuste de quantidades conforme o número de porções.
- 🌎 Suporte a português brasileiro e inglês.
- 🔐 Autenticação para administradores.
- 🛠️ Painel administrativo em desenvolvimento.

## 🛠️ Tecnologias

| Tecnologia | Utilização |
|---|---|
| Next.js | Framework web e APIs |
| React | Interface do usuário |
| JavaScript | Linguagem de programação |
| Tailwind CSS | Estilização |
| Supabase | PostgreSQL e autenticação |
| GitHub | Versionamento do código |

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura modular inspirada nos princípios de **Clean Architecture**, **SOLID** e separação de responsabilidades.

A organização considera quatro camadas:

- **Presentation:** interface, páginas e endpoints HTTP.
- **Application:** casos de uso e coordenação das operações.
- **Domain:** regras de negócio e validações.
- **Infrastructure:** comunicação com banco de dados e serviços externos.

Os módulos são organizados por funcionalidades, como receitas, ingredientes e administração.

## 🔒 Segurança

O WhatToEat utiliza autenticação com Supabase Auth e autorização administrativa no backend.

As operações administrativas são projetadas para exigir uma sessão válida e permissões específicas, com políticas de segurança no banco de dados como camada adicional de proteção.

## 🚧 Status do desenvolvimento

**Em desenvolvimento ativo.**

| Módulo | Status |
|---|---|
| Interface pública | Implementada |
| Sorteio de receitas | Implementado |
| Detalhes e porções | Implementado |
| Internacionalização | Implementada |
| Autenticação administrativa | Parcial |
| Dashboard administrativo | Parcial |
| Gerenciamento de receitas | Em desenvolvimento |
| Gerenciamento de ingredientes | Planejado |
| Traduções administrativas | Planejado |
| Upload de imagens | Planejado |

## 🚀 Executando localmente

### Pré-requisitos

- Node.js compatível com o projeto
- npm
- Projeto Supabase configurado

Clone o repositório:

```bash
git clone https://github.com/kratonbr/whattoeat.git
cd whattoeat
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente conforme os arquivos e instruções do projeto, sem publicar credenciais privadas.

Inicie o servidor:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

### Verificações

```bash
npm test
npm run lint
npm run build
```

## 🗺️ Próximos passos

- Concluir o painel administrativo.
- Implementar o gerenciamento completo de receitas.
- Integrar upload e gerenciamento de imagens.
- Ampliar os testes automatizados.
- Preparar a arquitetura para uma futura aplicação mobile.

## 👨‍💻 Desenvolvimento

Desenvolvido por [kratonbr](https://github.com/kratonbr).

---

**WhatToEat — Sua próxima refeição começa aqui.**