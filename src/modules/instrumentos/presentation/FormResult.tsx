"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Link, Typography } from "@mui/material";
import type { FormDefinition, FormResultBand } from "../domain/form-definitions";
import {
  getFormBasePath,
  getFormQuestionnairePath,
} from "../domain/form-definitions";
import { isScorable } from "../domain/scoring";
import { useScoringSession } from "./ScoringSessionContext";
import FormInstanceLayout from "./FormInstanceLayout";
import RiskGauge from "./RiskGauge";

type FormResultProps = {
  form: FormDefinition;
};

type ResultView =
  | { kind: "not-scorable" }
  | { kind: "no-session" }
  | { kind: "error" }
  | { kind: "result"; score: number; band: FormResultBand; percentage: number };

export default function FormResult({ form }: FormResultProps) {
  const { takeResult } = useScoringSession();
  const [view, setView] = useState<ResultView | null>(null);
  // takeResult is a one-time, destructive read (see ScoringSessionContext).
  // Guard against React StrictMode's dev-only double-invoke of effects,
  // which would otherwise consume the session on the first pass and find it
  // already gone on the second — this ref persists across that double
  // invoke (the component instance itself isn't remounted), but starts
  // fresh on any genuine later remount, so real read-once semantics hold.
  const consumedRef = useRef(false);

  useEffect(() => {
    if (!isScorable(form)) {
      setView({ kind: "not-scorable" });
      return;
    }
    if (consumedRef.current) return;
    consumedRef.current = true;
    const session = takeResult(form.catalogKey);
    if (!session) {
      setView({ kind: "no-session" });
    } else if (session.status === "error") {
      setView({ kind: "error" });
    } else {
      setView({ kind: "result", score: session.score, band: session.band, percentage: session.percentage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.catalogKey]);

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
          {(view === null || view.kind === "not-scorable") && (
            <Alert severity="info">
              A tela está vinculada à instância correta do formulário. O cálculo e a interpretação clínica deste instrumento ainda não estão disponíveis nesta base.
            </Alert>
          )}
          {view?.kind === "no-session" && (
            <Alert severity="warning">
              Não encontramos respostas para exibir um resultado. Responda o questionário para ver seu resultado.
            </Alert>
          )}
          {view?.kind === "error" && (
            <Alert severity="error">
              Não foi possível calcular seu resultado. Responda o questionário novamente.
            </Alert>
          )}
          {view?.kind === "result" && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <Box
                sx={{
                  bgcolor: "#E1F5E4",
                  border: "1.5px solid #8BC48B",
                  borderRadius: 2,
                  px: 2.5,
                  py: 1.5,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                <Typography component="p" sx={{ color: "#0F3C3E", fontSize: 15 }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {view.band.risk}.
                  </Box>{" "}
                  {view.band.description}
                </Typography>
              </Box>

              <Box
                sx={{
                  border: "1.5px solid #015D67",
                  borderRadius: 3,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 4,
                }}
              >
                <Typography component="p" sx={{ color: "#0F3C3E", fontSize: 20, fontWeight: 700 }}>
                  {view.band.risk}
                </Typography>
                <RiskGauge percentage={view.percentage} />
              </Box>
            </Box>
          )}
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
