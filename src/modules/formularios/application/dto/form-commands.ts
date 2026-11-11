import type { FormStatus } from '../../domain/types';

export type ListOwnedFormsCommand = {
  ownerId: string;
  search?: string;
  page: number;
  pageSize: number;
};
export type ListPublishedFormsCommand = {
  search?: string;
  page: number;
  pageSize: number;
};
export type CreateFormCommand = { ownerId: string; definition?: unknown };
export type ReadFormCommand = { ownerId: string; formId: string };
export type ReadPublishedFormCommand = { catalogKey: string };
export type SaveFormCommand = {
  ownerId: string;
  formId: string;
  definition: unknown;
  expectedRevision: unknown;
};
export type ChangeFormStatusCommand = {
  ownerId: string;
  formId: string;
  status: FormStatus;
  expectedRevision: unknown;
};
export type DuplicateFormCommand = { ownerId: string; formId: string };
export type DeleteFormCommand = { ownerId: string; formId: string };
