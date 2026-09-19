import { Alert, Box, Button, Link, Typography } from "@mui/material";
import type { FormDefinition } from "../domain/form-definitions";
import {
  getFormBasePath,
  getFormQuestionnairePath,
} from "../domain/form-definitions";
import FormInstanceLayout from "./FormInstanceLayout";

type FormResultProps = {
  form: FormDefinition;
};

export default function FormResult({ form }: FormResultProps) {
  return (
    <FormInstanceLayout form={form} pageTitle={`Resultado - ${form.title}`}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 5,
          px: 2,
          py: { xs: 6, md: 9 },
          minHeight: 520,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "#015D67",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <Link href={getFormBasePath(form)} underline="none" sx={{ color: "inherit" }}>
            Página Inicial
          </Link>
          <Typography component="span">→</Typography>
          <Typography component="span" sx={{ textDecoration: "underline" }}>
            Resultado
          </Typography>
        </Box>

        <Typography
          component="h1"
          sx={{ color: "#015D67", fontSize: { xs: 34, md: 46 }, fontWeight: 700, textAlign: "center" }}
        >
          Resultado {form.title.toUpperCase()}
        </Typography>

        <Box sx={{ width: "100%", maxWidth: 640 }}>
          <Alert severity="info">
            A tela está vinculada à instância correta do formulário. O cálculo e a interpretação clínica deste instrumento ainda não estão disponíveis nesta base.
          </Alert>
          <Button
            href={getFormQuestionnairePath(form)}
            variant="contained"
            sx={{ mt: 3, bgcolor: "#015D67", textTransform: "none", borderRadius: 2 }}
          >
            Voltar ao formulário
          </Button>
        </Box>
      </Box>
    </FormInstanceLayout>
  );
}
