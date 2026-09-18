# Cancer de penis — visão geral

## Objetivo e escopo

O projeto reúne informações e instrumentos de avaliação relacionados ao câncer de pênis. Ele prevê uma área administrativa para organizar formulários e 
disponibilizar seu preenchimento por páginas compartilháveis.

## Como funciona

```text
Pessoa no navegador → site e servidor Next.js na Vercel → PostgreSQL no Supabase
GitHub → código usado pela Vercel para preparar a publicação
```

O GitHub guarda o código e seu histórico. A Vercel hospeda o site e executa seu servidor. O Supabase hospeda o banco consultado pelo servidor para validar contas e sessões. O navegador não recebe a senha do banco.

### PostgreSQL e Supabase

Para usar o banco do Supabase: ele funciona na nuvem. O PostgreSQL instalado no computador é independente, podendo atender outros projetos e os testes locais. 

Para usar o site localmente, mantenha `npm run dev` em execução. O login local também precisa de conexão com o Supabase.

## Tecnologias

| Tecnologia | Função |
| --- | --- |
| Next.js + React | Construir páginas e executar o servidor do site |
| TypeScript | Ajudar a identificar erros durante o desenvolvimento |
| MUI + Emotion | Componentes visuais e estilos |
| Node.js + npm | Executar o projeto e instalar dependências |
| PostgreSQL no Supabase | Guardar contas, sessões e controles de acesso |
| pg + Argon2id | Conectar ao banco e proteger as senhas armazenadas |
| Git + GitHub | Registrar versões e compartilhar código |
| Vercel | Hospedar o site; configuração desta etapa ainda pendente |
| Testes do Node.js + Playwright | Verificar autenticação e fluxo no navegador |

As versões exatas estão em `package-lock.json`. O login é implementado no servidor Next.js; Supabase Auth não é utilizado.

## Organização

- `src/pages`: páginas e APIs do servidor.
- `src/modules`: funcionalidades, como autenticação e páginas institucionais.
- `src/shared` e `src/config`: componentes, estilos e configurações compartilhados.
- `public`: imagens e arquivos públicos usados pelo site.
- `db/migrations`: instruções para criar e evoluir as tabelas.
- `scripts`: configuração do banco e administração de contas.
- `tests`: testes reais do projeto; dados temporários não entram no Git.
- `docs`: documentação funcional e orientações de operação.

## Executar no computador

Com Node.js e npm instalados, execute `npm ci`. Em uma instalação nova, copie `.env.example` para `.env.local` e siga o [guia de autenticação](docs/backend-autenticacao.md). Preserve um `.env.local` já configurado.

Execute `npm run dev` e abra. O login fica em `/admin/login`. O responsável técnico cria contas com `npm run admin:create`. Não há cadastro público nem recuperação por e-mail.

## Publicação na Vercel

Organize os commits e envie o código ao GitHub. Depois, vincule o repositório ao projeto correto da Vercel e configure as variáveis privadas do servidor: `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_CA`, `AUTH_SECRET` e `APP_ORIGIN`.

Use a conexão da conta limitada do banco. Para funções serverless, o Supabase recomenda o Transaction pooler; copie os dados do painel. `APP_ORIGIN` deve ser o endereço HTTPS exato do ambiente. Não configure `DATABASE_ADMIN_URL` na Vercel nem use `NEXT_PUBLIC_` para segredos.

Criar uma conta na Vercel não conecta automaticamente o site ao banco. A configuração e a verificação do login publicado ainda estão pendentes. Antes de substituir o site existente, confira qual repositório e versão correspondem à publicação: foram observadas diferenças entre ela e esta versão local.

O Git recebe código, migrações, testes, documentação e configurações necessárias ao projeto. Credenciais, dependências instaladas, arquivos gerados e preferências pessoais ficam fora. Enviar código não envia os dados do Supabase.

Referências: [conexão com o Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) e [variáveis na Vercel](https://vercel.com/docs/environment-variables).
