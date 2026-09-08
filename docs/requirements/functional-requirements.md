# Requisitos Funcionais

## 1. Objetivo

Este documento especifica os requisitos funcionais conhecidos para a evolução
do sistema Câncer de Pênis.

A nova versão deverá permitir que usuários administrativos configurem
formulários compostos por perguntas, alternativas ponderadas e faixas de
resultados, além de disponibilizar esses formulários por meio de páginas
compartilháveis.

> O sistema realiza o processamento das respostas de acordo com regras
> configuradas nos formulários. Até o momento, não está estabelecido que os
> resultados apresentados pelo sistema constituam diagnóstico clínico.

## 2. Classificação

Os requisitos utilizam as seguintes classificações:

- **[CONFIRMADO]**: requisito decorrente das solicitações já conhecidas do
  stakeholder/cliente.
- **[PROPOSTA]**: requisito identificado durante o planejamento do
  desenvolvimento, mas que ainda deve ser validado.
- **[PENDENTE]**: comportamento que ainda precisa ser definido com o
  stakeholder/orientador.

---

# 3. Autenticação e Controle de Acesso

- **RF01 [CONFIRMADO]:** O sistema deve permitir que um administrador se
  autentique utilizando e-mail e senha.

- **RF02 [CONFIRMADO]:** O sistema deve validar as credenciais fornecidas no
  processo de autenticação e impedir o acesso quando elas forem inválidas.

- **RF03 [CONFIRMADO]:** O sistema deve restringir as funcionalidades de
  gerenciamento de formulários a usuários autenticados e autorizados.

- **RF04 [CONFIRMADO]:** O sistema deve permitir que um usuário autenticado
  encerre sua sessão.

- **RF05 [PROPOSTA]:** O sistema deve permitir que um usuário recupere ou
  redefina sua senha por meio de um processo seguro de recuperação de acesso.

- **RF06 [PENDENTE]:** Deve ser definido como as contas administrativas serão
  criadas: autocadastro, convite, criação manual ou outro mecanismo.

---

# 4. Gerenciamento de Formulários

- **RF07 [CONFIRMADO]:** O sistema deve permitir que um usuário autenticado
  crie um formulário.

- **RF08 [CONFIRMADO]:** O sistema deve permitir que o criador informe os
  dados necessários para identificação do formulário.

- **RF09 [CONFIRMADO]:** O sistema deve permitir que um usuário autenticado
  visualize os formulários sob sua responsabilidade.

- **RF10 [PROPOSTA]:** O sistema deve permitir a edição de formulários
  previamente cadastrados.

- **RF11 [PROPOSTA]:** O sistema deve permitir a exclusão de formulários
  previamente cadastrados.

- **RF12 [PENDENTE]:** Devem ser definidos os campos obrigatórios de um
  formulário, além de seu nome, como descrição, autores, instituição, data de
  criação ou outras informações.

---

# 5. Gerenciamento de Perguntas

- **RF13 [CONFIRMADO]:** O sistema deve permitir a inclusão de perguntas em
  um formulário.

- **RF14 [CONFIRMADO]:** O sistema deve permitir a associação de alternativas
  de resposta a cada pergunta.

- **RF15 [PROPOSTA]:** O sistema deve permitir a edição das perguntas
  cadastradas.

- **RF16 [PROPOSTA]:** O sistema deve permitir a exclusão de perguntas
  cadastradas.

- **RF17 [PROPOSTA]:** O sistema deve permitir a edição e exclusão das
  alternativas associadas às perguntas.

- **RF18 [PENDENTE]:** Deve ser definido se a primeira versão do sistema
  permitirá apenas perguntas de escolha única ou também outros tipos de
  pergunta.

---

# 6. Pesos e Processamento das Respostas

- **RF19 [CONFIRMADO]:** O sistema deve permitir que o criador do formulário
  atribua um valor numérico a cada alternativa de resposta.

- **RF20 [CONFIRMADO]:** O sistema deve validar os valores atribuídos às
  alternativas antes de armazená-los.

- **RF21 [CONFIRMADO]:** O sistema deve utilizar os valores associados às
  alternativas selecionadas para calcular a pontuação resultante do
  preenchimento do formulário.

- **RF22 [PENDENTE]:** Devem ser definidos os tipos de valores aceitos para os
  pesos, incluindo a possibilidade de valores negativos, decimais ou limites
  mínimo e máximo.

---

# 7. Configuração dos Resultados

- **RF23 [CONFIRMADO]:** O sistema deve permitir que o criador de um
  formulário cadastre os possíveis resultados que poderão ser apresentados ao
  respondente.

- **RF24 [CONFIRMADO]:** O sistema deve permitir que cada resultado seja
  associado a um intervalo de pontuação.

- **RF25 [CONFIRMADO]:** Ao término do preenchimento, o sistema deve
  identificar o intervalo correspondente à pontuação obtida e apresentar o
  resultado associado.

- **RF26 [PROPOSTA]:** O sistema deve impedir a configuração de intervalos de
  resultados que se sobreponham.

- **RF27 [PROPOSTA]:** O sistema deve identificar configurações em que
  existam valores de pontuação possíveis não cobertos por nenhum intervalo.

- **RF28 [PENDENTE]:** Deve ser definido o comportamento do sistema quando uma
  pontuação calculada não estiver associada a nenhum resultado válido.

---

# 8. Disponibilização e Preenchimento dos Formulários

- **RF29 [CONFIRMADO]:** O sistema deve permitir disponibilizar um formulário
  por meio de uma página própria compartilhável.

- **RF30 [CONFIRMADO]:** A página compartilhável deve permitir que terceiros
  visualizem e respondam ao formulário disponibilizado.

- **RF31 [CONFIRMADO]:** Após o preenchimento do formulário, o sistema deve
  processar as respostas utilizando a configuração de pesos e resultados
  definida pelo criador.

- **RF32 [CONFIRMADO]:** Após o processamento, o sistema deve apresentar ao
  respondente o resultado correspondente.

- **RF33 [PROPOSTA]:** O sistema deve permitir que o criador controle se um
  formulário está em estado de edição ou disponível publicamente.

- **RF34 [PROPOSTA]:** O sistema deve permitir que um formulário previamente
  publicado seja retirado de publicação sem necessariamente excluí-lo.

---

# 9. Persistência das Informações

- **RF35 [CONFIRMADO]:** O sistema deve armazenar persistentemente os
  formulários cadastrados.

- **RF36 [CONFIRMADO]:** O sistema deve armazenar as perguntas, alternativas,
  pesos e configurações de resultado associadas a cada formulário.

- **RF37 [PROPOSTA]:** O sistema deve preservar automaticamente as alterações
  realizadas durante a edição de um formulário.

- **RF38 [CONFIRMADO]:** O sistema não deve armazenar persistentemente as
  respostas fornecidas pelos respondentes.

- **RF39 [CONFIRMADO]:** As respostas fornecidas durante o preenchimento devem
  ser utilizadas apenas durante o processamento necessário para calcular a
  pontuação e determinar o resultado correspondente.

- **RF40 [CONFIRMADO]:** Após a conclusão do processamento e apresentação do
  resultado, o sistema não deve manter histórico individual das respostas do
  respondente.

---

# 10. Funcionalidades Públicas Adicionais

- **RF41 [PROPOSTA]:** O sistema poderá disponibilizar uma biblioteca pública
  contendo formulários que seus responsáveis tenham optado por publicar.

- **RF42 [PENDENTE]:** Deve ser definido se a biblioteca pública fará parte da
  primeira versão da evolução do sistema ou de uma etapa posterior.

- **RF43 [PENDENTE]:** A existência de contas institucionais, perfis públicos,
  contas verificadas e agregação de formulários por instituição deverá ser
  discutida com o stakeholder antes de ser incluída no escopo.

---

# 11. Funcionalidades da Versão Atual

A versão existente do sistema contém, entre outros elementos:

- PENRISK;
- QUALIPEN;
- informações sobre centros de atendimento;
- informações sobre os autores do projeto.

**[PENDENTE]** Deve ser definido com o stakeholder como essas funcionalidades
serão incorporadas à nova arquitetura e se os instrumentos existentes serão
migrados para o novo mecanismo de formulários configuráveis.
