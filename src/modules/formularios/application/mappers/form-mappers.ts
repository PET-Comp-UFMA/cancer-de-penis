import type {
  FormDefinition,
  FormDetail,
  FormListItem,
  ListFormsResult,
  ListPublishedFormsResult,
  PublicFormDetail,
  PublicFormListItem,
} from '../../domain/types';
import type {
  AdminFormDetailResponse,
  AdminFormListItemResponse,
  AdminFormListResponse,
  FormDefinitionResponse,
  PublicFormDetailResponse,
  PublicFormListItemResponse,
  PublicFormListResponse,
} from '../dto/form-responses';

export function toAdminFormListItem(item: FormListItem): AdminFormListItemResponse {
  return {
    id: item.id,
    catalogKey: item.catalogKey,
    title: item.title,
    description: item.description,
    status: item.status,
    definitionState: item.definitionState,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    revision: item.revision,
    everPublished: item.everPublished,
  };
}

export function toAdminFormDetail(detail: FormDetail): AdminFormDetailResponse {
  return { ...toAdminFormListItem(detail), definition: toFormDefinition(detail.definition) };
}

export function toAdminFormList(result: ListFormsResult): AdminFormListResponse {
  return {
    items: result.items.map(toAdminFormListItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  };
}

export function toPublicFormListItem(item: PublicFormListItem): PublicFormListItemResponse {
  return {
    id: item.id,
    catalogKey: item.catalogKey,
    title: item.title,
    description: item.description,
    updatedAt: item.updatedAt,
  };
}

export function toPublicFormDetail(detail: PublicFormDetail): PublicFormDetailResponse {
  return {
    ...toPublicFormListItem(detail),
    definition: toFormDefinition(detail.definition),
    publishedRevision: detail.publishedRevision,
    publishedAt: detail.publishedAt,
  };
}

export function toPublicFormList(result: ListPublishedFormsResult): PublicFormListResponse {
  return {
    items: result.items.map(toPublicFormListItem),
    total: result.total,
    publishedTotal: result.publishedTotal,
    page: result.page,
    pageSize: result.pageSize,
  };
}

function toFormDefinition(definition: FormDefinition): FormDefinitionResponse {
  return {
    schemaVersion: definition.schemaVersion,
    title: definition.title,
    description: definition.description,
    imageDataUrl: definition.imageDataUrl,
    authors: definition.authors.map((author) => {
      const mapped = {
        id: author.id,
        name: author.name,
        institution: author.institution,
      };
      return author.imageDataUrl === undefined
        ? mapped
        : { ...mapped, imageDataUrl: author.imageDataUrl };
    }),
    questions: definition.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      type: question.type,
      alternatives: question.alternatives.map((alternative) => ({
        id: alternative.id,
        label: alternative.label,
        score: alternative.score,
      })),
    })),
    resultBands: definition.resultBands.map((band) => ({
      id: band.id,
      minScore: band.minScore,
      maxScore: band.maxScore,
      risk: band.risk,
      description: band.description,
    })),
  };
}
