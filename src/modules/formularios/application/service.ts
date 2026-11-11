import type { FormStatus } from '../domain/types';
import type { FormRepository } from './ports/form-repository';
import type { PublishedFormReader } from './ports/published-form-reader';
import { definitionState, emptyFormDefinition, FormDefinitionError, validateFormDefinition } from '../domain/definition';
import { createForm, deleteForm, duplicateForm, publishForm, readForm, readPublishedForm, saveForm, unpublishForm } from './use-cases/form-commands';
import { toAdminFormDetail, toAdminFormList, toAdminFormListItem, toPublicFormDetail, toPublicFormList } from './mappers/form-mappers';
import type { AdminFormDetailResponse, AdminFormListResponse, PublicFormDetailResponse, PublicFormListResponse } from './dto/form-responses';
import type { ListOwnedFormsCommand, ListPublishedFormsCommand } from './dto/form-commands';

export { definitionState, emptyFormDefinition, FormDefinitionError, validateFormDefinition };

const MAX_SEARCH_LENGTH = 100;
const MAX_PAGE = 100_000;
const MAX_PAGE_SIZE = 50;

type FormApplication = {
  listOwnedForms(input: ListOwnedFormsCommand): Promise<AdminFormListResponse>;
  listPublicPublishedForms(input: ListPublishedFormsCommand): Promise<PublicFormListResponse>;
  readPublicPublishedForm(catalogKey: string): Promise<PublicFormDetailResponse>;
  setOwnedFormStatus(input: { ownerId: string; formId: string; status: FormStatus; expectedRevision: unknown }): Promise<ReturnType<typeof toAdminFormListItem>>;
  removeOwnedForm(input: { ownerId: string; formId: string }): Promise<void>;
  createOwnedForm(ownerId: string, input?: unknown): Promise<AdminFormDetailResponse>;
  duplicateOwnedForm(input: { ownerId: string; formId: string }): Promise<AdminFormDetailResponse>;
  readOwnedForm(input: { ownerId: string; formId: string }): Promise<AdminFormDetailResponse>;
  saveOwnedDefinition(input: { ownerId: string; formId: string; definition: unknown; expectedRevision: unknown }): Promise<AdminFormDetailResponse>;
};

export function createFormApplication(dependencies: { formRepository: FormRepository; publishedFormReader: PublishedFormReader }): FormApplication {
  const { formRepository, publishedFormReader } = dependencies;

  async function listOwnedForms(input: ListOwnedFormsCommand): Promise<AdminFormListResponse> {
    if (!input.ownerId || !Number.isInteger(input.page) || input.page < 1 || input.page > MAX_PAGE
      || !Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > MAX_PAGE_SIZE
      || (input.search ?? '').length > MAX_SEARCH_LENGTH) throw new Error('INVALID_REQUEST');
    return toAdminFormList(await formRepository.listOwned(input.ownerId, input.search ?? '', input.page, input.pageSize));
  }

  async function listPublicPublishedForms(input: ListPublishedFormsCommand): Promise<PublicFormListResponse> {
    if (!Number.isSafeInteger(input.page) || input.page < 1 || input.page > MAX_PAGE
      || !Number.isSafeInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > MAX_PAGE_SIZE
      || (input.search ?? '').length > MAX_SEARCH_LENGTH) throw new Error('INVALID_REQUEST');
    return toPublicFormList(await publishedFormReader.list(input.search ?? '', input.page, input.pageSize));
  }

  async function readPublicPublishedForm(catalogKey: string): Promise<PublicFormDetailResponse> {
    return toPublicFormDetail(await readPublishedForm(publishedFormReader, { catalogKey }));
  }

  return {
    listOwnedForms,
    listPublicPublishedForms,
    readPublicPublishedForm,
    setOwnedFormStatus: async (input) => {
      if (input.status !== 'published' && input.status !== 'unpublished') throw new Error('INVALID_REQUEST');
      const result = input.status === 'published'
        ? await publishForm(formRepository, input)
        : await unpublishForm(formRepository, input);
      return toAdminFormListItem(result);
    },
    removeOwnedForm: (input) => deleteForm(formRepository, input),
    createOwnedForm: async (ownerId, input) => toAdminFormDetail(await createForm(formRepository, { ownerId, definition: input })),
    duplicateOwnedForm: async (input) => toAdminFormDetail(await duplicateForm(formRepository, input)),
    readOwnedForm: async (input) => toAdminFormDetail(await readForm(formRepository, input)),
    saveOwnedDefinition: async (input) => toAdminFormDetail(await saveForm(formRepository, input)),
  };
}
