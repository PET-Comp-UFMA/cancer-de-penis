"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Button, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from "@mui/material";
import type { FormDefinition } from "../domain/form-definitions";
import { getFormBasePath, getFormResultPath } from "../domain/form-definitions";
import { computeScore, isScorable, type ScoreAnswer } from "../domain/scoring";
import { useScoringSession } from "./ScoringSessionContext";

type FormQuestionnaireProps = { form: FormDefinition };
type Answer = string | null;

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
const radioSx = { color: "#015D67", "&.Mui-checked": { color: "#015D67" } };

export default function FormQuestionnaire({ form }: FormQuestionnaireProps) {
  const router = useRouter();
  const { publishResult, publishError, clearResult } = useScoringSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const [answers, setAnswers] = useState<Answer[]>(() => Array.from({ length: form.questions.length }, () => null));

  useEffect(() => { questionHeadingRef.current?.focus(); }, [currentIndex]);
  useEffect(() => {
    clearResult(form.catalogKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.catalogKey]);

  if (form.questionnaireStatus !== "ready" || form.questions.length === 0) {
    return <Box sx={{ width: "100%", maxWidth: 640, mx: "auto", py: 4 }}>
      <Alert severity="info">Este formulário ainda não possui um questionário publicado.</Alert>
      <Button href={getFormBasePath(form)} variant="outlined" sx={{ mt: 3, borderColor: "#015D67", color: "#015D67", textTransform: "none" }}>Voltar para o início</Button>
    </Box>;
  }

  const question = form.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isLastQuestion = currentIndex === form.questions.length - 1;
  const isLikert = question.answerType === "likert";
  const options = question.options ?? [];

  function selectAnswer(value: string) {
    setAnswers((previous) => { const next = [...previous]; next[currentIndex] = value; return next; });
  }

  function goToNextQuestion() {
    if (selectedAnswer === null) return;
    if (isLastQuestion) {
      if (isScorable(form)) {
        const scoreAnswers: ScoreAnswer[] = form.questions.map((q, index) => ({ questionId: q.id, optionId: (index === currentIndex ? selectedAnswer : answers[index]) as string }));
        try { publishResult(form.catalogKey, computeScore(form, scoreAnswers)); }
        catch (error) { publishError(form.catalogKey, error instanceof Error ? error.message : "SCORE_UNKNOWN_ERROR"); }
      }
      router.push(getFormResultPath(form));
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  return <Box sx={{ width: "100%", maxWidth: 824, mx: "auto" }}>
    <QuestionProgress currentIndex={currentIndex} total={form.questions.length} />
    <Box sx={{ mt: { xs: 4, md: 5 } }}>
      <Typography component="p" sx={{ color: "#1F6C75", fontSize: 24, lineHeight: 1.1, fontWeight: 700, mb: 1.25 }}>{currentIndex + 1}.</Typography>
      <Typography component="h2" ref={questionHeadingRef} tabIndex={-1} aria-live="polite" sx={{ color: "#015D67", fontSize: { xs: 20, md: 24 }, lineHeight: 1.35, fontWeight: 400 }}>{question.prompt}</Typography>
    </Box>
    <FormControl fullWidth sx={{ mt: { xs: 3, md: 4 } }}>
      {isLikert ? (
        <RadioGroup aria-label={question.prompt} value={selectedAnswer === null ? "" : selectedAnswer} onChange={(event) => selectAnswer(event.target.value)} sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(5, minmax(0, 1fr))" }, gap: { xs: 1, sm: 1.4 } }}>
          {options.map((option, index) => <FormControlLabel
            key={option.id}
            value={option.id}
            control={<Radio inputProps={{ "aria-label": option.label }} sx={{ ...radioSx, position: "absolute", top: { xs: 18, sm: 20 }, left: "50%", transform: "translateX(-50%)", p: 0 }} />}
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
            control={<Radio inputProps={{ "aria-label": option.label }} sx={radioSx} />}
            label={option.label}
            sx={{ m: 0, minHeight: 32, "& .MuiFormControlLabel-label": { fontSize: 13 } }}
          />)}
        </RadioGroup>
      )}
    </FormControl>
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, mt: { xs: 4, md: 5 }, width: "100%" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
        {currentIndex > 0 && <Button variant="outlined" onClick={() => setCurrentIndex((index) => index - 1)} sx={{ flex: { xs: "1 1 0", sm: "0 0 auto" }, minHeight: 39, minWidth: { xs: 0, sm: "auto" }, borderColor: "#015D67", color: "#015D67", borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700 }}>Anterior</Button>}
        <Button variant="contained" onClick={goToNextQuestion} disabled={selectedAnswer === null} sx={{ flex: { xs: "1 1 0", sm: "0 0 auto" }, minHeight: 39, minWidth: { xs: 0, sm: "auto" }, bgcolor: "#015D67", borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#004B53" }, "&.Mui-disabled": { bgcolor: "#C8D8D9", color: "#fff" } }}>{isLastQuestion ? "Finalizar" : "Próximo"}</Button>
      </Box>
      <Button href={getFormBasePath(form)} variant="outlined" sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 39, borderColor: "#015D67", color: "#015D67", borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700 }}>Cancelar</Button>
    </Box>
  </Box>;
}
