import { getPublicFormPageProps, type PublicFormPageProps } from "@/modules/instrumentos/server/public-form";
import { AdminPreviewProvider } from "@/modules/instrumentos/presentation/AdminPreviewContext";
import FormInstanceHome from "@/modules/instrumentos/presentation/FormInstanceHome";

export const getServerSideProps = getPublicFormPageProps;

export default function FormHomePage({ form, adminPreview }: PublicFormPageProps) {
  return <AdminPreviewProvider value={adminPreview}><FormInstanceHome form={form} /></AdminPreviewProvider>;
}
