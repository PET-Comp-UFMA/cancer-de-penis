import type { GetServerSideProps } from "next";
import type { FormDefinition } from "@/modules/instrumentos/domain/form-definitions";
import { getFormDefinition } from "@/modules/instrumentos/domain/form-definitions";
import FormInstanceHome from "@/modules/instrumentos/presentation/FormInstanceHome";

type FormHomePageProps = {
  form: FormDefinition;
};

export const getServerSideProps: GetServerSideProps<FormHomePageProps> = async ({ params }) => {
  const rawSlug = params?.catalogKey;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const form = slug ? getFormDefinition(slug) : undefined;

  if (!form) return { notFound: true };
  return { props: { form } };
};

export default function FormHomePage({ form }: FormHomePageProps) {
  return <FormInstanceHome form={form} />;
}
