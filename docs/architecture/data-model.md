# Modelo de Dados

## Modelo Atual

No código deste repositório não foram encontrados banco de dados, schema,
tabelas, ORM, migrations, modelos persistentes ou integração de acesso a dados.
Não há leitura ou escrita de respostas, nem uso de armazenamento no navegador.
Isso descreve o código inspecionado, sem afirmar a estrutura de sistemas externos.

Os dados efetivamente encontrados são estruturas locais de apresentação:

| Estrutura | Campos | Localização e utilização |
|-----------|--------|-------------------------|
| Autores | `nome`, `especialidade`, `imagem` | Lista estática dentro de `src/modules/autores/presentation/Autores.tsx`, usada para renderizar os cartões. |
| Hospitais | `nome`, `local`, `imagem`, `href` | Lista estática dentro de `src/modules/centros-atendimento/presentation/Hospitais.tsx`, usada para renderizar os centros de atendimento. |
| Itens de navegação | `label`, `href` | Lista estática de links em `src/shared/components/Header.tsx`. |
| `Data` | `name: string` | Tipo local do contrato de resposta de `src/pages/api/hello.ts`; o endpoint retorna HTTP 200 com `{"name":"John Doe"}`. |

Essas estruturas não representam tabelas ou entidades persistidas. PENRISK e
QUALIPEN aparecem em conteúdo de apresentação; não foram encontrados modelos
de perguntas, alternativas, pesos, resultados ou pacientes implementados.

## Modelo Proposto nos Diagramas

Existe um diagrama lógico preliminar, descrito no material de análise, envolvendo:

- Formulário;
- Status;
- Perguntas;
- Alternativas;
- Resultado;
- Paciente;
- RespostaFormulario;
- Respostas;
- RespostasPerguntas;
- RespostasAlternativas.

Esses nomes são referências conceituais, não entidades implementadas neste
repositório. O material fornecido não permite afirmar atributos, chaves,
cardinalidades ou restrições definitivas.

O diagrama de estados descreve conceitualmente criação, edição, salvamento,
publicação, despublicação e exclusão de um formulário. Nenhuma máquina de
estados foi implementada nesta etapa.

## Divergências Pendentes

Existe uma divergência entre o modelo preliminar de respostas e os requisitos
RF38-RF40/RNF34-RNF36, que determinam a não persistência das respostas dos
respondentes, seu uso apenas durante o processamento e a ausência de histórico
individual após a apresentação do resultado. A finalidade das entidades de
respostas e de Paciente no modelo preliminar deverá ser esclarecida com o
stakeholder/orientador antes de qualquer implementação de persistência.

A distinção entre os estados "não publicado" e "despublicado" também depende
de validação; não se assume que sejam estados definitivamente distintos.

Nenhuma decisão arquitetural definitiva sobre essas divergências foi tomada.
Não foram criadas ou removidas tabelas, nem alterados schema ou persistência.
