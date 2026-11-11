import type { PublicFormDetail } from '@/modules/formularios/domain/types';
import type { PublishedEvaluationSnapshot } from '../../domain/types';
export function toPublishedEvaluationSnapshot(form: PublicFormDetail): PublishedEvaluationSnapshot {
  return {
    catalogKey: form.catalogKey,
    publishedRevision: form.publishedRevision,
    questions: form.definition.questions.map((question) => ({
      id: question.id,
      options: question.alternatives.map((option) => ({ id: option.id, score: option.score })),
    })),
    resultBands: form.definition.resultBands.map((band) => ({
      id: band.id,
      minScore: band.minScore,
      maxScore: band.maxScore,
      risk: band.risk,
      description: band.description,
    })),
  };
}
