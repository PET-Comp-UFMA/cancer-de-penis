export type EvaluatePublishedFormCommand = { catalogKey: unknown; publishedRevision: unknown; answers: unknown };
export type EvaluationResult = { score: number; percentage: number; band: { id: string; risk: string; description: string; minScore: number | null; maxScore: number | null } };
export type EvaluatePublishedFormResult = {
  publishedRevision: number;
  general: EvaluationResult | null;
  dimensions: Array<EvaluationResult & { id: string; name: string; description: string }>;
  score?: number;
  percentage?: number;
  band?: EvaluationResult['band'];
};
