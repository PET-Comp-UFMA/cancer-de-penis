# Requisitos Não Funcionais

## 1. Objetivo

Este documento especifica atributos de qualidade e restrições não funcionais
para a evolução do sistema Câncer de Pênis.

Os requisitos devem, sempre que possível, possuir critérios que permitam sua
verificação por testes, inspeções ou medições.

---

# 2. Segurança

- **RNF01 [CONFIRMADO]:** As senhas dos usuários não devem ser armazenadas em
  texto puro ou utilizando criptografia reversível.

- **RNF02 [PROPOSTA]:** As senhas devem ser armazenadas utilizando um
  algoritmo de hash adaptativo apropriado para armazenamento de credenciais.

  Exemplos de tecnologias possíveis incluem Argon2 e bcrypt, mas a escolha
  específica pertence à implementação.

- **RNF03 [CONFIRMADO]:** Funcionalidades administrativas devem exigir uma
  sessão autenticada e válida.

- **RNF04 [CONFIRMADO]:** O sistema deve verificar autorização no servidor
  antes de permitir operações protegidas.

- **RNF05 [PROPOSTA]:** As sessões autenticadas devem possuir mecanismo de
  expiração e encerramento seguro.

- **RNF06 [PROPOSTA]:** Dados de autenticação e demais dados transmitidos pela
  aplicação devem utilizar conexão HTTPS em ambiente de produção.

- **RNF07 [PROPOSTA]:** Dados recebidos pelo sistema devem ser validados antes
  de seu processamento ou persistência, reduzindo riscos de entradas
  malformadas ou maliciosas.

- **RNF08 [PROPOSTA]:** Informações sensíveis, credenciais e segredos de
  autenticação não devem ser registrados em logs da aplicação.

---

# 3. Autorização e Isolamento de Dados

- **RNF09 [CONFIRMADO]:** Um usuário não deve conseguir modificar recursos
  para os quais não possua autorização.

- **RNF10 [PROPOSTA]:** A identificação do proprietário ou responsável por um
  formulário deve ser validada no servidor e não apenas na interface do
  cliente.

- **RNF11 [PROPOSTA]:** Tentativas de acesso não autorizado devem resultar em
  resposta apropriada sem revelar informações internas da aplicação.

---

# 4. Integridade dos Dados

- **RNF12 [CONFIRMADO]:** O sistema deve preservar a relação entre formulários,
  perguntas, alternativas, pesos e resultados.

- **RNF13 [CONFIRMADO]:** Uma alternativa deve estar associada a uma pergunta
  existente e uma pergunta deve estar associada a um formulário existente.

- **RNF14 [CONFIRMADO]:** Um intervalo de resultado deve estar associado a um
  formulário existente.

- **RNF15 [PROPOSTA]:** Operações que alterem múltiplas entidades relacionadas
  devem evitar que falhas intermediárias deixem o formulário em estado
  inconsistente.

- **RNF16 [PROPOSTA]:** Após uma operação de salvamento ser confirmada ao
  usuário, os dados correspondentes não devem ser perdidos em uma navegação
  normal ou atualização da página.

> A utilização de mecanismos como restrições de chave estrangeira,
> transações, exclusão em cascata ou exclusão lógica é uma decisão de
> arquitetura e não é determinada por este requisito.

---

# 5. Confiabilidade do Processamento

- **RNF17 [CONFIRMADO]:** Para uma mesma configuração de formulário e o mesmo
  conjunto de respostas, o sistema deve produzir sempre a mesma pontuação e o
  mesmo resultado.

- **RNF18 [CONFIRMADO]:** O cálculo da pontuação deve considerar exatamente os
  pesos associados às alternativas selecionadas pelo respondente.

- **RNF19 [CONFIRMADO]:** O resultado apresentado deve corresponder ao
  intervalo configurado para a pontuação obtida.

- **RNF20 [PROPOSTA]:** Configurações inválidas de intervalos ou pesos devem
  ser detectadas antes da publicação do formulário.

---

# 6. Usabilidade

- **RNF21 [PROPOSTA]:** A criação e edição de formulários deve apresentar de
  forma clara a relação entre formulário, perguntas, alternativas, pesos e
  resultados.

- **RNF22 [PROPOSTA]:** Erros de validação devem ser apresentados próximos ao
  elemento que os originou e informar ao usuário como corrigir o problema.

- **RNF23 [PROPOSTA]:** Operações de salvamento realizadas em segundo plano
  não devem impedir a continuidade da edição do formulário.

- **RNF24 [PROPOSTA]:** Antes de operações destrutivas, como excluir um
  formulário, o sistema deve solicitar confirmação explícita.

---

# 7. Responsividade e Compatibilidade

- **RNF25 [CONFIRMADO]:** As páginas públicas destinadas ao preenchimento dos
  formulários devem ser utilizáveis em dispositivos móveis e computadores.

- **RNF26 [PROPOSTA]:** A interface administrativa também deve adaptar sua
  apresentação a diferentes dimensões de tela.

- **RNF27 [PENDENTE]:** Deve ser definida a matriz oficial de navegadores,
  dispositivos e resoluções suportados para permitir testes objetivos de
  compatibilidade.

---

# 8. Acessibilidade

- **RNF28 [PROPOSTA]:** A interface deve utilizar elementos semânticos e
  possibilitar navegação por teclado nas principais funcionalidades.

- **RNF29 [PROPOSTA]:** Campos dos formulários devem possuir rótulos e
  mensagens de erro identificáveis por tecnologias assistivas.

- **RNF30 [PENDENTE]:** Deve ser decidido se será adotado formalmente algum
  nível das Web Content Accessibility Guidelines (WCAG) como critério de
  aceitação do projeto.

---

# 9. Desempenho

- **RNF31 [PROPOSTA]:** O processamento da pontuação e do resultado de um
  formulário deve ocorrer sem atraso perceptível para o respondente em
  condições normais de utilização.

- **RNF32 [PROPOSTA]:** A paginação ou outra estratégia equivalente deve ser
  utilizada quando uma consulta puder retornar uma quantidade elevada de
  formulários.

- **RNF33 [PENDENTE]:** Devem ser estabelecidos, junto ao stakeholder,
  critérios quantitativos de desempenho, incluindo tempo máximo de resposta,
  quantidade esperada de formulários e número estimado de acessos simultâneos.

> Sem essas informações, não é possível estabelecer de forma tecnicamente
> justificada requisitos como "responder em até X segundos" ou "suportar Y
> usuários simultâneos".

---

# 10. Privacidade

- **RNF34 [CONFIRMADO]:** O sistema não deve persistir as respostas fornecidas
  pelos respondentes durante o preenchimento dos formulários.

- **RNF35 [CONFIRMADO]:** As respostas devem existir apenas pelo tempo
  necessário para o processamento da pontuação e determinação do resultado.

- **RNF36 [CONFIRMADO]:** O sistema não deve criar histórico individual de
  respostas dos respondentes.

- **RNF37 [PROPOSTA]:** O sistema deve evitar registrar em logs os conteúdos
  das respostas fornecidas durante o preenchimento dos formulários.

- **RNF38 [PROPOSTA]:** O sistema deve coletar apenas os dados estritamente
  necessários para executar cada funcionalidade.

---

# 11. Manutenibilidade e Testabilidade

- **RNF37 [PROPOSTA]:** A lógica responsável pelo cálculo das pontuações e
  determinação dos resultados deve possuir baixo acoplamento com a interface,
  permitindo sua verificação isolada por testes.

- **RNF38 [PROPOSTA]:** Funcionalidades críticas devem possuir testes
  automatizados sempre que tecnicamente aplicável.

- **RNF39 [PROPOSTA]:** Devem existir testes específicos para os limites dos
  intervalos de resultados.

- **RNF40 [PROPOSTA]:** Alterações em funcionalidades existentes devem ser
  acompanhadas de testes de regressão adequados ao impacto da mudança.

- **RNF41 [PENDENTE]:** Critérios quantitativos de cobertura de testes somente
  deverão ser definidos após a arquitetura e estratégia de testes do projeto
  serem estabelecidas.

---

# 12. Registro e Tratamento de Falhas

- **RNF42 [PROPOSTA]:** Falhas inesperadas devem ser registradas de forma que
  possam ser diagnosticadas pela equipe de desenvolvimento.

- **RNF43 [PROPOSTA]:** Mensagens apresentadas ao usuário não devem revelar
  detalhes internos da aplicação, consultas ao banco de dados, stack traces,
  credenciais ou outros dados sensíveis.

---

# 13. Restrições Tecnológicas

A versão atual do sistema foi desenvolvida utilizando Next.js,
JavaScript/TypeScript e possui implantação utilizando Vercel.

**[PENDENTE]** A permanência dessa arquitetura e dessas tecnologias na nova
versão deve ser confirmada durante o planejamento técnico.

Por esse motivo, essas tecnologias são atualmente consideradas características
da implementação existente, e não requisitos não funcionais obrigatórios d
anova versão.
