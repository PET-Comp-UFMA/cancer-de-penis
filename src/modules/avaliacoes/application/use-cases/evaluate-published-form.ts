import { computeScore } from '../../domain/scoring';
import type { EvaluatePublishedFormCommand, EvaluatePublishedFormResult } from '../dto/evaluate-published-form';
import type { PublishedEvaluationSnapshotReader } from '../ports/published-snapshot-reader';
function invalid(): never { throw new Error('EVALUATION_INVALID_REQUEST'); }
export function createEvaluatePublishedForm(reader: PublishedEvaluationSnapshotReader) { return async function evaluate(command: EvaluatePublishedFormCommand): Promise<EvaluatePublishedFormResult> {
  if (typeof command.catalogKey !== 'string' || command.catalogKey.length === 0 || command.catalogKey.length > 200
    || !Number.isSafeInteger(command.publishedRevision) || (command.publishedRevision as number) < 0
    || !Array.isArray(command.answers)) invalid();
  const answers = command.answers as unknown[];
  if (answers.some((answer) => !answer || typeof answer !== 'object'
    || typeof (answer as Record<string, unknown>).questionId !== 'string'
    || typeof (answer as Record<string, unknown>).optionId !== 'string'
    || !(answer as Record<string, string>).questionId
    || !(answer as Record<string, string>).optionId
    || (answer as Record<string, string>).questionId.length > 200
    || (answer as Record<string, string>).optionId.length > 200
    || (Object.prototype.hasOwnProperty.call(answer, 'dimensionId') && typeof (answer as Record<string, unknown>).dimensionId !== 'string'))) invalid();
  const snapshot = await reader.read(command.catalogKey);
  if (snapshot.publishedRevision !== command.publishedRevision) throw new Error('EVALUATION_REVISION_CONFLICT');
  const scopes = [{ id: undefined, name: '', description: '', questions: snapshot.questions, resultBands: snapshot.resultBands }, ...(snapshot.dimensions ?? [])];
  const normalized = answers.map((answer) => ({
    questionId: (answer as Record<string, string>).questionId,
    optionId: (answer as Record<string, string>).optionId,
    dimensionId: (answer as Record<string, unknown>).dimensionId as string | undefined,
  }));
  const knownDimensionIds = new Set((snapshot.dimensions ?? []).map((dimension) => dimension.id));
  if (normalized.some((answer) => answer.dimensionId !== undefined && !knownDimensionIds.has(answer.dimensionId))) throw new Error('SCORE_INVALID_ANSWER');
  const results = scopes.map((scope) => {
    const scopeAnswers = normalized.filter((answer) => answer.dimensionId === scope.id).map(({ questionId, optionId }) => ({ questionId, optionId }));
    if (scopeAnswers.length === 0 && scope.questions.length === 0) return null;
    if (scopeAnswers.length !== scope.questions.length) throw new Error('SCORE_INCOMPLETE_ANSWERS');
    const questionIds = new Set(scope.questions.map((question) => question.id));
    if (new Set(scopeAnswers.map((answer) => answer.questionId)).size !== scopeAnswers.length || scopeAnswers.some((answer) => !questionIds.has(answer.questionId))) throw new Error('SCORE_INVALID_ANSWER');
    for (const answer of scopeAnswers) { const question = scope.questions.find((item) => item.id === answer.questionId); if (!question?.options.some((option) => option.id === answer.optionId)) throw new Error('SCORE_INVALID_ANSWER'); }
    return computeScore(scope, scopeAnswers);
  });
  const general = results[0];
  const dimensions = (snapshot.dimensions ?? []).map((dimension, index) => ({ id: dimension.id, name: dimension.name, description: dimension.description, ...(results[index + 1] as NonNullable<typeof results[number]>) }));
  return { publishedRevision: snapshot.publishedRevision, general, dimensions, ...(general ? { score: general.score, percentage: general.percentage, band: general.band } : {}) };
}; }
