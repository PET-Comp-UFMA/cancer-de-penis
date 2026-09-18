import type { GetServerSideProps } from "next";
export const getServerSideProps: GetServerSideProps = async () => ({ redirect: { destination: "/admin/formularios", permanent: false } });
export default function AdminIndex() { return null; }
