import type { GetServerSideProps } from "next";
import { Box, Link, Typography } from "@mui/material";
import FormInstanceLayout from "@/modules/instrumentos/presentation/FormInstanceLayout";
import FormQuestionnaire from "@/modules/instrumentos/presentation/FormQuestionnaire";
import type { FormDefinition } from "@/modules/instrumentos/domain/form-definitions";
import { getServerPublicFormDefinition } from "@/modules/instrumentos/server/public-form";

type FormularioPageProps = { form: FormDefinition };

export const getServerSideProps: GetServerSideProps<FormularioPageProps> = async ({ params }) => {
  const rawSlug = params?.catalogKey;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const form = slug ? await getServerPublicFormDefinition(slug) : undefined;
  if (!form) return { notFound: true };
  return { props: { form } };
};

export default function FormularioPage({ form }: FormularioPageProps) {
  return <FormInstanceLayout form={form} pageTitle={`Questionário ${form.title}`}>
    <Box sx={{ width: "100%", maxWidth: 1216, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 5, md: 7 }, minHeight: 680 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, color: "#015D67", fontSize: { xs: 13, md: 20 }, fontWeight: 700, mb: { xs: 4, md: 6 } }}>
        <Link href="/" underline="none" sx={{ color: "inherit" }}>Página Inicial</Link>
        <Typography component="span" sx={{ color: "#00ACB1" }}>→</Typography>
        <Link href="/tela-avaliacao" underline="none" sx={{ color: "inherit" }}>Avaliação de Risco</Link>
        <Typography component="span" sx={{ color: "#00ACB1" }}>→</Typography>
        <Typography component="span" sx={{ color: "#1F6C75" }}>{form.title.toUpperCase()}</Typography>
      </Box>
      <Typography component="h1" sx={{ color: "#1F6C75", fontSize: { xs: 30, md: 46 }, lineHeight: 1.15, fontWeight: 700, mb: { xs: 5, md: 7 }, textAlign: "center" }}>
        Questionário {form.title.toUpperCase()}
      </Typography>
      <FormQuestionnaire form={form} />
    </Box>
  </FormInstanceLayout>;
}
