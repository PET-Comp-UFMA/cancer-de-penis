"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Button, Card, Dialog, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import { useLeaveGuard } from "@/shared/hooks/useLeaveGuard";
import type { FormDefinition } from "../domain/form-definitions";
import { getFormBasePath, getFormResultPath } from "../domain/form-definitions";
import { evaluatePublishedForm } from "@/modules/avaliacoes/presentation/api";
import { createEvaluationSubmissionController } from "@/modules/avaliacoes/presentation/submission";
import { useScoringSession } from "./ScoringSessionContext";
import type { ScoringSessionResult } from "./ScoringSessionContext";

type FormQuestionnaireProps = { form: FormDefinition; publishedRevision: number };
type Answer = string | null;
type QuestionStep = { question: FormDefinition["questions"][number]; dimensionId?: string; sectionName?: string; sectionDescription?: string };
type QuestionScope = { id: string; label: string; description?: string; steps: QuestionStep[]; startIndex: number };

function questionSteps(form: FormDefinition): QuestionStep[] {
  const steps: QuestionStep[] = form.questions.map((question) => ({ question }));
  for (const dimension of form.dimensions ?? []) {
    dimension.questions.forEach((question, index) => steps.push({
      question,
      dimensionId: dimension.id,
      sectionName: index === 0 ? dimension.name : undefined,
      sectionDescription: index === 0 ? dimension.description : undefined,
    }));
  }
  return steps;
}

function questionScopes(form: FormDefinition): QuestionScope[] {
  const scopes: QuestionScope[] = [];
  let startIndex = 0;
  if (form.questions.length > 0) {
    scopes.push({ id: "general", label: "Perguntas gerais", steps: form.questions.map((question) => ({ question })), startIndex });
    startIndex += form.questions.length;
  }
  for (const dimension of form.dimensions ?? []) {
    if (dimension.questions.length === 0) continue;
    scopes.push({
      id: dimension.id,
      label: dimension.name,
      description: dimension.description,
      steps: dimension.questions.map((question, index) => ({
        question,
        dimensionId: dimension.id,
        sectionName: index === 0 ? dimension.name : undefined,
        sectionDescription: index === 0 ? dimension.description : undefined,
      })),
      startIndex,
    });
    startIndex += dimension.questions.length;
  }
  return scopes;
}

function sessionResults(value: unknown): ScoringSessionResult[] {
  if (!value || typeof value !== "object") return [];
  const payload = value as Record<string, unknown>;
  if (Array.isArray(payload.results)) return payload.results as ScoringSessionResult[];
  const dimensions = Array.isArray(payload.dimensions) ? payload.dimensions as Array<Record<string, unknown>> : [];
  const general = payload.general && typeof payload.general === "object" ? [payload.general as ScoringSessionResult] : [];
  if (general.length > 0 || dimensions.length > 0) {
    return [...general, ...dimensions.map((result) => ({
      ...result,
      dimensionId: (result.dimensionId ?? result.id) as string,
    }))] as ScoringSessionResult[];
  }
  if (typeof payload.score === "number" && typeof payload.percentage === "number" && payload.band) return [payload as unknown as ScoringSessionResult];
  return [];
}

function QuestionProgress({ currentIndex, total }: { currentIndex: number; total: number }) {
  return <Box component="ol" aria-label={`Pergunta ${currentIndex + 1} de ${total}`} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 213, m: 0, p: 0, listStyle: "none" }}>
    {Array.from({ length: total }, (_, index) => {
      const isCurrent = index === currentIndex;
      const isLast = index === total - 1;
      const large = isCurrent || isLast;
      return <Box component="li" key={index} aria-current={isCurrent ? "step" : undefined} sx={{ width: large ? 24 : 6, height: large ? 24 : 6, flexShrink: 0, borderRadius: "50%", border: large ? "1px solid #015D67" : "none", bgcolor: isCurrent ? "#015D67" : isLast ? "transparent" : "#015D67", color: isCurrent ? "#fff" : isLast ? "#015D67" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{large ? index + 1 : null}</Box>;
    })}
  </Box>;
}

function ScopeProgress({ scopes, activeScopeId }: { scopes: QuestionScope[]; activeScopeId: string }) {
  return <Box role="list" aria-label="Etapas do questionário" sx={{ display: "flex", gap: { xs: 1, sm: 1.5 }, width: "100%", overflowX: "auto", pb: 0.5 }}>
    {scopes.map((scope, index) => {
      const isActive = scope.id === activeScopeId;
      return <Card
        key={scope.id}
        role="listitem"
        aria-current={isActive ? "step" : undefined}
        aria-label={`${index + 1}. ${scope.label}`}
        variant="outlined"
        sx={{
          flex: "1 0 148px",
          minHeight: { xs: 64, sm: 72 },
          borderRadius: 2,
          borderColor: isActive ? "#015D67" : "#D9E1E3",
          bgcolor: isActive ? "#E7F0F0" : "#fff",
          color: isActive ? "#015D67" : "#667085",
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{index + 1}</Typography>
        <Box sx={{ ml: 1.25, minWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: 13, sm: 14 }, fontWeight: 700, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scope.label}</Typography>
          <Typography sx={{ fontSize: 12, lineHeight: 1.25, mt: 0.25, color: "inherit", opacity: 0.82 }}>{scope.steps.length} {scope.steps.length === 1 ? "pergunta" : "perguntas"}</Typography>
        </Box>
      </Card>;
    })}
  </Box>;
}
const radioSx = { color: "#015D67", "&.Mui-checked": { color: "#015D67" } };

export default function FormQuestionnaire({ form, publishedRevision }: FormQuestionnaireProps) {
  const router = useRouter();
  const { publishResults, publishError, clearResult } = useScoringSession();
  const steps = questionSteps(form);
  const scopes = questionScopes(form);
  const hasDimensions = (form.dimensions ?? []).some((dimension) => dimension.questions.length > 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const submissionRef = useRef(createEvaluationSubmissionController());
  const [answers, setAnswers] = useState<Answer[]>(() => Array.from({ length: steps.length }, () => null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { questionHeadingRef.current?.focus(); }, [currentIndex]);
  useEffect(() => {
    const submission = submissionRef.current;
    submission.mount();
    const onRouteChangeStart = () => {
      if (submission.invalidate()) setIsSubmitting(false);
    };
    router.events.on("routeChangeStart", onRouteChangeStart);
    return () => {
      submission.unmount();
      router.events.off("routeChangeStart", onRouteChangeStart);
    };
  }, [router.events]);
  useEffect(() => {
    clearResult(form.catalogKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.catalogKey]);
  const leaveGuard = useLeaveGuard(
    answers.some((answer) => answer !== null),
    "Sair do questionário? Suas respostas não são salvas e você vai precisar responder tudo de novo.",
  );

  if (form.questionnaireStatus !== "ready" || steps.length === 0) {
    return <Box sx={{ width: "100%", maxWidth: 640, mx: "auto", py: 4 }}>
      <Alert severity="info">Este formulário ainda não possui um questionário publicado.</Alert>
      <Button href={getFormBasePath(form)} variant="outlined" sx={{ mt: 3, borderColor: "#015D67", color: "#015D67", textTransform: "none" }}>Voltar para o início</Button>
    </Box>;
  }

  const step = steps[currentIndex];
  const activeScope = scopes.find((scope) => currentIndex >= scope.startIndex && currentIndex < scope.startIndex + scope.steps.length) ?? scopes[0]!;
  const scopedQuestionIndex = currentIndex - activeScope.startIndex;
  const question = step.question;
  const selectedAnswer = answers[currentIndex];
  const isLastQuestion = currentIndex === steps.length - 1;
  const isLikert = question.answerType === "likert";
  const options = question.options ?? [];

  function selectAnswer(value: string) {
    if (isSubmitting) return;
    setAnswers((previous) => { const next = [...previous]; next[currentIndex] = value; return next; });
  }

  async function goToNextQuestion() {
    if (selectedAnswer === null || isSubmitting) return;
    if (isLastQuestion) {
      const requestId = submissionRef.current.begin();
      setIsSubmitting(true);
      const scoreAnswers = steps.map((item, index) => ({
        questionId: item.question.id,
        optionId: (index === currentIndex ? selectedAnswer : answers[index]) as string,
        ...(item.dimensionId ? { dimensionId: item.dimensionId } : {}),
      }));
      try {
        const result = await evaluatePublishedForm({ catalogKey: form.catalogKey, publishedRevision, answers: scoreAnswers } as Parameters<typeof evaluatePublishedForm>[0]);
        if (!submissionRef.current.canCommit(requestId)) return;
        publishResults(form.catalogKey, sessionResults(result));
      } catch (error) {
        if (!submissionRef.current.canCommit(requestId)) return;
        publishError(form.catalogKey, error instanceof Error ? error.message : "SCORE_UNKNOWN_ERROR");
      } finally {
        if (submissionRef.current.finish(requestId)) setIsSubmitting(false);
      }
      if (!submissionRef.current.canCommit(requestId)) return;
      await router.push(getFormResultPath(form));
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  return <><Box sx={{ width: "100%", maxWidth: 824, mx: "auto" }}>
    {hasDimensions && <>
      <ScopeProgress scopes={scopes} activeScopeId={activeScope.id} />
      <Box sx={{ mt: { xs: 2, md: 2.5 } }}>
        <QuestionProgress currentIndex={scopedQuestionIndex} total={activeScope.steps.length} />
      </Box>
    </>}
    {!hasDimensions && <QuestionProgress currentIndex={currentIndex} total={steps.length} />}
    <Box sx={{ mt: { xs: 4, md: 5 } }}>
      {hasDimensions ? <Box sx={{ mb: 3 }}>
        <Typography component="h2" sx={{ color: "#015D67", fontSize: { xs: 24, md: 30 }, fontWeight: 700 }}>{activeScope.label}</Typography>
        {activeScope.description && <Typography sx={{ color: "#425466", mt: 0.75 }}>{activeScope.description}</Typography>}
      </Box> : step.sectionName && <Box sx={{ mb: 3 }}>
        <Typography component="h2" sx={{ color: "#015D67", fontSize: { xs: 24, md: 30 }, fontWeight: 700 }}>{step.sectionName}</Typography>
        {step.sectionDescription && <Typography sx={{ color: "#425466", mt: 0.75 }}>{step.sectionDescription}</Typography>}
      </Box>}
      <Typography component="p" sx={{ color: "#1F6C75", fontSize: 24, lineHeight: 1.1, fontWeight: 700, mb: 1.25 }}>{(hasDimensions ? scopedQuestionIndex : currentIndex) + 1}.</Typography>
      <Typography component="h2" ref={questionHeadingRef} tabIndex={-1} aria-live="polite" sx={{ color: "#015D67", fontSize: { xs: 20, md: 24 }, lineHeight: 1.35, fontWeight: 400 }}>{question.prompt}</Typography>
    </Box>
    <FormControl fullWidth sx={{ mt: { xs: 3, md: 4 } }}>
      {isLikert ? (
        <RadioGroup aria-label={question.prompt} value={selectedAnswer === null ? "" : selectedAnswer} onChange={(event) => selectAnswer(event.target.value)} sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" }, gap: { xs: 1, sm: 1.4 } }}>
          {options.map((option, index) => <FormControlLabel
            key={option.id}
            value={option.id}
            control={<Radio disabled={isSubmitting} inputProps={{ "aria-label": option.label }} sx={{ ...radioSx, position: "absolute", top: { xs: 18, sm: 20 }, left: "50%", transform: "translateX(-50%)", p: 0 }} />}
            label={<Box sx={{ position: "relative", minHeight: { xs: 92, sm: 116 }, pt: { xs: 3.5, sm: 4 }, width: "100%" }}>
              <Typography sx={{ color: "#1F6C75", fontSize: { xs: 13, sm: 16.9 }, fontWeight: 700, lineHeight: 1, position: "absolute", top: 0, left: 0, right: 0, textAlign: "center" }}>{`${index + 1}.`}</Typography>
              <Box sx={{ borderTop: "1px solid #1F6C75", height: 9, left: 0, position: "absolute", right: 0, top: { xs: 58, sm: 64 }, "&::before": { borderLeft: "1px solid #1F6C75", content: "\"\"", height: 8, left: "50%", position: "absolute", top: 0 }, "&::after": { borderLeft: "1px solid #1F6C75", content: "\"\"", height: 5, left: 0, position: "absolute", top: 0 } }} />
              <Typography sx={{ color: "#1F6C75", fontSize: { xs: 12, sm: 16.9 }, fontWeight: 700, lineHeight: 1.02, mt: { xs: 3.5, sm: 4.25 }, textAlign: "center" }}>{option.label}</Typography>
            </Box>}
            sx={{ m: 0, minHeight: { xs: 92, sm: 116 }, border: "1px solid transparent", borderRadius: 2, bgcolor: "transparent", position: "relative", alignItems: "stretch", justifyContent: "center", textAlign: "center", transition: "border-color .2s, box-shadow .2s", "&:has(.Mui-checked)": { borderColor: "#00ACB1", bgcolor: "#FAFCFC", boxShadow: "0 0 0 2px rgba(0,172,177,.14)" }, "& .MuiFormControlLabel-label": { width: "100%" } }}
          />)}
        </RadioGroup>
      ) : (
        <RadioGroup aria-label={question.prompt} value={selectedAnswer === null ? "" : selectedAnswer} onChange={(event) => selectAnswer(event.target.value)} sx={{ bgcolor: "#F0F5F6", borderRadius: 2, p: 2.5, gap: 0.25 }}>
          {options.map((option) => <FormControlLabel
            key={option.id}
            value={option.id}
            control={<Radio disabled={isSubmitting} inputProps={{ "aria-label": option.label }} sx={radioSx} />}
            label={option.label}
            sx={{ m: 0, minHeight: 32, "& .MuiFormControlLabel-label": { fontSize: 13 } }}
          />)}
        </RadioGroup>
      )}
    </FormControl>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: { xs: 4, md: 5 }, width: "100%", "& .MuiButton-root": { px: { xs: 1.5, sm: 2.5 } } }}>
      <Button href={getFormBasePath(form)} variant="outlined" sx={{ flexShrink: 0, minHeight: 39, borderColor: "#015D67", color: "#015D67", borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700 }}>Cancelar</Button>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
        {currentIndex > 0 && <Button variant="outlined" disabled={isSubmitting} onClick={() => setCurrentIndex((index) => index - 1)} sx={{ flex: { xs: "1 1 0", sm: "0 0 auto" }, minHeight: 39, minWidth: { xs: 0, sm: "auto" }, borderColor: "#015D67", color: "#015D67", borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700 }}>Anterior</Button>}
        <Button variant="contained" onClick={goToNextQuestion} disabled={selectedAnswer === null || isSubmitting} sx={{ flex: { xs: "1 1 0", sm: "0 0 auto" }, minHeight: 39, minWidth: { xs: 0, sm: "auto" }, bgcolor: "#015D67", borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#004B53" }, "&.Mui-disabled": { bgcolor: "#C8D8D9", color: "#fff" } }}>{isLastQuestion ? "Finalizar" : "Próximo"}</Button>
      </Box>
    </Box>
  </Box>
  <Dialog onClose={leaveGuard.stay} open={leaveGuard.leaveRequested} slotProps={{ paper: { sx: { borderRadius: "12px", maxWidth: 480, p: { xs: 3, sm: 4 }, width: "100%" } } }}>
    <Typography component="h2" sx={{ color: "#015D67", fontSize: { xs: 22, sm: 26 }, fontWeight: 700, mb: 2 }}>Sair do questionário?</Typography>
    <Typography sx={{ color: "#425466", fontSize: 17, mb: 3.5 }}>Por privacidade, suas respostas não são salvas. Se sair agora, você vai precisar responder tudo de novo.</Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-end" }}>
      <Button onClick={leaveGuard.stay} sx={{ border: "1px solid #015D67", borderRadius: "5px", color: "#015D67", px: 2.5, textTransform: "none", fontWeight: 700 }}>Continuar respondendo</Button>
      <Button onClick={() => void leaveGuard.leave()} sx={{ bgcolor: "#015D67", borderRadius: "5px", color: "#fff", px: 2.5, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#004B53" } }}>Sair</Button>
    </Box>
  </Dialog></>;
}
