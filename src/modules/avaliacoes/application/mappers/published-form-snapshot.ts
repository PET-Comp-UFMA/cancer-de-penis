import type { PublicFormDetail } from '@/modules/formularios/domain/types';
import type { PublishedEvaluationSnapshot } from '../../domain/types';
export function toPublishedEvaluationSnapshot(form: PublicFormDetail): PublishedEvaluationSnapshot {
  const mapScope = (scope: { questions: PublicFormDetail['definition']['questions']; resultBands: PublicFormDetail['definition']['resultBands'] }) => ({
    questions: scope.questions.map((question) => ({ id: question.id, options: question.alternatives.map((option) => ({ id: option.id, score: option.score })) })),
    resultBands: scope.resultBands.map((band) => ({ id: band.id, minScore: band.minScore, maxScore: band.maxScore, risk: band.risk, description: band.description })),
  });
  const base = {
    catalogKey: form.catalogKey,
    publishedRevision: form.publishedRevision,
    ...mapScope(form.definition),
  };
  if (!form.definition.dimensions?.length) return base;
  return { ...base, dimensions: form.definition.dimensions.map((dimension) => ({ id: dimension.id, name: dimension.name, description: dimension.description, ...mapScope(dimension) })) };
}
