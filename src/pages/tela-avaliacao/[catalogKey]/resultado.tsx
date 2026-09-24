import { getPublicFormPageProps, type PublicFormPageProps } from "@/modules/instrumentos/server/public-form";
import { AdminPreviewProvider } from "@/modules/instrumentos/presentation/AdminPreviewContext";
import FormResult from "@/modules/instrumentos/presentation/FormResult";

export const getServerSideProps = getPublicFormPageProps;

export default function FormResultPage({ form, adminPreview }: PublicFormPageProps) {
  return <AdminPreviewProvider value={adminPreview}><FormResult form={form} /></AdminPreviewProvider>;
}
