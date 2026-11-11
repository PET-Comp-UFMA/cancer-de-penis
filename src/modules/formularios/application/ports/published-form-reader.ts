import type { ListPublishedFormsResult, PublicFormDetail } from '../../domain/types';

export interface PublishedFormReader {
  list(search: string, page: number, pageSize: number): Promise<ListPublishedFormsResult>;
  read(catalogKey: string): Promise<PublicFormDetail>;
}
