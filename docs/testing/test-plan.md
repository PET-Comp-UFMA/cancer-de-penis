# Verificação do projeto

Os testes de autenticação fazem parte do projeto e devem acompanhar seu código no Git. Os bancos temporários, capturas e relatórios gerados ficam ignorados.

| Comando | O que verifica |
| --- | --- |
| `npm run typecheck` | Compatibilidade de tipos TypeScript |
| `npm run lint` | Regras estáticas de qualidade |
| `npm run test:auth` | Login, sessões, limites, permissões e operações de contas |
| `npm run test:auth:browser` | Login, troca obrigatória de senha e logout no navegador |
| `npm run build` | Preparação da aplicação para produção |

Os testes de autenticação usam um PostgreSQL temporário e isolado, criado com os executáveis locais. Não usam o banco real do Supabase nem o serviço de outro projeto. O ambiente atual usa PostgreSQL 18; em outra máquina, configure `PG_BIN` conforme `tests/helpers/postgres.ts`. O teste de navegador requer Microsoft Edge instalado.

Execute somente as verificações relacionadas à alteração. Os testes não rodam automaticamente no build. Um teste local aprovado não comprova a configuração do ambiente publicado; após configurar a Vercel, verifique o fluxo de login nesse ambiente.
