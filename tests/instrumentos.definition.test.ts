import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getFormDefinition, toPublicDefinition } from '../src/modules/instrumentos/domain/form-definitions';
import { computeScore } from '../src/modules/instrumentos/domain/scoring';
import type { FormDefinition as EditableFormDefinition } from '../src/modules/formularios/domain/types';

test('PENRISK is a 13-question boolean instrument with standard bands', () => {
  const definition = getFormDefinition('PENRISK')!;
  assert.equal(definition.questions.length, 13);
  assert.ok(definition.questions.every((question) => question.answerType === 'boolean'));
  const answers = (optionId: string) => definition.questions.map((question) => ({ questionId: question.id, optionId }));
  assert.equal(computeScore(definition, answers('false')).percentage, 0);
  assert.equal(computeScore(definition, answers('false')).band.risk, 'Risco Baixo');
  assert.equal(computeScore(definition, answers('true')).score, 13);
  assert.equal(computeScore(definition, answers('true')).percentage, 100);
  assert.equal(computeScore(definition, answers('true')).band.risk, 'Risco Alto');
  const intermediate = computeScore(definition, definition.questions.map((question, index) => ({
    questionId: question.id,
    optionId: index < 6 ? 'true' : 'false',
  })));
  assert.equal(intermediate.percentage, 46);
  assert.equal(intermediate.band.risk, 'Risco Médio');
});

test('boolean engine rejects incomplete and invalid answers', () => {
  const definition = getFormDefinition('PENRISK')!;
  assert.throws(() => computeScore(definition, []), /SCORE_INCOMPLETE_ANSWERS/);
  assert.throws(() => computeScore(definition, definition.questions.map((question) => ({ questionId: question.id, optionId: 'maybe' }))), /SCORE_INVALID_ANSWER/);
});

test('QUALIPEN has 24 ordered Likert questions and standard normalization', () => {
  const definition = getFormDefinition('QUALIPEN')!;
  assert.equal(definition.questions.length, 24);
  assert.ok(definition.questions.every((question) => question.answerType === 'likert'));
  assert.deepEqual(definition.questions.map((question) => question.prompt), [
    'Percebi algum sangramento no meu pênis no último mês.',
    'Senti mau cheiro no meu pênis no último mês.',
    'Senti alguma dificuldade ou incômodo para urinar no último mês.',
    'Senti dor ou desconforto no meu pênis no último mês.',
    'Observei algum inchaço na minha região genital ou virilha no último mês.',
    'Senti cansaço ou falta de energia para realizar minhas atividades do dia a dia no último mês.',
    'Senti alguma dificuldade para ter ou manter ereção no último mês.',
    'A doença afetou o meu desejo sexual no último mês.',
    'Senti vergonha ou insegurança em relação a minha vida sexual no último mês.',
    'A doença prejudicou a forma como eu me relaciono sexualmente com minha parceira ou parceiro no último mês.',
    'Senti que a minha masculinidade foi afetada pela doença no último mês.',
    'A doença afetou o meu prazer sexual no último mês.',
    'Eu me senti triste ou desanimado por causa da doença no último mês.',
    'Senti medo em relação à doença ou ao futuro no último mês.',
    'Senti vergonha ou constrangimento por causa da doença no último mês.',
    'A doença afetou a minha autoestima ou confiança no último mês.',
    'Eu me senti ansioso por causa da doença no último mês.',
    'Eu me senti estressado por causa da doença no último mês.',
    'A doença dificultou minha convivência com familiares e amigos no último mês.',
    'Não recebi apoio da minha família e amigos para lidar com a doença no último mês.',
    'Evitei atividades sociais (por exemplo, sair de casa, ir à igreja, ir à casa de um parente) por causa da doença no último mês.',
    'Tive dificuldades para acessar serviços de saúde para consultas e exames no último mês.',
    'Evitei praticar exercícios físicos ou esportes (por exemplo, caminhadas, corridas, futebol) por causa da doença no último mês.',
    'A doença afetou minha capacidade de trabalhar ou de manter minha rotina no último mês.',
  ]);
  assert.deepEqual(definition.questions[0].options?.map((option) => [option.label, option.score]), [
    ['Discordo totalmente', -2], ['Discordo um pouco', -1], ['Nem discordo, nem concordo', 0],
    ['Concordo um pouco', 1], ['Concordo totalmente', 2],
  ]);
  const answers = (optionId: string) => definition.questions.map((question) => ({ questionId: question.id, optionId }));
  assert.equal(computeScore(definition, answers('discordo-totalmente')).percentage, 0);
  assert.equal(computeScore(definition, answers('concordo-totalmente')).percentage, 100);
  assert.equal(computeScore(definition, definition.questions.map((question, index) => ({
    questionId: question.id,
    optionId: index < 12 ? 'concordo-um-pouco' : 'neutro',
  }))).percentage, 63);
});

test('published definitions preserve the visual distinction between options and Likert', () => {
  const definition: EditableFormDefinition = {
    schemaVersion: 1,
    title: 'Teste',
    description: '',
    imageDataUrl: null,
    authors: [],
    questions: [
      {
        id: 'options',
        prompt: 'Opções',
        type: 'two-options',
        alternatives: [
          { id: 'yes', label: 'Sim', score: 1 },
          { id: 'no', label: 'Não', score: 0 },
        ],
      },
      {
        id: 'likert',
        prompt: 'Likert',
        type: 'likert',
        alternatives: [
          { id: 'disagree', label: 'Discordo', score: -1 },
          { id: 'agree', label: 'Concordo', score: 1 },
        ],
      },
    ],
    resultBands: [],
  };
  const publicDefinition = toPublicDefinition({ catalogKey: 'TESTE', title: 'Teste', description: '', definition });
  assert.equal(publicDefinition.questions[0].answerType, 'single-choice');
  assert.equal(publicDefinition.questions[1].answerType, 'likert');
});
