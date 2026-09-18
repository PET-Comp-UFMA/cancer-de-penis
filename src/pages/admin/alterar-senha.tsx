import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import AuthLayout from "@/modules/auth/presentation/AuthLayout";
import ChangePasswordForm from "@/modules/auth/presentation/ChangePasswordForm";
import { requireAdminPage } from "@/modules/auth/server/page-auth";
export const getServerSideProps: GetServerSideProps = async (context) => requireAdminPage(context, { allowPasswordChange: true });
export default function ChangePasswordPage({}: InferGetServerSidePropsType<typeof getServerSideProps>) { return <AuthLayout title="Alterar senha"><ChangePasswordForm /></AuthLayout>; }
