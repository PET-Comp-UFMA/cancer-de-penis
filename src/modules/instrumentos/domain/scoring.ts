import type { FormDefinition, FormResultBand } from './form-definitions';

export type ScoreAnswer = { questionId: string; optionId: string };
export type ScoreResult = { score: number; band: FormResultBand; percentage: number };

function booleanScore(optionId: string): number | undefined {
  const normalized = optionId.toLocaleLowerCase();
  if (normalized === 'true' || normalized === 'sim') return 1;
  if (normalized === 'false' || normalized === 'não' || normalized === 'nao') return 0;
  return undefined;
}

function questionOptions(question: FormDefinition['questions'][number]) {
  if (question.answerType === 'boolean') {
    return [
      { id: 'false', label: 'Não', score: 0 },
      { id: 'true', label: 'Sim', score: 1 },
    ];
  }
  return question.options ?? [];
}

export function isScorable(form: Pick<FormDefinition, 'questions' | 'resultBands'>): boolean {
  return form.questions.length > 0
    && form.questions.every((q) => questionOptions(q).length > 0
      && questionOptions(q).every((o) => o.score !== null && Number.isFinite(o.score)))
    && form.resultBands.length > 0
    && form.resultBands.every((b) => b.minScore !== null && b.maxScore !== null
      && Number.isFinite(b.minScore) && Number.isFinite(b.maxScore) && b.minScore <= b.maxScore);
}

export function computeScore(
  form: Pick<FormDefinition, 'questions' | 'resultBands'>,
  answers: readonly ScoreAnswer[],
): ScoreResult {
  if (!isScorable(form)) throw new Error('SCORE_NOT_AVAILABLE');
  if (answers.length !== form.questions.length) throw new Error('SCORE_INCOMPLETE_ANSWERS');

  let score = 0;
  for (const question of form.questions) {
    const answer = answers.find((a) => a.questionId === question.id);
    if (!answer) throw new Error('SCORE_INCOMPLETE_ANSWERS');
    if (question.answerType === 'boolean') {
      const value = booleanScore(answer.optionId);
      if (value === undefined) throw new Error('SCORE_INVALID_ANSWER');
      score += value;
    } else {
      const option = question.options!.find((o) => o.id === answer.optionId);
      if (!option) throw new Error('SCORE_INVALID_ANSWER');
      score += option.score as number;
    }
  }
  const percentage = scoreToPercentage(form, score);
  return { score, percentage, band: resolveBand(form.resultBands, percentage) };
}

// Producible score range: sum of the min/max option score per question.
// Exact and cheap (one answer per question, no combinatorics needed).
export function producibleScoreRange(form: Pick<FormDefinition, 'questions'>): { min: number; max: number } {
  return form.questions.reduce((acc, question) => {
    const scores = questionOptions(question).map((option) => option.score as number);
    return { min: acc.min + Math.min(...scores), max: acc.max + Math.max(...scores) };
  }, { min: 0, max: 0 });
}

// Normalização para porcentagem: percentual = (pontuação - mínimo) / amplitude
// × 100 — a mesma fórmula fornecida pelo responsável clínico (equivalente a
// (pontuação + 48) / 96 × 100 quando mínimo = -48 e amplitude = 96, por
// exemplo, numa escala Likert de 5 pontos com 24 perguntas pontuadas de -2 a
// +2). Generalizada aqui para qualquer combinação de perguntas/pesos.
export function scoreToPercentage(form: Pick<FormDefinition, 'questions'>, score: number): number {
  const { min, max } = producibleScoreRange(form);
  if (max <= min) return 0;
  const ratio = (score - min) / (max - min);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

// Result bands are authored as a percentage of the producible range (0–100),
// not a raw score — this is the "critério de classificação" the clinical
// owner specified (e.g. até 33% Baixo, 34–66% Médio, acima de 66% Alto):
// portable across instruments regardless of question count or weight range,
// since every instrument's score is first normalized to 0–100 above.
// Bands are closed-closed and must not touch: consecutive bands are
// expected as [0,33], [34,66], [67,100] — a one-point gap between them is
// how two adjacent *integer* percentages avoid sharing a boundary. A real
// gap or overlap in authored bands surfaces as SCORE_NO_MATCHING_BAND /
// SCORE_AMBIGUOUS_BAND rather than being silently resolved.
export function resolveBand(bands: readonly FormResultBand[], percentage: number): FormResultBand {
  const matches = bands.filter((b) => percentage >= (b.minScore as number) && percentage <= (b.maxScore as number));
  if (matches.length === 0) throw new Error('SCORE_NO_MATCHING_BAND');
  if (matches.length > 1) throw new Error('SCORE_AMBIGUOUS_BAND');
  return matches[0];
}
