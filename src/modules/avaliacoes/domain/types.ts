export type EvaluationSnapshotOption = { id: string; score: number | null };
export type EvaluationSnapshotQuestion = { id: string; options: readonly EvaluationSnapshotOption[] };
export type EvaluationSnapshotResultBand = { id: string; minScore: number | null; maxScore: number | null; risk: string; description: string };
export type PublishedEvaluationSnapshot = { catalogKey: string; publishedRevision: number; questions: readonly EvaluationSnapshotQuestion[]; resultBands: readonly EvaluationSnapshotResultBand[] };
