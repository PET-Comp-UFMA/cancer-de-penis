# Revisão dos formulários — 19/10/2026

## Navegação

O componente compartilhado `FormQuestionnaire` posiciona Cancelar à esquerda e Anterior/Próximo (ou Finalizar) à direita, para todos os questionários, incluindo escalas Likert. A ordem no documento acompanha a ordem visual e de teclado.

## Cálculo encontrado no código local

O motor soma a pontuação das alternativas escolhidas. O percentual é
`arredondar(100 × (soma − mínimo possível) / (máximo possível − mínimo possível))`.
Os extremos são a soma dos mínimos e máximos de cada pergunta. Assim, amplitudes diferentes atribuem pesos diferentes às perguntas; opções com pontuação invertida também são respeitadas. Não há necessidade de substituir esse cálculo por contagem de respostas Sim.

No cadastro inicial do PENRISK, todas as 13 perguntas têm Sim = 1 e Não = 0, conforme a regra documentada em `scripts/instrumentos-oficiais.ts`. Portanto, os pesos atuais são iguais. Com essa configuração, 0, 1, 6, 10 e 13 respostas Sim produzem, respectivamente, 0%, 8%, 46%, 77% e 100%. As faixas são 0–33, 34–66 e 67–100.

O QUALIPEN tem 24 perguntas com alternativas de −2 a +2: soma −48 resulta em 0%, soma 0 em 50% e soma +48 em 100%. Ambos utilizam o mesmo motor e as faixas cadastradas.

## Limites e pendências

Não foi identificado um resultado fixo de 77% no código local. As páginas públicas usam `published_definition` do banco, e não diretamente o cadastro inicial. O script de cadastro preserva instrumentos que já possuem perguntas. Alterar esse script não corrige instrumentos já publicados.

Para concluir o diagnóstico do site publicado, é necessário conferir a versão implantada e a definição publicada do PENRISK, incluindo identificadores, pontuações e faixas. Esta revisão não acessou nem alterou o banco publicado.

As perguntas sobre higiene e retração do prepúcio têm redação diferente das perguntas sobre sintomas. A direção das pontuações e quaisquer pesos distintos precisam ser confirmados pelo responsável pelo instrumento. Não foram inventados pesos ou alterada a regra clínica existente. O percentual calculado é uma pontuação normalizada; o código, por si só, não estabelece uma probabilidade clínica de adoecimento.

## Cobertura acrescentada

- Todas as 8.192 combinações de respostas do PENRISK, verificando percentual e faixa.
- Quatorze percentuais distintos no PENRISK, afastando um valor constante no motor local.
- Perguntas com pesos 3 e 1 e pontuação invertida, verificando 0%, 25%, 75% e 100%.

Validação final antes do commit: 30 testes de pontuação e definição passaram, assim como `npm run typecheck`, ESLint nos quatro arquivos de código alterados e `git diff --check`. As dependências foram restauradas com `npm ci`. A página inicial local respondeu HTTP 200. O teste manual dos questionários ficou pendente: a conexão com o Supabase excedeu o tempo limite. O painel mostrou o projeto ativo, sem restrições de IP ou IPs banidos; os testes de rede não conseguiram abrir a conexão PostgreSQL. O diagnóstico de `db:check` foi melhorado para distinguir tempo limite, DNS, servidor inacessível, senha e certificado, sem exibir credenciais.

## Roteiro para validação por outra pessoa

Testar uma versão que contenha este commit e tenha acesso ao banco. Conferir Cancelar à esquerda e Anterior/Próximo/Finalizar à direita no PENRISK e no QUALIPEN, no computador e em tela estreita. Voltar uma pergunta, alterar a resposta e finalizar novamente em um novo preenchimento.

Se o PENRISK publicado mantiver a regra inicial de 13 perguntas com Sim = 1 e Não = 0, testar 0, 1, 6, 10 e 13 respostas Sim: resultados esperados 0%, 8%, 46%, 77% e 100%, respectivamente. Se houver divergência, conferir as pontuações da definição publicada antes de atribuir o problema ao motor.

No QUALIPEN, com a escala inicial de −2 a +2, testar todas as respostas Discordo totalmente (0%), todas neutras (50%) e todas Concordo totalmente (100%). Registrar o endereço/versão testado, as respostas de teste e o resultado obtido, sem dados pessoais reais.
