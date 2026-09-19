import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/tela-avaliacao",
    permanent: true,
  },
});

export default function LegacyAssessmentLibraryRoute() {
  return null;
}
