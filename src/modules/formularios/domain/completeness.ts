import type { FormDefinition } from './types';

// Shared by the server (definition_state, publish gate) and the editor
// (step checkmarks, publish button), so both always agree on "publishable".

export function questionsComplete(definition: FormDefinition): boolean {
  return definition.questions.length > 0
    && definition.questions.every((question) => {
      const minimum = question.type === 'likert' ? 3 : 2;
      return question.prompt.trim().length > 0
        && question.alternatives.length >= minimum
        && question.alternatives.every((alternative) => alternative.label.trim().length > 0
          && alternative.score !== null
          && Number.isFinite(alternative.score));
    });
}

// Bands are a percentage of the producible score range (0–100, closed on
// both ends — see the FormResultBand comment in types.ts). The scoring engine
// only produces whole-number percentages, so adjacent bands must be exactly one
// point apart (e.g. [0,33] then [34,66]) and together span 0 to 100.
export function resultBandsComplete(definition: FormDefinition): boolean {
  const bands = definition.resultBands;
  if (bands.length === 0 || !bands.every((band) => band.risk.trim().length > 0
    && band.minScore !== null && band.maxScore !== null
    && Number.isFinite(band.minScore) && Number.isFinite(band.maxScore)
    && band.minScore <= band.maxScore)) return false;
  const sorted = [...bands].sort((a, b) => (a.minScore as number) - (b.minScore as number));
  for (let index = 0; index < sorted.length - 1; index += 1) {
    if ((sorted[index].maxScore as number) + 1 !== sorted[index + 1].minScore) return false;
  }
  return sorted[0].minScore === 0 && sorted[sorted.length - 1].maxScore === 100;
}

export function definitionState(definition: FormDefinition): 'incomplete' | 'complete' {
  return definition.title.trim().length > 0 && questionsComplete(definition) && resultBandsComplete(definition)
    ? 'complete'
    : 'incomplete';
}
