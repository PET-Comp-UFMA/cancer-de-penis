# Arquitetura do Sistema

## Visão Geral

O sistema utiliza Next.js com Pages Router. As entradas de rota permanecem em
`src/pages` e reexportam as telas organizadas por funcionalidade em `src/modules`.
A implementação encontrada é predominantemente de apresentação: conteúdo
informativo, cartões dos instrumentos, autores e centros de atendimento.
Não há processamento de respostas ou regras de pontuação implementados nesta
cópia do projeto.

## Stack Atual

- Next.js 16.1.4, React/React DOM 19.2.3 e TypeScript (5.9.3 no lockfile).
- Material UI e seus ícones 7.3.7, Emotion e Montserrat via `@fontsource`.
- Estilos via `sx` do Material UI e CSS; React Compiler e Strict Mode habilitados.
- ESLint 9 com configurações Next.js de TypeScript e Core Web Vitals.
- npm com `package-lock.json`; scripts `dev`, `build`, `start` e `lint`.
- Vercel informada como destino de implantação no contexto do projeto. Não há
  `vercel.json` ou configuração local `.vercel` nesta cópia.

Não foram encontrados ORM, cliente de banco, serviços externos de dados,
arquivos de ambiente, referências a variáveis de ambiente ou testes automatizados.

## Organização do Código

```text
src/
├── pages/                         # Entradas e arquivos especiais do Pages Router
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── autores.tsx
│   ├── locais.tsx
│   ├── api/hello.ts
│   └── tela-avaliacao/
│       ├── tela-avaliacao.tsx
│       └── penrisk.tsx
├── modules/
│   ├── inicio/presentation/
│   │   ├── Home.tsx
│   │   └── Home.module.css
│   ├── autores/presentation/Autores.tsx
│   ├── centros-atendimento/presentation/Hospitais.tsx
│   └── instrumentos/presentation/
│       ├── Avaliacao.tsx
│       └── Penrisk.tsx
├── shared/
│   ├── components/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── styles/globals.css
└── config/theme.ts
```

`public/` mantém todos os assets e seus caminhos. As configurações do Next.js,
ESLint, TypeScript e npm permanecem na raiz. `docs/` reúne requisitos,
arquitetura/modelo de dados e a estrutura inicial da documentação de testes.
O alias `@/*` continua apontando para `./src/*`, sem aliases adicionais.

## Módulos Existentes

| Módulo | Responsabilidade atual | Rotas |
|--------|------------------------|-------|
| `inicio` | Apresentação inicial e informações sobre a doença. | `/` |
| `autores` | Cartões dos autores, com dados estáticos locais. | `/autores` |
| `centros-atendimento` | Cartões dos hospitais e seus links externos, com dados estáticos locais. | `/locais` |
| `instrumentos` | Seleção de instrumentos e tela de apresentação PENRISK. | `/tela-avaliacao/tela-avaliacao`, `/tela-avaliacao/penrisk` |

PENRISK e os cartões QUALIPEN pertencem ao mesmo contexto de apresentação.
Não existem regras independentes de cálculo a separar ou comportamento de
formulários a generalizar. O link `/qualipen` permanece no conteúdo, mas não
há página correspondente implementada. `/api/hello` permanece como endpoint
de exemplo, com HTTP 200 e resposta `{"name":"John Doe"}`.

## Responsabilidades das Camadas

- `pages`: entradas públicas do framework; `_app` compõe os providers, carrega
  fontes e CSS global; `_document` define o documento HTML; `api/hello` mantém
  seu handler e tipo de resposta local.
- `modules/*/presentation`: telas específicas com seus componentes, conteúdo,
  metadados e estilos existentes. Listas de autores e hospitais permanecem nas
  respectivas telas, sem extração para serviços ou entidades artificiais.
- `shared/components`: Header e Footer reutilizados pelas telas. O estado do
  menu móvel continua local ao Header, com os hooks existentes de React e Next.js.
- `shared/styles`: CSS global; `config/theme.ts`: configuração existente do
  tema Material UI, consumida por `_app`.

Não foram criadas camadas `domain`, `application` ou `infrastructure`: não há
regras puras, casos de uso ou integrações de dados que justifiquem essas divisões
no código atual. Também não há diretórios vazios de hooks, tipos ou utilitários.

## Dependências entre Módulos

O fluxo de imports é `pages → modules/*/presentation → shared/components`.
`_app → config/theme` e `_app → shared/styles` completam a composição global.
Os módulos não importam uns aos outros; a navegação ocorre pelos links existentes.
`shared` e `config` não importam módulos ou páginas. A apresentação depende
explicitamente de React, Next.js e Material UI; não há domínio que dependa deles.

## Decisões Mantidas da Arquitetura Anterior

Foram mantidos Pages Router, URLs, nomes dos componentes exportados, contrato da
API, providers, tema, fontes, metadados, estrutura visual, estilos, assets e dados
estáticos. O CSS `Home.module.css` continua sem importadores; foi apenas colocado
junto à tela de início, sem ativação ou limpeza. Dependências, lockfile, alias,
configurações de build e mecanismo de implantação não foram alterados.

## Pontos Pendentes para a Próxima Etapa

- Validar a diferença entre as funcionalidades descritas no contexto e as
  encontradas neste repositório: não há questionários, cálculos, resultados
  processados ou página QUALIPEN. O botão PENRISK aponta para a própria rota.
- Avaliar posteriormente a duplicação dos cartões de instrumentos, conteúdo
  provisório, imports sem uso, CSS sem uso e composição repetida de Header/Footer.
- Resolver a divergência do modelo preliminar de respostas com
  RF38-RF40/RNF34-RNF36, conforme [Modelo de Dados](data-model.md).
- Validar os estados "não publicado" e "despublicado" e o destino dos instrumentos
  existentes antes de qualquer modelagem ou mecanismo genérico de formulários.
- Revisar a numeração repetida RNF37/RNF38 no material de requisitos e definir
  posteriormente a estratégia de testes, sem relações especulativas de cobertura.

Autenticação, gerenciamento de formulários, publicação e demais requisitos de
evolução estão apenas documentados. Os links do site publicado e do Figma não
ficaram acessíveis durante esta etapa; nenhuma estrutura ou tela foi inferida
dessas referências.
