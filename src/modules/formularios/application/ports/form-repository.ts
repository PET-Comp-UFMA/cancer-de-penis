import type {
  DefinitionState,
  FormDefinition,
  FormDetail,
  FormListItem,
  FormStatus,
  ListFormsResult,
} from '../../domain/types';

export interface FormRepository {
  listOwned(ownerId: string, search: string, page: number, pageSize: number): Promise<ListFormsResult>;
  create(ownerId: string, catalogKey: string, definition: FormDefinition, state: DefinitionState): Promise<FormDetail>;
  getOwned(ownerId: string, formId: string): Promise<FormDetail>;
  updateDefinition(
    ownerId: string,
    formId: string,
    definition: FormDefinition,
    expectedRevision: number,
    state: DefinitionState,
  ): Promise<FormDetail>;
  updateStatus(ownerId: string, formId: string, status: FormStatus, expectedRevision: number): Promise<FormListItem>;
  deleteOwned(ownerId: string, formId: string): Promise<void>;
}
