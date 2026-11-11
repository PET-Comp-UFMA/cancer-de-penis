import { randomUUID } from 'node:crypto';
import { definitionState } from '../../domain/completeness';
import { emptyFormDefinition, validateFormDefinition } from '../../domain/definition';
import { TEXT_LIMITS } from '../../domain/limits';
import type { FormRepository } from '../ports/form-repository';
import type { PublishedFormReader } from '../ports/published-form-reader';
import type {
  ChangeFormStatusCommand,
  CreateFormCommand,
  DeleteFormCommand,
  DuplicateFormCommand,
  ReadPublishedFormCommand,
  ReadFormCommand,
  SaveFormCommand,
} from '../dto/form-commands';
import type { FormDetail, FormListItem, PublicFormDetail } from '../../domain/types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateOwnerAndForm(input: { ownerId: string; formId: string }): void {
  if (!UUID_PATTERN.test(input.ownerId) || !UUID_PATTERN.test(input.formId)) throw new Error('INVALID_REQUEST');
}

export async function createForm(repository: FormRepository, command: CreateFormCommand): Promise<FormDetail> {
  if (!UUID_PATTERN.test(command.ownerId)) throw new Error('INVALID_REQUEST');
  const definition = command.definition === undefined ? emptyFormDefinition() : validateFormDefinition(command.definition);
  return repository.create(command.ownerId, `FORM-${randomUUID().replaceAll('-', '').toUpperCase()}`, definition, definitionState(definition));
}

export async function readForm(repository: FormRepository, command: ReadFormCommand): Promise<FormDetail> {
  validateOwnerAndForm(command);
  return repository.getOwned(command.ownerId, command.formId);
}

export async function readPublishedForm(
  reader: PublishedFormReader,
  command: ReadPublishedFormCommand,
): Promise<PublicFormDetail> {
  if (typeof command.catalogKey !== 'string' || command.catalogKey.length === 0 || command.catalogKey.length > 200) {
    throw new Error('INVALID_REQUEST');
  }
  return reader.read(command.catalogKey);
}

export async function saveForm(repository: FormRepository, command: SaveFormCommand): Promise<FormDetail> {
  if (!UUID_PATTERN.test(command.ownerId) || !UUID_PATTERN.test(command.formId)
    || !Number.isSafeInteger(command.expectedRevision) || (command.expectedRevision as number) < 0) {
    throw new Error('INVALID_REQUEST');
  }
  const definition = validateFormDefinition(command.definition);
  return repository.updateDefinition(command.ownerId, command.formId, definition, command.expectedRevision as number, definitionState(definition));
}

export async function changeFormStatus(repository: FormRepository, command: ChangeFormStatusCommand): Promise<FormListItem> {
  if (!UUID_PATTERN.test(command.ownerId) || !UUID_PATTERN.test(command.formId)
    || !['unpublished', 'published'].includes(command.status)
    || !Number.isSafeInteger(command.expectedRevision) || (command.expectedRevision as number) < 0) {
    throw new Error('INVALID_REQUEST');
  }
  return repository.updateStatus(command.ownerId, command.formId, command.status, command.expectedRevision as number);
}

export async function publishForm(repository: FormRepository, command: Omit<ChangeFormStatusCommand, 'status'>): Promise<FormListItem> {
  return changeFormStatus(repository, { ...command, status: 'published' });
}

export async function unpublishForm(repository: FormRepository, command: Omit<ChangeFormStatusCommand, 'status'>): Promise<FormListItem> {
  return changeFormStatus(repository, { ...command, status: 'unpublished' });
}

export async function duplicateForm(repository: FormRepository, command: DuplicateFormCommand): Promise<FormDetail> {
  validateOwnerAndForm(command);
  const source = await repository.getOwned(command.ownerId, command.formId);
  const suffix = ' (cópia)';
  const title = `${(source.definition.title || source.title).slice(0, TEXT_LIMITS.title - suffix.length).trimEnd()}${suffix}`;
  const definition = validateFormDefinition({ ...source.definition, title });
  return repository.create(command.ownerId, `FORM-${randomUUID().replaceAll('-', '').toUpperCase()}`, definition, definitionState(definition));
}

export async function deleteForm(repository: FormRepository, command: DeleteFormCommand): Promise<void> {
  validateOwnerAndForm(command);
  return repository.deleteOwned(command.ownerId, command.formId);
}
