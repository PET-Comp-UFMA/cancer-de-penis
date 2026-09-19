import type { GetServerSideProps } from "next";
import AdminHome from "@/modules/admin/presentation/AdminHome";
import { requireAdminPage } from "@/modules/auth/server/page-auth";

export const getServerSideProps: GetServerSideProps = async (context) =>
  requireAdminPage(context, { requiredRole: "admin" });

export default function AdminIndex() {
  return <AdminHome />;
}
