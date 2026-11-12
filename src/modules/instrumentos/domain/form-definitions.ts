import type { Author } from "@/modules/autores/domain/authors";
import type { FormDefinition as EditableFormDefinition } from "@/modules/formularios/domain/types";

export type FormQuestion = {
  id: string;
  prompt: string;
  answerType: "single-choice" | "likert";
  options?: readonly { id: string; label: string; score: number | null }[];
};

export type FormResultBand = {
  id: string;
  minScore: number | null;
  maxScore: number | null;
  risk: string;
  description: string;
};

export type FormDimension = {
  id: string;
  name: string;
  description: string;
  questions: readonly FormQuestion[];
  resultBands: readonly FormResultBand[];
};

export type FormDefinition = {
  slug: string;
  catalogKey: string;
  title: string;
  description: string;
  heroImage: string;
  authors: readonly Author[];
  questions: readonly FormQuestion[];
  resultBands: readonly FormResultBand[];
  dimensions?: readonly FormDimension[];
  questionnaireStatus: "ready" | "pending";
};

export function normalizeFormSlug(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function getFormBasePath(form: Pick<FormDefinition, "slug">) {
  return `/tela-avaliacao/${form.slug}`;
}

export function getFormQuestionnairePath(form: Pick<FormDefinition, "slug">) {
  return `${getFormBasePath(form)}/formulario`;
}

export function getFormAuthorsPath(form: Pick<FormDefinition, "slug">) {
  return `${getFormBasePath(form)}/autores`;
}

export function getFormResultPath(form: Pick<FormDefinition, "slug">) {
  return `${getFormBasePath(form)}/resultado`;
}

export function toPublicDefinition(value: {
  catalogKey: string;
  title: string;
  description: string;
  definition: EditableFormDefinition;
}): FormDefinition {
  const { definition } = value;
  type EditableDimension = {
    id: string;
    name: string;
    description: string;
    questions: EditableFormDefinition["questions"];
    resultBands: EditableFormDefinition["resultBands"];
  };
  const dimensions = ((definition as EditableFormDefinition & { dimensions?: EditableDimension[] }).dimensions ?? []).map((dimension) => ({
    id: dimension.id,
    name: dimension.name,
    description: dimension.description,
    questions: dimension.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      answerType: (question.type === "likert" ? "likert" : "single-choice") as FormQuestion["answerType"],
      options: question.alternatives.map((alternative) => ({
        id: alternative.id,
        label: alternative.label,
        score: alternative.score,
      })),
    })),
    resultBands: dimension.resultBands.map((band) => ({
      id: band.id,
      minScore: band.minScore,
      maxScore: band.maxScore,
      risk: band.risk,
      description: band.description,
    })),
  }));
  const hasQuestions = definition.questions.length > 0 || dimensions.some((dimension) => dimension.questions.length > 0);
  return {
    slug: normalizeFormSlug(value.catalogKey),
    catalogKey: value.catalogKey,
    title: value.title,
    description: value.description,
    heroImage: definition.imageDataUrl || "/rounded.svg",
    authors: definition.authors.map((author) => ({
      name: author.name,
      specialty: author.institution || "Autor do formulário",
      image: author.imageDataUrl ?? "",
    })),
    questions: definition.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      answerType: question.type === "likert" ? "likert" : "single-choice",
      options: question.alternatives.map((alternative) => ({
        id: alternative.id,
        label: alternative.label,
        score: alternative.score,
      })),
    })),
    resultBands: definition.resultBands.map((band) => ({
      id: band.id,
      minScore: band.minScore,
      maxScore: band.maxScore,
      risk: band.risk,
      description: band.description,
    })),
    ...(dimensions.length > 0 ? { dimensions } : {}),
    questionnaireStatus: hasQuestions ? "ready" : "pending",
  };
}
