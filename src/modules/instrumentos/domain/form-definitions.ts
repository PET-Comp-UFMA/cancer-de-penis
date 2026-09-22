import type { Author } from "@/modules/autores/domain/authors";
import { workAuthors } from "@/modules/autores/domain/authors";
import type { FormDefinition as EditableFormDefinition } from "@/modules/formularios/domain/types";

export type FormQuestion = {
  id: string;
  prompt: string;
  answerType: "boolean" | "single-choice";
  options?: readonly { id: string; label: string; score: number | null }[];
};

export type FormResultBand = {
  id: string;
  minScore: number | null;
  maxScore: number | null;
  risk: string;
  description: string;
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
  questionnaireStatus: "ready" | "pending";
};

const penriskQuestions: FormQuestion[] = [
  {
    id: "hygiene",
    prompt: "Você puxa a pele do pênis e lava a cabeça do pênis diariamente com água e sabão?",
    answerType: "boolean",
  },
  {
    id: "foreskin-retraction",
    prompt: "Ao puxar a pele do pênis, você consegue colocar a cabeça do pênis para fora?",
    answerType: "boolean",
  },
  {
    id: "odor",
    prompt: "Você ou alguém do seu convívio íntimo já sentiu mau cheiro no seu pênis?",
    answerType: "boolean",
  },
  {
    id: "skin-change",
    prompt: "Você percebeu alguma mudança na cor ou textura da pele do pênis?",
    answerType: "boolean",
  },
  {
    id: "hpv",
    prompt: "Você já foi diagnosticado com o vírus do HPV por algum profissional da saúde?",
    answerType: "boolean",
  },
  {
    id: "hiv",
    prompt: "Você já foi diagnosticado com o vírus da AIDS por algum profissional da saúde?",
    answerType: "boolean",
  },
  {
    id: "discharge",
    prompt: "A cabeça do seu pênis apresenta alguma secreção esbranquiçada?",
    answerType: "boolean",
  },
  {
    id: "wound",
    prompt: "A pele ou a cabeça do seu pênis apresenta alguma ferida ou sangramento?",
    answerType: "boolean",
  },
  {
    id: "smoking",
    prompt: "Você fuma ou fumou por muito tempo?",
    answerType: "boolean",
  },
  {
    id: "infections",
    prompt: "Você já teve infecções no pênis?",
    answerType: "boolean",
  },
  {
    id: "itching",
    prompt: "Você apresenta ou apresentou recentemente coceira na pele ou na cabeça do pênis?",
    answerType: "boolean",
  },
  {
    id: "warts",
    prompt: "Você tem verruga no pênis?",
    answerType: "boolean",
  },
  {
    id: "animal-sex",
    prompt: "Você já fez sexo com animais?",
    answerType: "boolean",
  },
];

const formDefinitions: Record<string, FormDefinition> = {
  penrisk: {
    slug: "penrisk",
    catalogKey: "PENRISK",
    title: "Penrisk",
    description:
      "Questionário PENRISK para avaliação de fatores relacionados à saúde do pênis.",
    heroImage: "/rounded.svg",
    authors: workAuthors,
    questions: penriskQuestions,
    // Kept scoreless — no official PENRISK weights/faixas exist yet; do not
    // fabricate them (see docs/backend-autenticacao.md "pendências clínicas").
    // isScorable() in domain/scoring.ts correctly reports this as not scorable.
    resultBands: [],
    questionnaireStatus: "ready",
  },
  qualipen: {
    slug: "qualipen",
    catalogKey: "QUALIPEN",
    title: "Qualipen",
    description:
      "Esta avaliação tem o objetivo de entender como o câncer de pênis afeta a sua vida.",
    heroImage: "/Rounded-Rectangle.svg",
    authors: workAuthors,
    questions: [],
    // Kept scoreless — no official QUALIPEN questions/weights/faixas exist
    // yet; do not fabricate them. See resultBands comment on `penrisk` above.
    resultBands: [],
    questionnaireStatus: "pending",
  },
};

export function normalizeFormSlug(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function getFormDefinition(slug: string): FormDefinition | undefined {
  const normalizedSlug = normalizeFormSlug(slug);
  if (!Object.prototype.hasOwnProperty.call(formDefinitions, normalizedSlug)) return undefined;
  return formDefinitions[normalizedSlug];
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
  return {
    slug: normalizeFormSlug(value.catalogKey),
    catalogKey: value.catalogKey,
    title: value.title,
    description: value.description,
    heroImage: definition.imageDataUrl || "/rounded.svg",
    authors: definition.authors.map((author) => ({
      name: author.name,
      specialty: author.institution || "Autor do formulário",
      image: "",
    })),
    questions: definition.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      answerType: "single-choice",
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
    questionnaireStatus: definition.questions.length > 0 ? "ready" : "pending",
  };
}

export async function getPublicFormDefinition(
  catalogKey: string,
  origin = "",
): Promise<FormDefinition | undefined> {
  const legacy = getFormDefinition(catalogKey);

  const response = await fetch(`${origin}/api/formularios/publicados/${encodeURIComponent(catalogKey)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) throw new Error("Não foi possível carregar o formulário publicado.");
  const value = (await response.json()) as {
    catalogKey: string;
    title: string;
    description: string;
    definition: EditableFormDefinition;
  };
  if (legacy && value.definition.questions.length === 0) return legacy;
  return toPublicDefinition(value);
}
