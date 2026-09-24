import type { GetServerSideProps } from "next";
import { readPublicPublishedForm } from "@/modules/formularios/application/service";
import { findSession } from "@/modules/auth/infrastructure/repository";
import { requestToken } from "@/modules/auth/server/cookies";
import { toPublicDefinition, type FormDefinition } from "../domain/form-definitions";

export type PublicFormPageProps = { form: FormDefinition; adminPreview: boolean };

export async function getServerPublicFormDefinition(catalogKey: string): Promise<FormDefinition | undefined> {
  try {
    const published = await readPublicPublishedForm(catalogKey);
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

// Lets a logged-in admin previewing a public form jump back to the panel.
// Anonymous visitors carry no session cookie, so no lookup happens for them.
async function hasAdminSession(req: Parameters<typeof requestToken>[0]) {
  const token = requestToken(req);
  if (!token) return false;
  try {
    const session = await findSession(token);
    return Boolean(session?.user.roles.some((role) => role === "admin" || role === "responsavel"));
  } catch {
    return false;
  }
}

export const getPublicFormPageProps: GetServerSideProps<PublicFormPageProps> = async ({ params, req }) => {
  const rawSlug = params?.catalogKey;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const form = slug ? await getServerPublicFormDefinition(slug) : undefined;
  if (!form) return { notFound: true };
  return { props: { form, adminPreview: await hasAdminSession(req) } };
};
