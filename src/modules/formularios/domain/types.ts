export type FormStatus = 'unpublished' | 'published';
export type DefinitionState = 'incomplete' | 'complete';

export type FormQuestionType = 'two-options' | 'likert';

export type FormAlternative = {
  id: string;
  label: string;
  score: number | null;
};

export type FormAuthor = {
  id: string;
  name: string;
  institution: string;
};

export type FormQuestion = {
  id: string;
  prompt: string;
  type: FormQuestionType;
  alternatives: FormAlternative[];
};

// minScore/maxScore are a percentage of the form's producible score range
// (0–100, closed-closed), not a raw score — e.g. { minScore: 0, maxScore: 33 }
// for "até 33%". See src/modules/instrumentos/domain/scoring.ts for how a
// raw score is normalized to this percentage and matched against these bands.
export type FormResultBand = {
  id: string;
  minScore: number | null;
  maxScore: number | null;
  risk: string;
  description: string;
};

export type FormDefinition = {
  schemaVersion: 1;
  title: string;
  description: string;
  imageDataUrl: string | null;
  authors: FormAuthor[];
  questions: FormQuestion[];
  resultBands: FormResultBand[];
};

export type FormDetail = FormListItem & {
  definition: FormDefinition;
};

export type FormListItem = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  status: FormStatus;
  definitionState: DefinitionState;
  createdAt: string;
  updatedAt: string;
  revision: number;
};

export type ListFormsInput = {
  ownerId: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type ListFormsResult = {
  items: FormListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicFormListItem = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  updatedAt: string;
};

export type PublicFormDetail = PublicFormListItem & {
  definition: FormDefinition;
  publishedRevision: number;
  publishedAt: string;
};

export type ListPublishedFormsInput = {
  search?: string;
  page: number;
  pageSize: number;
};

export type ListPublishedFormsResult = {
  items: PublicFormListItem[];
  total: number;
  publishedTotal: number;
  page: number;
  pageSize: number;
};
