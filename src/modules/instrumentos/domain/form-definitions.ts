import type { Author } from "@/modules/autores/domain/authors";
import { workAuthors } from "@/modules/autores/domain/authors";
import type { FormDefinition as EditableFormDefinition } from "@/modules/formularios/domain/types";

export type FormQuestion = {
  id: string;
  prompt: string;
  answerType: "boolean" | "single-choice" | "likert";
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

const standardResultBands: FormResultBand[] = [
  { id: "baixo", minScore: 0, maxScore: 33, risk: "Risco Baixo", description: "" },
  { id: "medio", minScore: 34, maxScore: 66, risk: "Risco Médio", description: "" },
  { id: "alto", minScore: 67, maxScore: 100, risk: "Risco Alto", description: "" },
];

const qualipenOptions = [
  { id: "discordo-totalmente", label: "Discordo totalmente", score: -2 },
  { id: "discordo-um-pouco", label: "Discordo um pouco", score: -1 },
  { id: "neutro", label: "Nem discordo, nem concordo", score: 0 },
  { id: "concordo-um-pouco", label: "Concordo um pouco", score: 1 },
  { id: "concordo-totalmente", label: "Concordo totalmente", score: 2 },
] as const;

const qualipenPrompts = [
  "Percebi algum sangramento no meu pênis no último mês.",
  "Senti mau cheiro no meu pênis no último mês.",
  "Senti alguma dificuldade ou incômodo para urinar no último mês.",
  "Senti dor ou desconforto no meu pênis no último mês.",
  "Observei algum inchaço na minha região genital ou virilha no último mês.",
  "Senti cansaço ou falta de energia para realizar minhas atividades do dia a dia no último mês.",
  "Senti alguma dificuldade para ter ou manter ereção no último mês.",
  "A doença afetou o meu desejo sexual no último mês.",
  "Senti vergonha ou insegurança em relação a minha vida sexual no último mês.",
  "A doença prejudicou a forma como eu me relaciono sexualmente com minha parceira ou parceiro no último mês.",
  "Senti que a minha masculinidade foi afetada pela doença no último mês.",
  "A doença afetou o meu prazer sexual no último mês.",
  "Eu me senti triste ou desanimado por causa da doença no último mês.",
  "Senti medo em relação à doença ou ao futuro no último mês.",
  "Senti vergonha ou constrangimento por causa da doença no último mês.",
  "A doença afetou a minha autoestima ou confiança no último mês.",
  "Eu me senti ansioso por causa da doença no último mês.",
  "Eu me senti estressado por causa da doença no último mês.",
  "A doença dificultou minha convivência com familiares e amigos no último mês.",
  "Não recebi apoio da minha família e amigos para lidar com a doença no último mês.",
  "Evitei atividades sociais (por exemplo, sair de casa, ir à igreja, ir à casa de um parente) por causa da doença no último mês.",
  "Tive dificuldades para acessar serviços de saúde para consultas e exames no último mês.",
  "Evitei praticar exercícios físicos ou esportes (por exemplo, caminhadas, corridas, futebol) por causa da doença no último mês.",
  "A doença afetou minha capacidade de trabalhar ou de manter minha rotina no último mês.",
] as const;

const qualipenQuestions: FormQuestion[] = qualipenPrompts.map((prompt, index) => ({
  id: `q${index + 1}`,
  prompt,
  answerType: "likert" as const,
  options: qualipenOptions,
}));

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
    // Regra fornecida para esta implementação: cada resposta Sim vale 1 e
    // cada resposta Não vale 0; a pontuação é normalizada pelo total de 13.
    resultBands: standardResultBands,
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
    questions: qualipenQuestions,
    // Alternativas e enunciados fornecidos pelo responsável do instrumento.
    // A escala ordinal segue -2, -1, 0, 1, 2 para normalização percentual.
    resultBands: standardResultBands,
    questionnaireStatus: "ready",
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
