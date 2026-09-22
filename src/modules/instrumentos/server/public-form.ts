import { readPublicPublishedForm } from "@/modules/formularios/application/service";
import {
  getFormDefinition,
  toPublicDefinition,
  type FormDefinition,
} from "../domain/form-definitions";

export async function getServerPublicFormDefinition(catalogKey: string): Promise<FormDefinition | undefined> {
  const legacy = getFormDefinition(catalogKey);

  try {
    const published = await readPublicPublishedForm(catalogKey);
    // Migration 006 can create a metadata-only snapshot for legacy rows. Keep
    // the checked-in legacy instrument until an actual published definition exists.
    if (!Array.isArray(published.definition.questions)) return legacy;
    if (legacy && published.definition.questions.length === 0) return legacy;
    return toPublicDefinition({
      catalogKey: published.catalogKey,
      title: published.title,
      description: published.description,
      definition: published.definition,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORM_NOT_FOUND") return undefined;
    if (error instanceof Error && error.message === "FORM_NOT_PUBLISHED") return undefined;
    throw error;
  }
}
