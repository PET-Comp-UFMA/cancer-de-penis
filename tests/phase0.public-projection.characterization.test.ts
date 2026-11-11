import assert from "node:assert/strict";
import { test } from "node:test";
import { toPublicDefinition } from "../src/modules/instrumentos/domain/form-definitions";
import type { FormDefinition } from "../src/modules/formularios/domain/types";

test("toPublicDefinition projeta o snapshot sem vazar campos editoriais", () => {
  const snapshot: FormDefinition = {
    schemaVersion: 1,
    title: "Instrumento sintético",
    description: "Descrição pública",
    imageDataUrl: "data:image/png;base64,editorial-image",
    authors: [{ id: "author-1", name: "Autora", institution: "Instituição editorial", imageDataUrl: null }],
    questions: [{
      id: "question-1",
      prompt: "Pergunta pública",
      type: "two-options",
      alternatives: [
        { id: "alternative-1", label: "Não", score: 0 },
        { id: "alternative-2", label: "Sim", score: 2 },
      ],
    }],
    resultBands: [{ id: "band-1", minScore: 0, maxScore: 100, risk: "Baixo", description: "Descrição da faixa" }],
  };

  const projected = toPublicDefinition({
    catalogKey: "CATALOGO-1",
    title: snapshot.title,
    description: snapshot.description,
    definition: snapshot,
  });

  assert.deepEqual(projected, {
    slug: "catalogo-1",
    catalogKey: "CATALOGO-1",
    title: snapshot.title,
    description: snapshot.description,
    heroImage: snapshot.imageDataUrl,
    authors: [{ name: "Autora", specialty: "Instituição editorial", image: "" }],
    questions: [{
      id: "question-1",
      prompt: "Pergunta pública",
      answerType: "single-choice",
      options: [
        { id: "alternative-1", label: "Não", score: 0 },
        { id: "alternative-2", label: "Sim", score: 2 },
      ],
    }],
    resultBands: snapshot.resultBands,
    questionnaireStatus: "ready",
  });
});
