import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import FormEditor from "@/modules/formularios/presentation/FormEditor";
import { requireAdminPage } from "@/modules/auth/server/page-auth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const result = await requireAdminPage(context, { requiredRole: "admin" });
  if ("props" in result) return { props: { ...result.props, formId: String(context.params?.id ?? "") } };
  return result;
};

export default function EditFormPage({ user, formId }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <FormEditor formId={formId} user={user} />;
}
