import type { EvaluationSnapshotResultBand } from './types';
type ScoringQuestion = { id: string; options?: readonly { id: string; score: number | null }[] };
type ScoringBand = { id: string; minScore: number | null; maxScore: number | null; risk: string; description: string };
type ScoringForm = { questions: readonly ScoringQuestion[]; resultBands: readonly ScoringBand[] };
export type ScoreAnswer = { questionId: string; optionId: string };
export type ScoreResult = { score: number; band: EvaluationSnapshotResultBand; percentage: number };
function questionOptions(question: ScoringQuestion) { return question.options ?? []; }
export function isScorable(form: ScoringForm): boolean {
  return form.questions.length > 0
    && form.questions.every((q) => questionOptions(q).length > 0
      && questionOptions(q).every((o) => o.score !== null && Number.isFinite(o.score)))
    && form.resultBands.length > 0
    && form.resultBands.every((b) => b.minScore !== null && b.maxScore !== null
      && Number.isFinite(b.minScore) && Number.isFinite(b.maxScore) && b.minScore <= b.maxScore);
}
export function computeScore(form: ScoringForm, answers: readonly ScoreAnswer[]): ScoreResult {
  if (!isScorable(form)) throw new Error('SCORE_NOT_AVAILABLE');
  if (answers.length !== form.questions.length) throw new Error('SCORE_INCOMPLETE_ANSWERS');
  let score = 0;
  for (const question of form.questions) {
    const answer = answers.find((a) => a.questionId === question.id);
    if (!answer) throw new Error('SCORE_INCOMPLETE_ANSWERS');
    const option = questionOptions(question).find((o) => o.id === answer.optionId);
    if (!option) throw new Error('SCORE_INVALID_ANSWER');
    score += option.score as number;
  }
  const percentage = scoreToPercentage(form, score);
  return { score, percentage, band: resolveBand(form.resultBands, percentage) };
}
export function producibleScoreRange(form: Pick<ScoringForm, 'questions'>): { min: number; max: number } { return form.questions.reduce((acc, question) => { const scores = questionOptions(question).map((option) => option.score as number); return { min: acc.min + Math.min(...scores), max: acc.max + Math.max(...scores) }; }, { min: 0, max: 0 }); }
export function scoreToPercentage(form: Pick<ScoringForm, 'questions'>, score: number): number { const { min, max } = producibleScoreRange(form); if (max <= min) return 0; const ratio = (score - min) / (max - min); return Math.max(0, Math.min(100, Math.round(ratio * 100))); }
export function resolveBand(bands: readonly ScoringBand[], percentage: number): ScoringBand { const matches = bands.filter((b) => percentage >= (b.minScore as number) && percentage <= (b.maxScore as number)); if (matches.length === 0) throw new Error('SCORE_NO_MATCHING_BAND'); if (matches.length > 1) throw new Error('SCORE_AMBIGUOUS_BAND'); return matches[0]; }
