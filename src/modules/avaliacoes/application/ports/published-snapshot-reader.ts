import type { PublishedEvaluationSnapshot } from '../../domain/types';
export interface PublishedEvaluationSnapshotReader { read(catalogKey: string): Promise<PublishedEvaluationSnapshot>; }
