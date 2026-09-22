# Backend e acesso administrativo

## O que foi escolhido

O backend funciona nas rotas de servidor do próprio Next.js. O Supabase fornece o PostgreSQL hospedado; **Supabase Auth não é usado**. O login é por nome de usuário e senha, sem e-mail ou cadastro público. O pgAdmin é opcional para consultar o banco.

Contas e sessões ficam no schema privado `app_private`, que não deve ser exposto pela API pública do Supabase. Respostas de pacientes e resultados individuais não são armazenados. As tabelas e telas de gestão dos formulários pertencem à próxima etapa.

## Estado atual da gestao de formularios (22/09/2026)

A primeira fatia do editor administrativo foi implementada. As migrations `005_formularios_definicao.sql` e `006_formularios_publicacao_snapshot.sql` acrescentam a definicao editavel, a revisao otimista e o snapshot publicado em `app_private.admin_forms`; a API usa `POST /api/formularios`, `GET/PATCH /api/formularios/:id` e `GET /api/formularios/publicados/:catalogKey`. A interface fica em `/admin/formularios/novo` e `/admin/formularios/:id`.

O formulario pode ser salvo como `unpublished`, editado depois de publicado sem alterar a versao publica e publicado novamente quando titulo, perguntas, alternativas, pontuacoes e faixas estiverem completos. A publicacao copia a definicao para um snapshot fixo; a listagem e as rotas publicas leem esse snapshot, e a despublicacao retira a disponibilidade sem apagar o rascunho. A imagem aceita nesta etapa e uma data URL rasterizada limitada a aproximadamente 2 MB; a migracao para Storage ainda depende da politica de MIME, tamanho, substituicao e limpeza. A interpretacao clinica das faixas ainda depende das regras oficiais de cada instrumento.

## 1. Criar o projeto no Supabase

1. Entre em [Supabase](https://supabase.com/dashboard), crie sua conta e uma organização, se solicitado.
2. Crie um projeto `cancer-de-penis`, confira o plano/custos apresentados e escolha uma região próxima dos usuários.
3. Gere e guarde a senha do banco em um gerenciador de senhas. Ela é diferente da senha de um administrador do site.
4. Após o projeto ficar pronto, abra **Connect** e copie a conexão PostgreSQL. Para desenvolvimento, prefira **Session pooler**, porta 5432, que atende redes IPv4. Preserve exatamente host e usuário fornecidos pelo painel.
5. Obtenha também o certificado raiz SSL do banco, conforme as opções de conexão do projeto. Não desative a validação do certificado para contornar erros.

Não é necessário instalar a plataforma Supabase, Docker ou Supabase CLI para usar o banco hospedado. O PostgreSQL já instalado continua servindo ao outro projeto e aos testes isolados deste repositório.

## 2. Configurar somente no computador

Nesta instalação, `.env.local` já contém o segredo aleatório, as conexões e o certificado do projeto Supabase, sem expor credenciais no chat. A conexão foi confirmada em 18/09/2026. Em outra máquina, copie `.env.example` para `.env.local`. Esse arquivo é ignorado pelo Git. Preencha:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Conexão copiada do Supabase, com a senha do banco; caracteres especiais na senha precisam de codificação de URL |
| `DATABASE_SSL` | `true` para Supabase; `false` somente para PostgreSQL local |
| `DATABASE_CA` | Certificado raiz PEM, entre aspas, com quebras representadas por `\n`, quando necessário para validar o servidor |
| `AUTH_SECRET` | Segredo aleatório gerado pelo comando abaixo |
| `APP_ORIGIN` | `http://localhost:3000` no desenvolvimento; endereço HTTPS exato em produção |

Se `AUTH_SECRET` estiver vazio em uma instalação nova, gere o segredo **no seu terminal pessoal** e copie o valor para `.env.local`:

```powershell
npm run auth:secret
```

Não envie o arquivo, a conexão, a senha nem o segredo ao chat. Não use `NEXT_PUBLIC_` nessas variáveis. Não acrescente parâmetros `sslmode` na URL: o projeto controla a validação SSL por `DATABASE_SSL` e `DATABASE_CA`.

Para substituir `[YOUR-PASSWORD]` sem exibir a senha ou codificar caracteres manualmente, execute `npm run db:configure`. Informe a senha do banco definida ao criar o projeto. Depois use `npm run db:check` para verificar a conexão sem expor credenciais.

## 3. Criar as tabelas e a primeira conta

Nesta instalação, as tabelas e a conta limitada do banco já foram criadas em 18/09/2026. O próximo passo é executar `npm run admin:create` no seu terminal pessoal e depois `npm run dev`.

Em uma instalação nova, confira se a conexão aponta para o projeto novo de desenvolvimento e execute:

```powershell
npm run db:migrate
npm run db:runtime
npm run admin:create
npm run dev
```

`db:migrate` aplica as migrações. `db:runtime` cria uma conta de banco com permissões limitadas para o site e separa as conexões em `.env.local`: `DATABASE_URL` para o site e `DATABASE_ADMIN_URL` somente para comandos administrativos locais. A senha técnica é gerada sem ser exibida. Se a conta já existir, sua senha não será sobrescrita.

`admin:create` pergunta o nome de usuário e o papel e exibe uma senha temporária uma única vez. Escolha `admin` para quem gerencia formulários ou `ambos` para a pessoa responsável que também utilizará essa área.

Abra [Login local](http://localhost:3000/admin/login). Entre com a credencial temporária e escolha uma nova senha de 12 a 128 caracteres. A credencial temporária expira em 24 horas e permite **um único login**. Se a pessoa perder a sessão antes de trocar a senha, o responsável deverá redefini-la.

## 4. Operação das contas

Execute os comandos pessoalmente em terminal interativo, sem gravar a saída em arquivo:

| Comando | Função |
| --- | --- |
| `npm run admin:create` | Cria uma conta e gera senha temporária |
| `npm run admin:reset` | Gera outra senha temporária e encerra todas as sessões da conta |
| `npm run admin:disable` | Desativa a conta e encerra suas sessões |

Entregue as credenciais fora do sistema. Não há botão público de cadastro ou envio por e-mail. Redefinir senha não reativa uma conta desativada.

Nesta versão, o provisionamento é uma operação do responsável com acesso ao ambiente do servidor/banco. O papel `responsavel` não concede acesso ao terminal por si só; não existe painel web de gestão de contas. Não distribua a conexão do banco aos administradores comuns.

## 5. pgAdmin e publicação futura

No pgAdmin, registre uma conexão com o host, porta, nome do banco e usuário mostrados em **Connect**. Configure SSL com verificação completa e o certificado raiz. O pgAdmin serve para inspecionar tabelas; use os comandos administrativos para criar ou redefinir credenciais.

Na Vercel, configure as variáveis do site somente no ambiente de servidor, com `APP_ORIGIN` igual ao domínio HTTPS real. **Não configure `DATABASE_ADMIN_URL` na Vercel.** O **Transaction pooler**, porta 6543, é adequado às funções serverless; o código usa consultas sem prepared statements nomeados. Separe bancos de desenvolvimento e produção. Execute migrações deliberadamente antes da publicação; elas não rodam automaticamente no build.

## Comportamento implementado

- `/admin/login`, `/admin/alterar-senha` e `/admin/formularios`: login, troca e entrada protegida da área administrativa.
- `/api/auth/session` (GET): estado mínimo e token CSRF para inicializar a tela.
- `/api/auth/login`, `/api/auth/change-password` e `/api/auth/logout` (POST): autenticação, troca e encerramento.
- Senhas com Argon2id; tokens de sessão aleatórios com somente o hash no banco.
- Cookies HttpOnly, SameSite=Strict e Secure em HTTPS; prefixo `__Host-` em produção. Nenhuma credencial em localStorage.
- Sessões com limite de 8 horas de inatividade e 24 horas absolutas, revogadas em logout, troca, redefinição e desativação.
- Mutações exigem JSON, origem autorizada e token CSRF. As futuras APIs administrativas devem usar os guards do servidor e derivar o proprietário da sessão.
- Limites por janela de 15 minutos: 30 tentativas por origem de conexão, 10 por conta e 100 globais; troca de senha tem limite de 10 por conta. Tentativas já bloqueadas por origem/conta não consomem a cota global. Na Vercel, usa-se o IP informado pelo ambiente; em outro servidor, o endereço da conexão. Se adicionar outro proxy, revise essa configuração antes da publicação ([headers da Vercel](https://vercel.com/docs/headers/request-headers)).

## Verificações de desenvolvimento

Execute somente as verificações relacionadas à alteração. Não é necessário repetir toda a lista quando já há resultados válidos e o código correspondente não mudou.

```powershell
npm run typecheck
npm run lint
npm run test:auth
npm run test:auth:browser
npm run build
```

Os testes de autenticação criam um PostgreSQL temporário em `.auth-test/`, numa porta livre. Não usam `.env.local` nem o serviço do outro projeto. Requerem os executáveis PostgreSQL locais; consulte o teste para configurar `PG_BIN` em outra máquina.

Validação realizada nesta implementação: 10 testes de backend aprovados, fluxo de login/troca/logout aprovado no navegador, teste pontual da conta de banco limitada aprovado, tipos e build aprovados. O lint ficou sem erros, com quatro avisos preexistentes. Em 18/09/2026, a conexão SSL com o Supabase foi confirmada, a migração `001_auth.sql` foi aplicada e a conta limitada foi criada; uma nova verificação confirmou conexão e acesso ao schema com essa conta. A primeira conta administrativa do site ainda deve ser criada pelo responsável no terminal.

Referências: [conexões PostgreSQL no Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [SSL no node-postgres](https://node-postgres.com/features/ssl), [armazenamento de senhas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) e [proteção CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
