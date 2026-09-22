import type { GetServerSideProps } from "next";
import { Box, Link, Typography } from "@mui/material";
import FormInstanceLayout from "@/modules/instrumentos/presentation/FormInstanceLayout";
import FormQuestionnaire from "@/modules/instrumentos/presentation/FormQuestionnaire";
import type { FormDefinition } from "@/modules/instrumentos/domain/form-definitions";
import { getFormBasePath } from "@/modules/instrumentos/domain/form-definitions";
import { getServerPublicFormDefinition } from "@/modules/instrumentos/server/public-form";

type FormularioPageProps = {
  form: FormDefinition;
};

export const getServerSideProps: GetServerSideProps<FormularioPageProps> = async ({ params }) => {
  const rawSlug = params?.catalogKey;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const form = slug ? await getServerPublicFormDefinition(slug) : undefined;

  if (!form) return { notFound: true };
  return { props: { form } };
};

export default function FormularioPage({ form }: FormularioPageProps) {
  return (
    <FormInstanceLayout form={form} pageTitle={`Questionário ${form.title}`}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 4, md: 6 },
          px: { xs: 2, md: 4 },
          py: { xs: 5, md: 6 },
          minHeight: 680,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            color: "#015D67",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <Link href={getFormBasePath(form)} underline="none" sx={{ color: "inherit" }}>
            Página Inicial
          </Link>
          <Typography component="span" sx={{ fontWeight: "inherit" }}>→</Typography>
          <Typography component="span" sx={{ textDecoration: "underline" }}>
            Formulário
          </Typography>
        </Box>

        <Typography
          component="h1"
          sx={{
            color: "#015D67",
            fontSize: { xs: 34, md: 46 },
            lineHeight: 1.15,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Questionário {form.title.toUpperCase()}
        </Typography>

        <FormQuestionnaire form={form} />
      </Box>
    </FormInstanceLayout>
  );
}
