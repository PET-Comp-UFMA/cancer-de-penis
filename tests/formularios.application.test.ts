import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFormApplication } from '../src/modules/formularios/application/service';
import type { FormRepository } from '../src/modules/formularios/application/ports/form-repository';
import type { PublishedFormReader } from '../src/modules/formularios/application/ports/published-form-reader';
import type { FormDefinition, FormDetail, FormListItem, PublicFormDetail } from '../src/modules/formularios/domain/types';
import { toPublicFormDetail } from '../src/modules/formularios/application/mappers/form-mappers';

const definition: FormDefinition = {
  schemaVersion: 1,
  title: 'Formulário fake',
  description: 'Teste',
  imageDataUrl: null,
  authors: [],
  questions: [],
  resultBands: [],
};

const listItem: FormListItem = {
  id: 'form-1', catalogKey: 'FORM-1', title: definition.title, description: definition.description,
  status: 'published', definitionState: 'complete', createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z', revision: 1, everPublished: true,
};

const detail: FormDetail = { ...listItem, definition };
const publicDetail: PublicFormDetail = {
  id: listItem.id, catalogKey: listItem.catalogKey, title: definition.title, description: definition.description,
  updatedAt: listItem.updatedAt, definition, publishedRevision: 1, publishedAt: listItem.updatedAt,
};

const ownerId = '11111111-1111-4111-8111-111111111111';
const formId = '22222222-2222-4222-8222-222222222222';

function fakeRepository(): FormRepository {
  return {
    listOwned: async () => ({ items: [listItem], total: 1, page: 1, pageSize: 10 }),
    create: async () => detail,
    getOwned: async () => detail,
    updateDefinition: async () => detail,
    updateStatus: async () => listItem,
    deleteOwned: async () => undefined,
  };
}

function fakePublishedReader(): PublishedFormReader {
  return {
    list: async () => ({ items: [publicDetail], total: 1, publishedTotal: 1, page: 1, pageSize: 10 }),
    read: async () => publicDetail,
  };
}

function observableRepository() {
  const calls: string[] = [];
  const repository: FormRepository = {
    listOwned: async () => ({ items: [], total: 0, page: 1, pageSize: 10 }),
    create: async (...args) => { calls.push(`create:${args[0]}`); return detail; },
    getOwned: async (...args) => { calls.push(`getOwned:${args.join(':')}`); return detail; },
    updateDefinition: async (...args) => { calls.push(`updateDefinition:${args[0]}:${args[1]}:${args[3]}`); return detail; },
    updateStatus: async (...args) => { calls.push(`updateStatus:${args.join(':')}`); return listItem; },
    deleteOwned: async (...args) => { calls.push(`deleteOwned:${args.join(':')}`); },
  };
  return { repository, calls };
}

test('createFormApplication usa as dependências injetadas para leitura administrativa e pública', async () => {
  const application = createFormApplication({
    formRepository: fakeRepository(),
    publishedFormReader: fakePublishedReader(),
  });

  const owned = await application.listOwnedForms({ ownerId: 'owner', page: 1, pageSize: 10 });
  assert.deepEqual(owned.items, [listItem]);

  const published = await application.listPublicPublishedForms({ page: 1, pageSize: 10 });
  assert.deepEqual(published.items, [{
    id: publicDetail.id,
    catalogKey: publicDetail.catalogKey,
    title: publicDetail.title,
    description: publicDetail.description,
    updatedAt: publicDetail.updatedAt,
  }]);
  assert.deepEqual(await application.readPublicPublishedForm('FORM-1'), publicDetail);
});

test('createFormApplication encaminha criação, leitura, salvamento, publicação, despublicação, duplicação e exclusão', async () => {
  const { repository, calls } = observableRepository();
  const application = createFormApplication({ formRepository: repository, publishedFormReader: fakePublishedReader() });

  await application.createOwnedForm(ownerId, definition);
  await application.readOwnedForm({ ownerId, formId });
  await application.saveOwnedDefinition({ ownerId, formId, definition, expectedRevision: 0 });
  await application.setOwnedFormStatus({ ownerId, formId, status: 'published', expectedRevision: 1 });
  await application.setOwnedFormStatus({ ownerId, formId, status: 'unpublished', expectedRevision: 1 });
  await application.duplicateOwnedForm({ ownerId, formId });
  await application.removeOwnedForm({ ownerId, formId });

  assert.equal(calls.filter((call) => call.startsWith('create:')).length, 2);
  assert.ok(calls.includes(`getOwned:${ownerId}:${formId}`));
  assert.ok(calls.includes(`updateDefinition:${ownerId}:${formId}:0`));
  assert.ok(calls.includes(`updateStatus:${ownerId}:${formId}:published:1`));
  assert.ok(calls.includes(`updateStatus:${ownerId}:${formId}:unpublished:1`));
  assert.ok(calls.includes(`deleteOwned:${ownerId}:${formId}`));
});

test('os comandos da fachada preservam a validação de entrada antes do repository', async () => {
  const { repository, calls } = observableRepository();
  const application = createFormApplication({ formRepository: repository, publishedFormReader: fakePublishedReader() });

  await assert.rejects(() => application.createOwnedForm('owner-invalido', definition), /INVALID_REQUEST/);
  await assert.rejects(() => application.readOwnedForm({ ownerId, formId: 'form-invalido' }), /INVALID_REQUEST/);
  await assert.rejects(() => application.saveOwnedDefinition({ ownerId, formId, definition, expectedRevision: -1 }), /INVALID_REQUEST/);
  await assert.rejects(() => application.setOwnedFormStatus({ ownerId, formId, status: 'published', expectedRevision: -1 }), /INVALID_REQUEST/);
  await assert.rejects(() => application.setOwnedFormStatus({ ownerId, formId, status: 'invalid' as never, expectedRevision: 0 }), /INVALID_REQUEST/);
  await assert.rejects(() => application.duplicateOwnedForm({ ownerId, formId: 'form-invalido' }), /INVALID_REQUEST/);
  await assert.rejects(() => application.removeOwnedForm({ ownerId, formId: 'form-invalido' }), /INVALID_REQUEST/);
  assert.deepEqual(calls, []);
});

test('mapeador público restringe campos extras também na definição aninhada', () => {
  const withExtras = {
    ...publicDetail,
    owner_id: 'não deve sair',
    definition: {
      ...publicDetail.definition,
      internal: 'não deve sair',
      authors: [{ id: 'author-1', name: 'Autora', institution: 'Local', owner_id: 'não deve sair' }],
      questions: [{
        id: 'question-1', prompt: 'Pergunta', type: 'two-options', owner_id: 'não deve sair',
        alternatives: [{ id: 'alternative-1', label: 'Sim', score: 1, internal: 'não deve sair' }, { id: 'alternative-2', label: 'Não', score: 0 }],
      }],
      resultBands: [{ id: 'band-1', minScore: 0, maxScore: 100, risk: 'Baixo', description: 'Descrição', internal: 'não deve sair' }],
    },
  } as unknown as PublicFormDetail;

  const mapped = toPublicFormDetail(withExtras);
  assert.deepEqual(Object.keys(mapped), ['id', 'catalogKey', 'title', 'description', 'updatedAt', 'definition', 'publishedRevision', 'publishedAt']);
  assert.deepEqual(Object.keys(mapped.definition), ['schemaVersion', 'title', 'description', 'imageDataUrl', 'authors', 'questions', 'resultBands']);
  assert.deepEqual(Object.keys(mapped.definition.authors[0]), ['id', 'name', 'institution']);
  assert.deepEqual(Object.keys(mapped.definition.questions[0]), ['id', 'prompt', 'type', 'alternatives']);
  assert.deepEqual(Object.keys(mapped.definition.questions[0].alternatives[0]), ['id', 'label', 'score']);
  assert.deepEqual(Object.keys(mapped.definition.resultBands[0]), ['id', 'minScore', 'maxScore', 'risk', 'description']);
});
