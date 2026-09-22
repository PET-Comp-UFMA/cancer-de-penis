"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import type { FormDefinition } from "../domain/form-definitions";
import {
  getFormBasePath,
  getFormResultPath,
} from "../domain/form-definitions";
import { computeScore, isScorable, type ScoreAnswer } from "../domain/scoring";
import { useScoringSession } from "./ScoringSessionContext";

type FormQuestionnaireProps = {
  form: FormDefinition;
};

type Answer = string | null;

function QuestionProgress({ currentIndex, total }: { currentIndex: number; total: number }) {
  return (
    <Box
      component="ol"
      aria-label={`Pergunta ${currentIndex + 1} de ${total}`}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: 213,
        m: 0,
        p: 0,
        listStyle: "none",
      }}
    >
      {Array.from({ length: total }, (_, index) => {
        const isCurrent = index === currentIndex;
        const isLast = index === total - 1;
        const large = isCurrent || isLast;

        return (
          <Box
            component="li"
            key={index}
            aria-current={isCurrent ? "step" : undefined}
            sx={{
              width: large ? 24 : 6,
              height: large ? 24 : 6,
              flexShrink: 0,
              borderRadius: "50%",
              border: "1px solid #015D67",
              bgcolor: isCurrent ? "#015D67" : "transparent",
              color: isLast && !isCurrent ? "#015D67" : "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {large ? index + 1 : null}
          </Box>
        );
      })}
    </Box>
  );
}

export default function FormQuestionnaire({ form }: FormQuestionnaireProps) {
  const router = useRouter();
  const { publishResult, publishError, clearResult } = useScoringSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const [answers, setAnswers] = useState<Answer[]>(() =>
    Array.from({ length: form.questions.length }, () => null),
  );

  useEffect(() => {
    questionHeadingRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    // A fresh attempt invalidates any leftover result from a previous one.
    clearResult(form.catalogKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.catalogKey]);

  if (form.questionnaireStatus !== "ready" || form.questions.length === 0) {
    return (
      <Box sx={{ width: "100%", maxWidth: 640, mx: "auto", py: 4 }}>
        <Alert severity="info">
          Este formulário ainda não possui um questionário publicado.
        </Alert>
        <Button
          href={getFormBasePath(form)}
          variant="outlined"
          sx={{ mt: 3, borderColor: "#015D67", color: "#015D67", textTransform: "none" }}
        >
          Voltar para o início
        </Button>
      </Box>
    );
  }

  const question = form.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isLastQuestion = currentIndex === form.questions.length - 1;

  function selectAnswer(value: string) {
    setAnswers((previous) => {
      const next = [...previous];
      next[currentIndex] = value;
      return next;
    });
  }

  function goToNextQuestion() {
    if (selectedAnswer === null) return;

    if (isLastQuestion) {
      if (isScorable(form)) {
        const scoreAnswers: ScoreAnswer[] = form.questions.map((q, index) => ({
          questionId: q.id,
          optionId: (index === currentIndex ? selectedAnswer : answers[index]) as string,
        }));
        try {
          publishResult(form.catalogKey, computeScore(form, scoreAnswers));
        } catch (error) {
          publishError(form.catalogKey, error instanceof Error ? error.message : "SCORE_UNKNOWN_ERROR");
        }
      }
      router.push(getFormResultPath(form));
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 640, mx: "auto" }}>
      <QuestionProgress currentIndex={currentIndex} total={form.questions.length} />

      <Box sx={{ mt: 3 }}>
        <Typography
          component="p"
          sx={{ color: "#015D67", fontSize: 24, lineHeight: 1.1, fontWeight: 700, mb: 1.5 }}
        >
          {currentIndex + 1}.
        </Typography>
        <Typography
          component="h2"
          ref={questionHeadingRef}
          tabIndex={-1}
          aria-live="polite"
          sx={{ color: "#0F3C3E", fontSize: { xs: 22, md: 24 }, lineHeight: 1.35, fontWeight: 400 }}
        >
          {question.prompt}
        </Typography>
      </Box>

      <FormControl fullWidth sx={{ mt: 3 }}>
        <RadioGroup
          aria-label={question.prompt}
          value={selectedAnswer === null ? "" : String(selectedAnswer)}
          onChange={(event) => selectAnswer(event.target.value)}
          sx={{
            bgcolor: "#F0F5F6",
            borderRadius: 2,
            p: 2.5,
            gap: 0.25,
          }}
        >
          {question.answerType === "single-choice" ? question.options?.map((option) => (
            <FormControlLabel key={option.id} value={option.id} control={<Radio sx={{ color: "#015D67", "&.Mui-checked": { color: "#015D67" } }} />} label={option.label} sx={{ m: 0, minHeight: 32, "& .MuiFormControlLabel-label": { fontSize: 13 } }} />
          )) : <>
          <FormControlLabel
            value="true"
            control={<Radio sx={{ color: "#015D67", "&.Mui-checked": { color: "#015D67" } }} />}
            label="Sim"
            sx={{ m: 0, minHeight: 32, "& .MuiFormControlLabel-label": { fontSize: 13 } }}
          />
          <FormControlLabel
            value="false"
            control={<Radio sx={{ color: "#015D67", "&.Mui-checked": { color: "#015D67" } }} />}
            label="Não"
            sx={{ m: 0, minHeight: 32, "& .MuiFormControlLabel-label": { fontSize: 13 } }}
          />
          </>}
        </RadioGroup>
      </FormControl>

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          onClick={goToNextQuestion}
          disabled={selectedAnswer === null}
          sx={{
            bgcolor: "#015D67",
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { bgcolor: "#004B53" },
          }}
        >
          {isLastQuestion ? "Finalizar" : "Próximo"}
        </Button>
        <Button
          href={getFormBasePath(form)}
          variant="outlined"
          sx={{
            borderColor: "#015D67",
            color: "#015D67",
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
}
