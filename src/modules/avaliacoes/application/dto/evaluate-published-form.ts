export type EvaluatePublishedFormCommand = { catalogKey: unknown; publishedRevision: unknown; answers: unknown };
export type EvaluatePublishedFormResult = { publishedRevision: number; score: number; percentage: number; band: { id: string; risk: string; description: string; minScore: number | null; maxScore: number | null } };
