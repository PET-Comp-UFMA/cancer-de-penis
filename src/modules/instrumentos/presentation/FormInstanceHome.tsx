import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Box, Button, Typography } from "@mui/material";
import type { FormDefinition } from "../domain/form-definitions";
import { getFormQuestionnairePath } from "../domain/form-definitions";
import FormInstanceLayout from "./FormInstanceLayout";

type FormInstanceHomeProps = {
  form: FormDefinition;
};

export default function FormInstanceHome({ form }: FormInstanceHomeProps) {
  return (
    <FormInstanceLayout form={form} pageTitle={`${form.title} - Câncer de Pênis`}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          minHeight: { xs: 600, md: 662 },
          maxWidth: 1440,
          mx: "auto",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 9px rgba(0,0,0,0.16)",
        }}
      >
        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            top: 0,
            left: 0,
            width: { xs: "100%", md: "54%" },
            height: { xs: 300, md: "100%" },
            flexShrink: 0,
            overflow: "hidden",
            clipPath: {
              xs: "none",
              md: "ellipse(86% 90% at 5% 50%)",
            },
          }}
        >
          <Box
            component="img"
            src={form.heroImage}
            alt={`Imagem de apresentação do ${form.title}`}
            sx={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
        </Box>

        <Box
          sx={{
            position: { xs: "relative", md: "absolute" },
            zIndex: 1,
            top: { md: "50%" },
            right: { md: "8%" },
            transform: { md: "translateY(-50%)" },
            width: { xs: "100%", md: "45%" },
            px: { xs: 3, md: 0 },
            py: { xs: 5, md: 0 },
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "center", md: "flex-start" },
            textAlign: { xs: "center", md: "left" },
          }}
        >
          <Typography
            sx={{
              color: "#00ACB1",
              fontSize: { xs: 18, md: 22 },
              lineHeight: 1.25,
              fontWeight: 700,
              mb: 1,
            }}
          >
            Avaliação e Saúde
          </Typography>
          <Typography
            component="h1"
            sx={{
              color: "#015D67",
              fontSize: { xs: 52, sm: 62, md: 70 },
              lineHeight: 1.05,
              fontWeight: 700,
              mb: 1,
            }}
          >
            {form.title}
          </Typography>
          <Typography
            sx={{
              color: "#454D5D",
              fontSize: { xs: 15, md: 17 },
              lineHeight: 1.65,
              maxWidth: 610,
              mb: 2,
            }}
          >
            {form.description}
          </Typography>
          <Button
            variant="contained"
            href={getFormQuestionnairePath(form)}
            startIcon={<ArrowForwardRoundedIcon />}
            sx={{
              bgcolor: "#00ACB1",
              color: "#FAFCFC",
              borderRadius: 2,
              px: 2.5,
              py: 1.1,
              textTransform: "none",
              fontSize: 16,
              fontWeight: 600,
              "&:hover": { bgcolor: "#008E93" },
            }}
          >
            Iniciar
          </Button>
        </Box>
      </Box>
    </FormInstanceLayout>
  );
}
