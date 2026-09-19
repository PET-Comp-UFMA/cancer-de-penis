import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import FormsHome from "@/modules/formularios/presentation/FormsHome";
import { requireAdminPage } from "@/modules/auth/server/page-auth";

export const getServerSideProps: GetServerSideProps = async (context) => requireAdminPage(context, { requiredRole: "admin" });

export default function FormsPage({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <FormsHome user={user} />;
}
