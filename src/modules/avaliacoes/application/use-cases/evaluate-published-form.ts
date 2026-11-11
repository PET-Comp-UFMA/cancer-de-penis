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
    || (answer as Record<string, string>).optionId.length > 200)) invalid();
  const snapshot = await reader.read(command.catalogKey);
  if (snapshot.publishedRevision !== command.publishedRevision) throw new Error('EVALUATION_REVISION_CONFLICT');
  if (answers.length !== snapshot.questions.length) throw new Error('SCORE_INCOMPLETE_ANSWERS');
  const normalized = answers.map((answer) => ({ questionId: (answer as Record<string, string>).questionId, optionId: (answer as Record<string, string>).optionId }));
  const questionIds = new Set(snapshot.questions.map((question) => question.id));
  if (new Set(normalized.map((answer) => answer.questionId)).size !== normalized.length || normalized.some((answer) => !questionIds.has(answer.questionId))) throw new Error('SCORE_INVALID_ANSWER');
  for (const answer of normalized) { const question = snapshot.questions.find((item) => item.id === answer.questionId); if (!question?.options.some((option) => option.id === answer.optionId)) throw new Error('SCORE_INVALID_ANSWER'); }
  const result = computeScore(snapshot, normalized);
  return { publishedRevision: snapshot.publishedRevision, score: result.score, percentage: result.percentage, band: result.band };
}; }
