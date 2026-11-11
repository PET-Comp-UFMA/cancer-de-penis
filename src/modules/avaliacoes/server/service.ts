import { postgresPublishedFormReader } from '@/modules/formularios/infrastructure/repository';
import { toPublishedEvaluationSnapshot } from '../application/mappers/published-form-snapshot';
import { createEvaluatePublishedForm } from '../application/use-cases/evaluate-published-form';
import type { EvaluatePublishedFormCommand } from '../application/dto/evaluate-published-form';
const reader = { read: async (catalogKey: string) => toPublishedEvaluationSnapshot(await postgresPublishedFormReader.read(catalogKey)) };
export const evaluatePublishedForm = createEvaluatePublishedForm(reader);
export type { EvaluatePublishedFormCommand };
