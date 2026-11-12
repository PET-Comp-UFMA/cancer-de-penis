export type EvaluationSnapshotOption = { id: string; score: number | null };
export type EvaluationSnapshotQuestion = { id: string; options: readonly EvaluationSnapshotOption[] };
export type EvaluationSnapshotResultBand = { id: string; minScore: number | null; maxScore: number | null; risk: string; description: string };
export type EvaluationSnapshotScope = { id: string; name: string; description: string; questions: readonly EvaluationSnapshotQuestion[]; resultBands: readonly EvaluationSnapshotResultBand[] };
export type PublishedEvaluationSnapshot = { catalogKey: string; publishedRevision: number; questions: readonly EvaluationSnapshotQuestion[]; resultBands: readonly EvaluationSnapshotResultBand[]; dimensions?: readonly EvaluationSnapshotScope[] };
