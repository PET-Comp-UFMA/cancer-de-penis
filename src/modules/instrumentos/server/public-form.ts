import type { GetServerSideProps } from "next";
import { readPublicPublishedForm } from "@/modules/formularios/server/service";
import { hasAdminSession } from "@/modules/auth/server/page-auth";
import { toPublicDefinition, type FormDefinition } from "../domain/form-definitions";

export type PublicFormPageProps = { form: FormDefinition; adminPreview: boolean; publishedRevision: number };

export async function getServerPublicFormDefinition(catalogKey: string): Promise<{ form: FormDefinition; publishedRevision: number } | undefined> {
  try {
    const published = await readPublicPublishedForm(catalogKey);
    return { form: toPublicDefinition({
      catalogKey: published.catalogKey,
      title: published.title,
      description: published.description,
      definition: published.definition,
    }), publishedRevision: published.publishedRevision };
  } catch (error) {
    if (error instanceof Error && error.message === "FORM_NOT_FOUND") return undefined;
    if (error instanceof Error && error.message === "FORM_NOT_PUBLISHED") return undefined;
    throw error;
  }
}

export const getPublicFormPageProps: GetServerSideProps<PublicFormPageProps> = async ({ params, req }) => {
  const rawSlug = params?.catalogKey;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const published = slug ? await getServerPublicFormDefinition(slug) : undefined;
  if (!published) return { notFound: true };
  return { props: { form: published.form, publishedRevision: published.publishedRevision, adminPreview: await hasAdminSession(req) } };
};
