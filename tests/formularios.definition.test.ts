import { test } from "node:test";
import assert from "node:assert/strict";
import { definitionState, validateFormDefinition } from "../src/modules/formularios/application/service";
import type { FormDefinition } from "../src/modules/formularios/domain/types";

function completeDefinition(): FormDefinition {
  return {
    schemaVersion: 1,
    title: "Instrumento de teste",
    description: "Descrição opcional",
    imageDataUrl: null,
    authors: [{ id: "author-1", name: "Autora", institution: "IES" }],
    questions: [{
      id: "question-1",
      prompt: "Pergunta válida",
      type: "two-options",
      alternatives: [
        { id: "alternative-1", label: "Não", score: 0 },
        { id: "alternative-2", label: "Sim", score: 1 },
      ],
    }],
    resultBands: [{ id: "band-1", minScore: 0, maxScore: 1, risk: "Resultado", description: "" }],
  };
}

test("aceita rascunho estruturalmente válido, mas incompleto", () => {
  const draft = completeDefinition();
  draft.title = "";
  draft.questions[0].alternatives[0].label = "";
  draft.questions[0].alternatives[0].score = null;
  const normalized = validateFormDefinition(draft);

  assert.equal(definitionState(normalized), "incomplete");
});

test("só marca a definição como completa quando perguntas e faixas estão preenchidas", () => {
  const normalized = validateFormDefinition(completeDefinition());
  assert.equal(definitionState(normalized), "complete");

  normalized.resultBands[0].maxScore = null;
  assert.equal(definitionState(normalized), "incomplete");
});

test("preserva os mínimos de alternativas por tipo", () => {
  const twoOptions = completeDefinition();
  twoOptions.questions[0].alternatives.pop();
  assert.throws(() => validateFormDefinition(twoOptions), /FORM_INVALID_DEFINITION/);

  const likert = completeDefinition();
  likert.questions[0] = {
    ...likert.questions[0],
    type: "likert",
    alternatives: [
      { id: "alternative-1", label: "A", score: 1 },
      { id: "alternative-2", label: "B", score: 2 },
    ],
  };
  assert.throws(() => validateFormDefinition(likert), /FORM_INVALID_DEFINITION/);
});

test("rejeita IDs duplicados dentro de uma coleção", () => {
  const duplicate = completeDefinition();
  duplicate.questions[0].alternatives[1].id = duplicate.questions[0].alternatives[0].id;
  assert.throws(() => validateFormDefinition(duplicate), /FORM_INVALID_DEFINITION/);
});
