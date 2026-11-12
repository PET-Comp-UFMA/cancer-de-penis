"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Link, Stack, Typography } from "@mui/material";
import type { FormDefinition } from "../domain/form-definitions";
import {
  getFormBasePath,
  getFormQuestionnairePath,
} from "../domain/form-definitions";
import { isScorable } from "../domain/scoring";
import { useScoringSession } from "./ScoringSessionContext";
import FormInstanceLayout from "./FormInstanceLayout";
import RiskGauge from "./RiskGauge";
import type { ScoringSessionResult } from "./ScoringSessionContext";

type FormResultProps = {
  form: FormDefinition;
};

type ResultView =
  | { kind: "not-scorable" }
  | { kind: "no-session" }
  | { kind: "error" }
  | { kind: "result"; results: readonly ScoringSessionResult[] };

function resultBandRange(result: ScoringSessionResult) {
  const { minScore, maxScore } = result.band;
  return minScore === null || maxScore === null ? null : `${minScore}%–${maxScore}%`;
}

export default function FormResult({ form }: FormResultProps) {
  const { takeResult } = useScoringSession();
  const [view, setView] = useState<ResultView | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  // takeResult is a one-time, destructive read (see ScoringSessionContext).
  // Guard against React StrictMode's dev-only double-invoke of effects,
  // which would otherwise consume the session on the first pass and find it
  // already gone on the second — this ref persists across that double
  // invoke (the component instance itself isn't remounted), but starts
  // fresh on any genuine later remount, so real read-once semantics hold.
  const consumedRef = useRef(false);

  useEffect(() => {
    const scorableScopes = [
      ...(form.questions.length > 0 ? [{ dimensionId: undefined, definition: form }] : []),
      ...(form.dimensions ?? []).map((dimension) => ({ dimensionId: dimension.id, definition: dimension })),
    ].filter(({ definition }) => isScorable(definition));
    if (scorableScopes.length === 0) {
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
      setView({ kind: "result", results: session.results });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.catalogKey]);

  const resultItems = view?.kind === "result" ? view.results : [];
  const selectedResultIndex = Math.min(activeResultIndex, Math.max(resultItems.length - 1, 0));
  const selectedResult = resultItems[selectedResultIndex];
  const selectedDimension = selectedResult?.dimensionId
    ? (form.dimensions ?? []).find((item) => item.id === selectedResult.dimensionId)
    : undefined;

  function resultLabel(result: ScoringSessionResult, index: number) {
    const label = !result.dimensionId
      ? "Perguntas gerais"
      : (form.dimensions ?? []).find((dimension) => dimension.id === result.dimensionId)?.name ?? "Resultado";
    return `${index + 1}  ${label}`;
  }

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

        <Typography component="h1" sx={{ color: "#015D67", fontSize: { xs: 34, md: 46 }, fontWeight: 700, textAlign: "center" }}>
          Resultado
        </Typography>

        <Box sx={{ width: "100%", maxWidth: 1080 }}>
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
          {view?.kind === "result" && selectedResult && (
            <Box sx={{ display: "grid", gridTemplateColumns: resultItems.length > 1 ? { xs: "1fr", md: "260px minmax(0, 1fr)" } : "1fr", gap: { xs: 2, md: 3 }, alignItems: "start" }}>
              {resultItems.length > 1 && (
                <Stack spacing={2}>
                  <Stack component="nav" aria-label="Escopos do resultado" spacing={1.25}>
                    {resultItems.map((result, index) => {
                      const active = index === selectedResultIndex;
                      return (
                        <Button
                          key={result.dimensionId ?? "general"}
                          id={`resultado-opcao-${index}`}
                          aria-pressed={active}
                          aria-current={active ? "true" : undefined}
                          onClick={() => setActiveResultIndex(index)}
                          sx={{
                            justifyContent: "center",
                            minHeight: 68,
                            px: 2,
                            py: 1.25,
                            borderRadius: 2,
                            border: `1px solid ${active ? "#015D67" : "#D9E1E3"}`,
                            bgcolor: active ? "#E7F0F0" : "#FFFFFF",
                            color: active ? "#015D67" : "#667085",
                            fontSize: 15,
                            fontWeight: active ? 700 : 500,
                            textAlign: "center",
                            textTransform: "none",
                            whiteSpace: "normal",
                            "&:hover": { bgcolor: active ? "#E7F0F0" : "#F7FAFA" },
                          }}
                        >
                          {resultLabel(result, index)}
                        </Button>
                      );
                    })}
                  </Stack>
                  <Button href={getFormBasePath(form)} variant="contained" sx={{ bgcolor: "#015D67", textTransform: "none", borderRadius: 2, minHeight: 48 }}>
                    Concluir
                  </Button>
                </Stack>
              )}

              <Box
                sx={{ bgcolor: "#FFFFFF", border: "1px solid #D9E1E3", borderRadius: 3, p: { xs: 2.5, sm: 4 }, minWidth: 0 }}
              >
                <Typography component="h2" sx={{ color: "#015D67", fontSize: { xs: 24, sm: 28 }, fontWeight: 700 }}>
                  {selectedDimension?.name ?? "Perguntas gerais"}
                </Typography>
                {selectedDimension?.description && <Typography sx={{ color: "#425466", mt: 0.75 }}>{selectedDimension.description}</Typography>}
                <Chip label={selectedResult.band.risk} sx={{ bgcolor: "#E6F4F4", color: "#015D67", fontWeight: 700, mt: 2, minWidth: 160 }} />
                <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 2, sm: 3 } }}>
                  <RiskGauge
                    ariaLabel={`${selectedResult.percentage}% de pontuação ${selectedDimension ? `da dimensão ${selectedDimension.name}` : "do formulário"}`}
                    caption={selectedDimension ? "Pontuação desta dimensão" : "Pontuação do formulário"}
                    percentage={selectedResult.percentage}
                  />
                </Box>
                {resultBandRange(selectedResult) && <Typography sx={{ color: "#667085", fontSize: 13, textAlign: "center", mt: 0.5 }}>
                  Faixa configurada: {resultBandRange(selectedResult)}
                </Typography>}
                <Box sx={{ borderTop: "1px solid #E4E8EA", mt: 1, pt: 2, textAlign: "center" }}>
                  <Typography component="p" sx={{ color: "#425466", fontSize: 14 }}>
                    {selectedResult.band.description}
                  </Typography>
                </Box>
              </Box>
              {resultItems.length === 1 && <Button href={getFormBasePath(form)} variant="contained" sx={{ display: "block", mx: "auto", mt: 3, bgcolor: "#015D67", textTransform: "none", borderRadius: 2, px: 4 }}>Concluir</Button>}
            </Box>
          )}
          {view?.kind !== "result" && <Button href={getFormQuestionnairePath(form)} variant="contained" sx={{ mt: 3, bgcolor: "#015D67", textTransform: "none", borderRadius: 2 }}>
            Voltar ao formulário
          </Button>}
        </Box>
      </Box>
    </FormInstanceLayout>
  );
}
