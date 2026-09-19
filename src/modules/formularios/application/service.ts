import type {
  FormStatus,
  ListFormsInput,
  ListFormsResult,
  ListPublishedFormsInput,
  ListPublishedFormsResult,
} from '../domain/types';
import {
  deleteOwnedForm,
  listForms,
  listPublishedForms,
  updateFormStatus,
} from '../infrastructure/repository';

const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE = 100_000;
const MAX_PAGE_SIZE = 50;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export async function setOwnedFormStatus(input: {
  ownerId: string;
  formId: string;
  status: FormStatus;
}) {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)
    || !['unpublished', 'published'].includes(input.status)) {
    throw new Error('INVALID_REQUEST');
  }
  return updateFormStatus(input.ownerId, input.formId, input.status);
}

export async function removeOwnedForm(input: { ownerId: string; formId: string }) {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)) {
    throw new Error('INVALID_REQUEST');
  }
  return deleteOwnedForm(input.ownerId, input.formId);
}
