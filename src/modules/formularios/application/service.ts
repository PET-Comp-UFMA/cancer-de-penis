import type {
  FormStatus,
  ListFormsInput,
  ListFormsResult,
  ListPublishedFormsInput,
  ListPublishedFormsResult,
  FormDefinition,
} from '../domain/types';
import { definitionState } from '../domain/completeness';
import { isValidAuthorName } from '../domain/author-name';
import {
  createForm,
  deleteOwnedForm,
  getOwnedForm,
  listForms,
  listPublishedForms,
  updateOwnedDefinition,
  updateFormStatus,
  getPublishedForm,
} from '../infrastructure/repository';
import { randomUUID } from 'node:crypto';
import type { FormDetail } from '../domain/types';

const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE = 100_000;
const MAX_PAGE_SIZE = 50;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT = 10_000;
const MAX_ITEMS = 500;
const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;
// Author photos are resized in the browser before upload; this is a generous ceiling.
const MAX_AUTHOR_PHOTO_LENGTH = 400_000;

export async function listOwnedForms(input: ListFormsInput): Promise<ListFormsResult> {
  if (!input.ownerId || !Number.isInteger(input.page) || input.page < 1 || input.page > MAX_PAGE
    || !Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > MAX_PAGE_SIZE
    || (input.search ?? '').length > MAX_SEARCH_LENGTH) {
    throw new Error('INVALID_REQUEST');
  }
  return listForms(input.ownerId, input.search ?? '', input.page, input.pageSize);
}

export async function listPublicPublishedForms(
  input: ListPublishedFormsInput,
): Promise<ListPublishedFormsResult> {
  if (!Number.isSafeInteger(input.page) || input.page < 1 || input.page > MAX_PAGE
    || !Number.isSafeInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > MAX_PAGE_SIZE
    || (input.search ?? '').length > MAX_SEARCH_LENGTH) {
    throw new Error('INVALID_REQUEST');
  }
  return listPublishedForms(input.search ?? '', input.page, input.pageSize);
}

export async function readPublicPublishedForm(catalogKey: string) {
  if (!validText(catalogKey, 200) || catalogKey.length === 0) throw new Error('INVALID_REQUEST');
  return getPublishedForm(catalogKey);
}

export async function setOwnedFormStatus(input: {
  ownerId: string;
  formId: string;
  status: FormStatus;
  expectedRevision: unknown;
}) {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)
    || !['unpublished', 'published'].includes(input.status)
    || !Number.isSafeInteger(input.expectedRevision)
    || (input.expectedRevision as number) < 0) {
    throw new Error('INVALID_REQUEST');
  }
  return updateFormStatus(input.ownerId, input.formId, input.status, input.expectedRevision as number);
}

export async function removeOwnedForm(input: { ownerId: string; formId: string }) {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)) {
    throw new Error('INVALID_REQUEST');
  }
  return deleteOwnedForm(input.ownerId, input.formId);
}

function validText(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === 'string' && value.length <= max;
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 && /^[A-Za-z0-9._:-]+$/.test(value);
}

function validImageDataUrl(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max
    && /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value);
}

function validFiniteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function hasUniqueIds(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id)).size === items.length;
}

// Keeps the FORM_INVALID_DEFINITION code but carries a reason the editor can
// show, so the person knows which field to fix.
export class FormDefinitionError extends Error {
  constructor(readonly detail: string) {
    super('FORM_INVALID_DEFINITION');
  }
}

const STRUCTURE_ERROR = 'Os dados do formulário chegaram em um formato inesperado. Recarregue a página e tente novamente.';

function invalid(detail: string): never {
  throw new FormDefinitionError(detail);
}

function textField(value: unknown, field: string): string {
  if (typeof value !== 'string') invalid(STRUCTURE_ERROR);
  if (value.length > MAX_TEXT) invalid(`${field} passou do limite de ${MAX_TEXT.toLocaleString('pt-BR')} caracteres.`);
  return value;
}

function authorName(name: string, n: number): string {
  if (!isValidAuthorName(name)) invalid(`O nome do autor ${n} só pode ter letras, espaços, apóstrofo e ponto.`);
  return name;
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

function idField(value: unknown): string {
  if (!validId(value)) invalid(STRUCTURE_ERROR);
  return value;
}

function uniqueIds<T extends { id: string }>(items: T[]): T[] {
  if (!hasUniqueIds(items)) invalid(STRUCTURE_ERROR);
  return items;
}

export function validateFormDefinition(value: unknown): FormDefinition {
  const input = record(value);
  if (input.schemaVersion !== 1) invalid(STRUCTURE_ERROR);
  const title = textField(input.title, 'O nome do formulário');
  const description = textField(input.description, 'A descrição do formulário');
  const imageDataUrl = imageField(input.imageDataUrl, MAX_IMAGE_DATA_URL_LENGTH, 'A imagem do formulário');

  const authors = uniqueIds(listField(input.authors, 'autores').map((author, index) => {
    const item = record(author);
    const n = index + 1;
    return {
      id: idField(item.id),
      name: authorName(textField(item.name, `O nome do autor ${n}`), n),
      institution: textField(item.institution, `A instituição do autor ${n}`),
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
      return { id: idField(alt.id), label: textField(alt.label, `O texto ${where}`), score: alt.score };
    }));
    return { id: idField(item.id), prompt: textField(item.prompt, `O texto da pergunta ${n}`), type: item.type, alternatives } as FormDefinition['questions'][number];
  }));

  const resultBands = uniqueIds(listField(input.resultBands, 'faixas de resultado').map((band, index) => {
    const item = record(band);
    const n = index + 1;
    const { minScore, maxScore } = item;
    if (!validFiniteOrNull(minScore) || !validFiniteOrNull(maxScore)) invalid(`A faixa ${n} precisa ter números em "De" e "Até".`);
    for (const [bound, label] of [[minScore, 'De'], [maxScore, 'Até']] as const) {
      if (bound !== null && (bound < 0 || bound > 100)) invalid(`Na faixa ${n}, "${label}" (${bound}) precisa estar entre 0 e 100%.`);
    }
    if (minScore !== null && maxScore !== null && minScore > maxScore) {
      invalid(`Na faixa ${n}, "De" (${minScore}%) está maior que "Até" (${maxScore}%).`);
    }
    return {
      id: idField(item.id), minScore, maxScore,
      risk: textField(item.risk, `O resultado da faixa ${n}`),
      description: textField(item.description, `A descrição da faixa ${n}`),
    };
  }));

  return { schemaVersion: 1, title, description, imageDataUrl, authors, questions, resultBands };
}

export { definitionState };

export function emptyFormDefinition(): FormDefinition {
  return { schemaVersion: 1, title: '', description: '', imageDataUrl: null, authors: [], questions: [], resultBands: [] };
}

export async function createOwnedForm(ownerId: string, input?: unknown): Promise<FormDetail> {
  if (!UUID_PATTERN.test(ownerId)) throw new Error('INVALID_REQUEST');
  const definition = input === undefined ? emptyFormDefinition() : validateFormDefinition(input);
  return createForm(ownerId, `FORM-${randomUUID().replaceAll('-', '').toUpperCase()}`, definition, definitionState(definition));
}

// Creates an unpublished, editable copy — the way to change a form that is
// locked because it was already published.
export async function duplicateOwnedForm(input: { ownerId: string; formId: string }): Promise<FormDetail> {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)) throw new Error('INVALID_REQUEST');
  const source = await getOwnedForm(input.ownerId, input.formId);
  const title = `${source.definition.title || source.title} (cópia)`;
  const definition = validateFormDefinition({ ...source.definition, title });
  return createForm(input.ownerId, `FORM-${randomUUID().replaceAll('-', '').toUpperCase()}`, definition, definitionState(definition));
}

export async function readOwnedForm(input: { ownerId: string; formId: string }): Promise<FormDetail> {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)) throw new Error('INVALID_REQUEST');
  return getOwnedForm(input.ownerId, input.formId);
}

export async function saveOwnedDefinition(input: {
  ownerId: string; formId: string; definition: unknown; expectedRevision: unknown;
}): Promise<FormDetail> {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)
    || !Number.isSafeInteger(input.expectedRevision) || (input.expectedRevision as number) < 0) {
    throw new Error('INVALID_REQUEST');
  }
  const definition = validateFormDefinition(input.definition);
  return updateOwnedDefinition(input.ownerId, input.formId, definition, input.expectedRevision as number, definitionState(definition));
}
