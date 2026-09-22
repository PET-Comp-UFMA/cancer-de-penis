import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import FormEditor from "@/modules/formularios/presentation/FormEditor";
import { requireAdminPage } from "@/modules/auth/server/page-auth";

export const getServerSideProps: GetServerSideProps = async (context) => requireAdminPage(context, { requiredRole: "admin" });

export default function NewFormPage({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <FormEditor user={user} />;
}
