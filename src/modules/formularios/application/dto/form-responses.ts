import type { FormStatus, DefinitionState } from '../../domain/types';

export type FormDefinitionResponse = {
  schemaVersion: 1;
  title: string;
  description: string;
  imageDataUrl: string | null;
  authors: Array<{ id: string; name: string; institution: string; imageDataUrl?: string | null }>;
  questions: Array<{
    id: string;
    prompt: string;
    type: 'two-options' | 'likert';
    alternatives: Array<{ id: string; label: string; score: number | null }>;
  }>;
  resultBands: Array<{ id: string; minScore: number | null; maxScore: number | null; risk: string; description: string }>;
  dimensions?: Array<{
    id: string; name: string; description: string;
    questions: FormDefinitionResponse['questions'];
    resultBands: FormDefinitionResponse['resultBands'];
  }>;
};

export type AdminFormListItemResponse = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  status: FormStatus;
  definitionState: DefinitionState;
  createdAt: string;
  updatedAt: string;
  revision: number;
  everPublished: boolean;
};

export type AdminFormDetailResponse = AdminFormListItemResponse & { definition: FormDefinitionResponse };
export type AdminFormListResponse = {
  items: AdminFormListItemResponse[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicFormListItemResponse = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  updatedAt: string;
};

export type PublicFormDetailResponse = PublicFormListItemResponse & {
  definition: FormDefinitionResponse;
  publishedRevision: number;
  publishedAt: string;
};
export type PublicFormListResponse = {
  items: PublicFormListItemResponse[];
  total: number;
  publishedTotal: number;
  page: number;
  pageSize: number;
};
