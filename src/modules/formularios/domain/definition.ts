import { isValidAuthorName } from './author-name';
import { definitionState } from './completeness';
import { TEXT_LIMITS } from './limits';
import type { FormDefinition } from './types';

const MAX_ITEMS = 500;
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;
// Author photos are resized in the browser before upload; this is a generous ceiling.
const MAX_AUTHOR_PHOTO_LENGTH = 400_000;

export class FormDefinitionError extends Error {
  constructor(readonly detail: string) {
    super('FORM_INVALID_DEFINITION');
  }
}

const STRUCTURE_ERROR = 'Os dados do formulário chegaram em um formato inesperado. Recarregue a página e tente novamente.';

function invalid(detail: string): never {
  throw new FormDefinitionError(detail);
}

function textField(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') invalid(STRUCTURE_ERROR);
  if (value.length > max) invalid(`${field} passou do limite de ${max} caracteres (tem ${value.length}).`);
  return value;
}

function authorName(name: string, n: number): string {
  if (!isValidAuthorName(name)) invalid(`O nome do autor ${n} só pode ter letras, espaços, apóstrofo e ponto.`);
  return name;
}

function validImageDataUrl(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max
    && /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value);
}

function imageField(value: unknown, max: number, field: string): string | null {
  if (value === null) return null;
  if (validImageDataUrl(value, max)) return value;
  if (typeof value === 'string' && value.length > max) invalid(`${field} é grande demais. Escolha uma imagem menor.`);
  return invalid(`${field} precisa ser uma imagem PNG, JPEG, WebP ou GIF.`);
}

function listField(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) invalid(STRUCTURE_ERROR);
  if (value.length > MAX_ITEMS) invalid(`O formulário pode ter no máximo ${MAX_ITEMS} ${label}.`);
  return value;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(STRUCTURE_ERROR);
  return value as Record<string, unknown>;
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 && /^[A-Za-z0-9._:-]+$/.test(value);
}

function idField(value: unknown): string {
  if (!validId(value)) invalid(STRUCTURE_ERROR);
  return value;
}

function validFiniteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function hasUniqueIds(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function uniqueIds<T extends { id: string }>(items: T[]): T[] {
  if (!hasUniqueIds(items)) invalid(STRUCTURE_ERROR);
  return items;
}

export function validateFormDefinition(value: unknown): FormDefinition {
  const input = record(value);
  if (input.schemaVersion !== 1) invalid(STRUCTURE_ERROR);
  const title = textField(input.title, 'O nome do formulário', TEXT_LIMITS.title);
  const description = textField(input.description, 'A descrição do formulário', TEXT_LIMITS.description);
  const imageDataUrl = imageField(input.imageDataUrl, MAX_IMAGE_DATA_URL_LENGTH, 'A imagem do formulário');

  const authors = uniqueIds(listField(input.authors, 'autores').map((author, index) => {
    const item = record(author);
    const n = index + 1;
    return {
      id: idField(item.id),
      name: authorName(textField(item.name, `O nome do autor ${n}`, TEXT_LIMITS.authorName), n),
      institution: textField(item.institution, `A instituição do autor ${n}`, TEXT_LIMITS.institution),
      imageDataUrl: imageField(item.imageDataUrl ?? null, MAX_AUTHOR_PHOTO_LENGTH, `A foto do autor ${n}`),
    };
  }));

  const questions = uniqueIds(listField(input.questions, 'perguntas').map((question, index) => {
    const item = record(question);
    const n = index + 1;
    if (item.type !== 'two-options' && item.type !== 'likert') invalid(STRUCTURE_ERROR);
    const minimum = item.type === 'two-options' ? 2 : 3;
    const rawAlternatives = listField(item.alternatives, `alternativas na pergunta ${n}`);
    if (rawAlternatives.length < minimum) invalid(`A pergunta ${n} precisa de pelo menos ${minimum} alternativas.`);
    const alternatives = uniqueIds(rawAlternatives.map((alternative, altIndex) => {
      const alt = record(alternative);
      const where = `da alternativa ${altIndex + 1} da pergunta ${n}`;
      if (!validFiniteOrNull(alt.score)) invalid(`A pontuação ${where} precisa ser um número.`);
      return { id: idField(alt.id), label: textField(alt.label, `O texto ${where}`, TEXT_LIMITS.alternative), score: alt.score };
    }));
    return { id: idField(item.id), prompt: textField(item.prompt, `O texto da pergunta ${n}`, TEXT_LIMITS.question), type: item.type, alternatives } as FormDefinition['questions'][number];
  }));

  const resultBands = uniqueIds(listField(input.resultBands, 'faixas de resultado').map((band, index) => {
    const item = record(band);
    const n = index + 1;
    const { minScore, maxScore } = item;
    if (!validFiniteOrNull(minScore) || !validFiniteOrNull(maxScore)) invalid(`A faixa ${n} precisa ter números em "De" e "Até".`);
    for (const [bound, label] of [[minScore, 'De'], [maxScore, 'Até']] as const) {
      if (bound !== null && (bound < 0 || bound > 100)) invalid(`Na faixa ${n}, "${label}" (${bound}) precisa estar entre 0 e 100%.`);
      if (bound !== null && !Number.isInteger(bound)) invalid(`Na faixa ${n}, "${label}" (${bound}) precisa ser um percentual inteiro entre 0 e 100%.`);
    }
    if (minScore !== null && maxScore !== null && minScore > maxScore) {
      invalid(`Na faixa ${n}, "De" (${minScore}%) está maior que "Até" (${maxScore}%).`);
    }
    return {
      id: idField(item.id), minScore, maxScore,
      risk: textField(item.risk, `O resultado da faixa ${n}`, TEXT_LIMITS.risk),
      description: textField(item.description, `A descrição da faixa ${n}`, TEXT_LIMITS.bandDescription),
    };
  }));

  const rawDimensions = input.dimensions;
  let dimensions: FormDefinition['dimensions'];
  if (rawDimensions !== undefined) {
    const parsed = uniqueIds(listField(rawDimensions, 'dimensões').map((dimension, index) => {
      const item = record(dimension);
      const n = index + 1;
      const dimensionName = textField(item.name, `O nome da dimensão ${n}`, TEXT_LIMITS.dimensionName);
      const dimensionDescription = textField(item.description, `A descrição da dimensão ${n}`, TEXT_LIMITS.dimensionDescription);
      const dimensionQuestions = uniqueIds(listField(item.questions, `perguntas da dimensão ${n}`).map((question, questionIndex) => {
        const q = record(question);
        const qn = questionIndex + 1;
        if (q.type !== 'two-options' && q.type !== 'likert') invalid(STRUCTURE_ERROR);
        const minimum = q.type === 'two-options' ? 2 : 3;
        const alternatives = uniqueIds(listField(q.alternatives, `alternativas na pergunta ${qn} da dimensão ${n}`).map((alternative, altIndex) => {
          const alt = record(alternative);
          if (!validFiniteOrNull(alt.score)) invalid(`A pontuação da alternativa ${altIndex + 1} da pergunta ${qn} da dimensão ${n} precisa ser um número.`);
          return { id: idField(alt.id), label: textField(alt.label, `O texto da alternativa ${altIndex + 1} da pergunta ${qn} da dimensão ${n}`, TEXT_LIMITS.alternative), score: alt.score };
        }));
        if (alternatives.length < minimum) invalid(`A pergunta ${qn} da dimensão ${n} precisa de pelo menos ${minimum} alternativas.`);
        return { id: idField(q.id), prompt: textField(q.prompt, `O texto da pergunta ${qn} da dimensão ${n}`, TEXT_LIMITS.question), type: q.type, alternatives } as FormDefinition['questions'][number];
      }));
      const dimensionBands = uniqueIds(listField(item.resultBands, `faixas da dimensão ${n}`).map((band, bandIndex) => {
        const b = record(band);
        const bn = bandIndex + 1;
        const { minScore, maxScore } = b;
        if (!validFiniteOrNull(minScore) || !validFiniteOrNull(maxScore)) invalid(`A faixa ${bn} da dimensão ${n} precisa ter números em "De" e "Até".`);
        if ((minScore !== null && (minScore < 0 || minScore > 100)) || (maxScore !== null && (maxScore < 0 || maxScore > 100))) invalid(`Na faixa ${bn} da dimensão ${n}, os limites precisam estar entre 0 e 100%.`);
        if ((minScore !== null && !Number.isInteger(minScore)) || (maxScore !== null && !Number.isInteger(maxScore))) invalid(`Na faixa ${bn} da dimensão ${n}, os limites precisam ser percentuais inteiros entre 0 e 100%.`);
        if (minScore !== null && maxScore !== null && minScore > maxScore) invalid(`Na faixa ${bn} da dimensão ${n}, "De" está maior que "Até".`);
        return { id: idField(b.id), minScore, maxScore, risk: textField(b.risk, `O resultado da faixa ${bn} da dimensão ${n}`, TEXT_LIMITS.risk), description: textField(b.description, `A descrição da faixa ${bn} da dimensão ${n}`, TEXT_LIMITS.bandDescription) };
      }));
      return { id: idField(item.id), name: dimensionName, description: dimensionDescription, questions: dimensionQuestions, resultBands: dimensionBands };
    }));
    dimensions = parsed.length > 0 ? parsed : undefined;
  }

  return { schemaVersion: 1, title, description, imageDataUrl, authors, questions, resultBands, ...(dimensions ? { dimensions } : {}) };
}

export { definitionState };

export function emptyFormDefinition(): FormDefinition {
  return { schemaVersion: 1, title: '', description: '', imageDataUrl: null, authors: [], questions: [], resultBands: [] };
}
