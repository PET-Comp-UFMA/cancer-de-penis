import { getPublicFormPageProps, type PublicFormPageProps } from "@/modules/instrumentos/server/public-form";
import FormInstanceHome from "@/modules/instrumentos/presentation/FormInstanceHome";

export const getServerSideProps = getPublicFormPageProps;

export default function FormHomePage({ form }: PublicFormPageProps) {
  return <FormInstanceHome form={form} />;
}
