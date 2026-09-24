import { getPublicFormPageProps, type PublicFormPageProps } from "@/modules/instrumentos/server/public-form";
import { AdminPreviewProvider } from "@/modules/instrumentos/presentation/AdminPreviewContext";
import FormAuthors from "@/modules/instrumentos/presentation/FormAuthors";

export const getServerSideProps = getPublicFormPageProps;

export default function FormAuthorsPage({ form, adminPreview }: PublicFormPageProps) {
  return <AdminPreviewProvider value={adminPreview}><FormAuthors form={form} /></AdminPreviewProvider>;
}
