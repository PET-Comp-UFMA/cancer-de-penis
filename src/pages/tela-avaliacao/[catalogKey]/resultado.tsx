import type { GetServerSideProps } from "next";
import type { FormDefinition } from "@/modules/instrumentos/domain/form-definitions";
import { getFormDefinition } from "@/modules/instrumentos/domain/form-definitions";
import FormResult from "@/modules/instrumentos/presentation/FormResult";

type FormResultPageProps = {
  form: FormDefinition;
};

export const getServerSideProps: GetServerSideProps<FormResultPageProps> = async ({ params }) => {
  const rawSlug = params?.catalogKey;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const form = slug ? getFormDefinition(slug) : undefined;

  if (!form) return { notFound: true };
  return { props: { form } };
};

export default function FormResultPage({ form }: FormResultPageProps) {
  return <FormResult form={form} />;
}
