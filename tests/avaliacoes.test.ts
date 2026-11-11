import test from 'node:test';
import assert from 'node:assert/strict';
import { createEvaluatePublishedForm } from '@/modules/avaliacoes/application/use-cases/evaluate-published-form';
import type { PublishedEvaluationSnapshot } from '@/modules/avaliacoes/domain/types';
import { createEvaluationSubmissionController } from '@/modules/avaliacoes/presentation/submission';

const snapshot: PublishedEvaluationSnapshot = {
  catalogKey: 'TESTE', publishedRevision: 3,
  questions: [{ id: 'q1', options: [{ id: 'no', score: 0 }, { id: 'yes', score: 1 }] }],
  resultBands: [{ id: 'b1', minScore: 0, maxScore: 100, risk: 'Resultado', description: 'ok' }],
};

function setup(value = snapshot) { let reads = 0; const evaluate = createEvaluatePublishedForm({ read: async () => { reads += 1; return value; } }); return { evaluate, reads: () => reads }; }

test('avalia resultado válido usando o snapshot e não devolve answers', async () => {
  const { evaluate } = setup();
  const result = await evaluate({ catalogKey: 'TESTE', publishedRevision: 3, answers: [{ questionId: 'q1', optionId: 'yes', score: 999 }] });
  assert.equal(result.score, 1); assert.equal(result.publishedRevision, 3); assert.equal('answers' in result, false);
});

test('rejeita revisão divergente, respostas inválidas e lê uma vez', async () => {
  const { evaluate, reads } = setup();
  await assert.rejects(() => evaluate({ catalogKey: 'TESTE', publishedRevision: 2, answers: [{ questionId: 'q1', optionId: 'yes' }] }), /EVALUATION_REVISION_CONFLICT/);
  await assert.rejects(() => evaluate({ catalogKey: 'TESTE', publishedRevision: 3, answers: [] }), /SCORE_INCOMPLETE_ANSWERS/);
  await assert.rejects(() => evaluate({ catalogKey: 'TESTE', publishedRevision: 3, answers: [{ questionId: 'q1', optionId: 'wrong' }] }), /SCORE_INVALID_ANSWER/);
  assert.equal(reads(), 3);
});

test('rejeita payload malformado e pergunta duplicada', async () => {
  const { evaluate } = setup();
  await assert.rejects(() => evaluate({ catalogKey: 'TESTE', publishedRevision: 3, answers: [{ questionId: 'q1' }] }), /EVALUATION_INVALID_REQUEST/);
  const duplicateSnapshot = { ...snapshot, questions: [...snapshot.questions, { id: 'q2', options: [{ id: 'no', score: 0 }] }] };
  const duplicateEvaluate = createEvaluatePublishedForm({ read: async () => duplicateSnapshot });
  await assert.rejects(() => duplicateEvaluate({ catalogKey: 'TESTE', publishedRevision: 3, answers: [{ questionId: 'q1', optionId: 'yes' }, { questionId: 'q1', optionId: 'no' }] }), /SCORE_INVALID_ANSWER/);
  await assert.rejects(() => evaluate({ catalogKey: 'TESTE', publishedRevision: 3, answers: [{ questionId: 'unknown', optionId: 'yes' }] }), /SCORE_INVALID_ANSWER/);
});

test('reativa após Strict Mode e navegação cancelada sem aceitar resposta tardia', () => {
  const submission = createEvaluationSubmissionController();
  submission.mount();
  submission.unmount();
  submission.mount();

  const firstRequest = submission.begin();
  assert.equal(submission.isSubmitting(), true);
  assert.equal(submission.invalidate(), true);
  assert.equal(submission.isSubmitting(), false);
  assert.equal(submission.canCommit(firstRequest), false);

  const secondRequest = submission.begin();
  assert.equal(submission.canCommit(secondRequest), true);
  assert.equal(submission.finish(firstRequest), false);
  assert.equal(submission.isSubmitting(), true);
  assert.equal(submission.finish(secondRequest), true);
  assert.equal(submission.isSubmitting(), false);
});
