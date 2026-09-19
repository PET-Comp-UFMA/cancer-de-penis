import { Box, Container, Link, Typography } from "@mui/material";
import type { FormDefinition } from "../domain/form-definitions";
import { getFormBasePath } from "../domain/form-definitions";
import AuthorsGrid from "@/modules/autores/presentation/AuthorsGrid";
import FormInstanceLayout from "./FormInstanceLayout";

type FormAuthorsProps = {
  form: FormDefinition;
};

export default function FormAuthors({ form }: FormAuthorsProps) {
  return (
    <FormInstanceLayout form={form} pageTitle={`Autores - ${form.title}`}>
      <Box sx={{ bgcolor: "#FFFFFF", px: { xs: 2, md: 4 }, py: { xs: 5, md: 6 }, minHeight: 720 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              color: "#015D67",
              fontSize: 16,
              fontWeight: 700,
              mb: { xs: 4, md: 5 },
            }}
          >
            <Link href={getFormBasePath(form)} underline="none" sx={{ color: "inherit" }}>
              Página Inicial
            </Link>
            <Typography component="span" sx={{ fontWeight: "inherit" }}>→</Typography>
            <Typography component="span" sx={{ textDecoration: "underline" }}>
              Autores
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              color: "#015D67",
              textAlign: "center",
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "3rem" },
              lineHeight: 1.2,
              mb: { xs: 5, md: 6 },
            }}
          >
            Autores do Trabalho
          </Typography>

          <AuthorsGrid authors={form.authors} />
        </Container>
      </Box>
    </FormInstanceLayout>
  );
}
