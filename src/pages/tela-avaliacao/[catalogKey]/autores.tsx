import { getPublicFormPageProps, type PublicFormPageProps } from "@/modules/instrumentos/server/public-form";
import FormAuthors from "@/modules/instrumentos/presentation/FormAuthors";

export const getServerSideProps = getPublicFormPageProps;

export default function FormAuthorsPage({ form }: PublicFormPageProps) {
  return <FormAuthors form={form} />;
}
