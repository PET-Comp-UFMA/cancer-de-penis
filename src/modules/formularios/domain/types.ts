export type FormStatus = 'unpublished' | 'published';
export type DefinitionState = 'incomplete' | 'complete';

export type FormListItem = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  status: FormStatus;
  definitionState: DefinitionState;
  createdAt: string;
  updatedAt: string;
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
