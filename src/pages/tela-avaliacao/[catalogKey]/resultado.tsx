import { getPublicFormPageProps, type PublicFormPageProps } from "@/modules/instrumentos/server/public-form";
import FormResult from "@/modules/instrumentos/presentation/FormResult";

export const getServerSideProps = getPublicFormPageProps;

export default function FormResultPage({ form }: PublicFormPageProps) {
  return <FormResult form={form} />;
}
