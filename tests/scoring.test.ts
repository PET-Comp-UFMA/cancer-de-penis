import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, isScorable, producibleScoreRange, resolveBand, scoreToPercentage } from '../src/modules/instrumentos/domain/scoring';
import type { FormDefinition, FormResultBand } from '../src/modules/instrumentos/domain/form-definitions';

function band(id: string, minScore: number | null, maxScore: number | null, risk = id): FormResultBand {
  return { id, minScore, maxScore, risk, description: `Descrição ${id}` };
}

function form(overrides: Partial<Pick<FormDefinition, 'questions' | 'resultBands'>>): FormDefinition {
  return {
    slug: 'teste',
    catalogKey: 'TESTE',
    title: 'Teste',
    description: '',
    heroImage: '',
    authors: [],
    questions: [
      {
        id: 'q1',
        prompt: 'Q1',
        answerType: 'single-choice',
        options: [
          { id: 'a', label: 'A', score: 0 },
          { id: 'b', label: 'B', score: 10 },
        ],
      },
      {
        id: 'q2',
        prompt: 'Q2',
        answerType: 'single-choice',
        options: [
          { id: 'a', label: 'A', score: 0 },
          { id: 'b', label: 'B', score: 10 },
        ],
      },
    ],
    // Percentage-based (0–100), per the standard classification: até 33%
    // Baixo, 34–66% Médio, acima de 66% Alto.
    resultBands: [band('low', 0, 33), band('mid', 34, 66), band('high', 67, 100)],
    questionnaireStatus: 'ready',
    ...overrides,
  };
}

test('resolveBand: both ends of a band are inclusive', () => {
  const bands = [band('low', 0, 33), band('high', 34, 100)];
  assert.equal(resolveBand(bands, 33).id, 'low');
  assert.equal(resolveBand(bands, 34).id, 'high');
});

test('resolveBand: matches at 0% and 100%', () => {
  const bands = [band('low', 0, 33), band('mid', 34, 66), band('high', 67, 100)];
  assert.equal(resolveBand(bands, 0).id, 'low');
  assert.equal(resolveBand(bands, 100).id, 'high');
});

test('resolveBand: gap between bands throws SCORE_NO_MATCHING_BAND', () => {
  const bands = [band('low', 0, 30), band('high', 35, 100)];
  assert.throws(() => resolveBand(bands, 32), /SCORE_NO_MATCHING_BAND/);
});

test('resolveBand: overlapping bands throw SCORE_AMBIGUOUS_BAND', () => {
  const bands = [band('low', 0, 40), band('high', 30, 100)];
  assert.throws(() => resolveBand(bands, 35), /SCORE_AMBIGUOUS_BAND/);
});

test('computeScore: sums selected alternative scores and resolves the band', () => {
  const definition = form({});
  const result = computeScore(definition, [
    { questionId: 'q1', optionId: 'b' },
    { questionId: 'q2', optionId: 'a' },
  ]);
  assert.equal(result.score, 10);
  assert.equal(result.band.id, 'mid');
  assert.equal(result.percentage, 50);
});

test('producibleScoreRange: sums min/max option score per question', () => {
  assert.deepEqual(producibleScoreRange(form({})), { min: 0, max: 20 });
});

test('scoreToPercentage: 0 at the minimum, 100 at the maximum, rounded in between', () => {
  const definition = form({});
  assert.equal(scoreToPercentage(definition, 0), 0);
  assert.equal(scoreToPercentage(definition, 20), 100);
  assert.equal(scoreToPercentage(definition, 6), 30);
});

test('scoreToPercentage: does not divide by zero when the range is degenerate', () => {
  const definition = form({
    questions: [
      { id: 'q1', prompt: 'Q1', answerType: 'single-choice', options: [{ id: 'a', label: 'A', score: 5 }] },
    ],
  });
  assert.equal(scoreToPercentage(definition, 5), 0);
});

test('computeScore: missing answer throws SCORE_INCOMPLETE_ANSWERS', () => {
  const definition = form({});
  assert.throws(() => computeScore(definition, [{ questionId: 'q1', optionId: 'a' }]), /SCORE_INCOMPLETE_ANSWERS/);
});

test('computeScore: unknown option id throws SCORE_INVALID_ANSWER', () => {
  const definition = form({});
  assert.throws(
    () => computeScore(definition, [
      { questionId: 'q1', optionId: 'nope' },
      { questionId: 'q2', optionId: 'a' },
    ]),
    /SCORE_INVALID_ANSWER/,
  );
});

test('isScorable: false when resultBands is empty', () => {
  assert.equal(isScorable(form({ resultBands: [] })), false);
});

test('isScorable: false when an alternative score is null', () => {
  const definition = form({
    questions: [
      {
        id: 'q1',
        prompt: 'Q1',
        answerType: 'single-choice',
        options: [
          { id: 'a', label: 'A', score: null },
          { id: 'b', label: 'B', score: 10 },
        ],
      },
    ],
  });
  assert.equal(isScorable(definition), false);
});

test('computeScore: throws SCORE_NOT_AVAILABLE when the form is not scorable', () => {
  const definition = form({ resultBands: [] });
  assert.throws(
    () => computeScore(definition, [
      { questionId: 'q1', optionId: 'a' },
      { questionId: 'q2', optionId: 'a' },
    ]),
    /SCORE_NOT_AVAILABLE/,
  );
});

// Replicates the "Exemplo rápido" worked example from the clinical scoring
// logic provided by the project owner: a symmetric 5-point Likert scale
// (-2..+2) over 24 questions, normalized to a 0–100% score and classified as
// até 33% Baixo / 34–66% Médio / acima de 66% Alto.
test('computeScore: matches the reference Likert scoring example (24 questions, score 4 -> ~54% -> Risco Médio)', () => {
  const likertOptions = [
    { id: 'discordo-totalmente', label: 'Discordo totalmente', score: -2 },
    { id: 'discordo-um-pouco', label: 'Discordo um pouco', score: -1 },
    { id: 'neutro', label: 'Nem discordo, nem concordo', score: 0 },
    { id: 'concordo-um-pouco', label: 'Concordo um pouco', score: 1 },
    { id: 'concordo-totalmente', label: 'Concordo totalmente', score: 2 },
  ];
  const questions = Array.from({ length: 24 }, (_, index) => ({
    id: `q${index + 1}`,
    prompt: `Pergunta ${index + 1}`,
    answerType: 'single-choice' as const,
    options: likertOptions,
  }));
  const definition = form({
    questions,
    resultBands: [band('baixo', 0, 33, 'Risco Baixo'), band('medio', 34, 66, 'Risco Médio'), band('alto', 67, 100, 'Risco Alto')],
  });

  // 10x "Concordo um pouco" (+1), 8x "Nem discordo, nem concordo" (0), 6x "Discordo um pouco" (-1)
  const answers = [
    ...Array.from({ length: 10 }, (_, i) => ({ questionId: `q${i + 1}`, optionId: 'concordo-um-pouco' })),
    ...Array.from({ length: 8 }, (_, i) => ({ questionId: `q${11 + i}`, optionId: 'neutro' })),
    ...Array.from({ length: 6 }, (_, i) => ({ questionId: `q${19 + i}`, optionId: 'discordo-um-pouco' })),
  ];

  const result = computeScore(definition, answers);
  assert.equal(result.score, 4);
  assert.equal(result.percentage, 54);
  assert.equal(result.band.risk, 'Risco Médio');
});
