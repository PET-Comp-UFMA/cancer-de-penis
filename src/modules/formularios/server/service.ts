import { createFormApplication } from '../application/service';
import {
  postgresFormRepository,
  postgresPublishedFormReader,
} from '../infrastructure/repository';

const formApplication = createFormApplication({
  formRepository: postgresFormRepository,
  publishedFormReader: postgresPublishedFormReader,
});

export const {
  listOwnedForms,
  listPublicPublishedForms,
  readPublicPublishedForm,
  setOwnedFormStatus,
  removeOwnedForm,
  createOwnedForm,
  duplicateOwnedForm,
  readOwnedForm,
  saveOwnedDefinition,
} = formApplication;
