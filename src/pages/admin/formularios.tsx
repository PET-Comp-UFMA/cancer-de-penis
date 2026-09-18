import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import FormsHome from "@/modules/auth/presentation/FormsHome";
import { requireAdminPage } from "@/modules/auth/server/page-auth";
export const getServerSideProps: GetServerSideProps = async (context) => requireAdminPage(context);
export default function FormsPage({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) { return <FormsHome user={user} />; }
