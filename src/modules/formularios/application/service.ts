import type {
  ListFormsInput,
  ListFormsResult,
  ListPublishedFormsInput,
  ListPublishedFormsResult,
} from '../domain/types';
import { listForms, listPublishedForms } from '../infrastructure/repository';

const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE = 100_000;
const MAX_PAGE_SIZE = 50;

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
