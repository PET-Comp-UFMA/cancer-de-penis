import type {
  FormStatus,
  ListFormsInput,
  ListFormsResult,
  ListPublishedFormsInput,
  ListPublishedFormsResult,
  FormDefinition,
} from '../domain/types';
import { definitionState } from '../domain/completeness';
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

export function validateFormDefinition(value: unknown): FormDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('FORM_INVALID_DEFINITION');
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== 1 || !validText(input.title) || !validText(input.description)
    || (input.imageDataUrl !== null && !validImageDataUrl(input.imageDataUrl, MAX_IMAGE_DATA_URL_LENGTH))) {
    throw new Error('FORM_INVALID_DEFINITION');
  }
  if (!Array.isArray(input.authors) || input.authors.length > MAX_ITEMS
    || !Array.isArray(input.questions) || input.questions.length > MAX_ITEMS
    || !Array.isArray(input.resultBands) || input.resultBands.length > MAX_ITEMS) {
    throw new Error('FORM_INVALID_DEFINITION');
  }
  const authors = input.authors.map((author) => {
    if (!author || typeof author !== 'object' || Array.isArray(author)) throw new Error('FORM_INVALID_DEFINITION');
    const item = author as Record<string, unknown>;
    const photo = item.imageDataUrl ?? null;
    if (!validId(item.id) || !validText(item.name) || !validText(item.institution)
      || (photo !== null && !validImageDataUrl(photo, MAX_AUTHOR_PHOTO_LENGTH))) throw new Error('FORM_INVALID_DEFINITION');
    return { id: item.id, name: item.name, institution: item.institution, imageDataUrl: photo as string | null };
  });
  if (!hasUniqueIds(authors)) throw new Error('FORM_INVALID_DEFINITION');
  const questions = input.questions.map((question) => {
    if (!question || typeof question !== 'object' || Array.isArray(question)) throw new Error('FORM_INVALID_DEFINITION');
    const item = question as Record<string, unknown>;
    if (!validId(item.id) || !validText(item.prompt) || (item.type !== 'two-options' && item.type !== 'likert')
      || !Array.isArray(item.alternatives) || item.alternatives.length > MAX_ITEMS
      || item.alternatives.length < (item.type === 'two-options' ? 2 : 3)) throw new Error('FORM_INVALID_DEFINITION');
    const alternatives = item.alternatives.map((alternative) => {
      if (!alternative || typeof alternative !== 'object' || Array.isArray(alternative)) throw new Error('FORM_INVALID_DEFINITION');
      const alt = alternative as Record<string, unknown>;
      if (!validId(alt.id) || !validText(alt.label) || !validFiniteOrNull(alt.score)) throw new Error('FORM_INVALID_DEFINITION');
      return { id: alt.id, label: alt.label, score: alt.score };
    });
    if (!hasUniqueIds(alternatives)) throw new Error('FORM_INVALID_DEFINITION');
    return { id: item.id, prompt: item.prompt, type: item.type, alternatives } as FormDefinition['questions'][number];
  });
  if (!hasUniqueIds(questions)) throw new Error('FORM_INVALID_DEFINITION');
  const resultBands = input.resultBands.map((band) => {
    if (!band || typeof band !== 'object' || Array.isArray(band)) throw new Error('FORM_INVALID_DEFINITION');
    const item = band as Record<string, unknown>;
    if (!validId(item.id) || !validFiniteOrNull(item.minScore) || !validFiniteOrNull(item.maxScore)
      || !validText(item.risk) || !validText(item.description)
      || (item.minScore !== null && (item.minScore < 0 || item.minScore > 100))
      || (item.maxScore !== null && (item.maxScore < 0 || item.maxScore > 100))
      || (item.minScore !== null && item.maxScore !== null && item.minScore > item.maxScore)) throw new Error('FORM_INVALID_DEFINITION');
    return { id: item.id, minScore: item.minScore, maxScore: item.maxScore, risk: item.risk, description: item.description };
  });
  if (!hasUniqueIds(resultBands)) throw new Error('FORM_INVALID_DEFINITION');
  return {
    schemaVersion: 1, title: input.title, description: input.description,
    imageDataUrl: input.imageDataUrl as string | null, authors, questions, resultBands,
  };
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
