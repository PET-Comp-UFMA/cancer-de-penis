import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useId, useMemo, useState } from "react";
import type { AuthUser } from "@/modules/auth/presentation/api";
import { getSession, logout } from "@/modules/auth/presentation/api";
import { AdminFooter, AdminHeader } from "@/modules/admin/presentation/AdminChrome";
import {
  createForm,
  FormsApiError,
  getForm,
  saveFormDefinition,
  updateFormStatus,
  type FormDetail,
} from "./api";
import type { FormDefinition, FormQuestionType } from "../domain/types";

const GREEN = "#015D67";
const BACKGROUND = "#FAFCFC";
const TEXT = "#425466";
const BORDER = "#D9D9D9";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emptyAlternative = () => ({ id: id("alternative"), label: "", score: null });
// Escala Likert de 5 pontos padrão (simétrica, -2 a +2): a forma mais usada e
// consistente para transformar respostas em valores numéricos, por
// orientação do responsável clínico. Pré-preenchida para reduzir divergência
// entre formulários; cada rótulo/pontuação continua editável por pergunta.
const likertDefaults = [
  { label: "Discordo totalmente", score: -2 },
  { label: "Discordo um pouco", score: -1 },
  { label: "Nem discordo, nem concordo", score: 0 },
  { label: "Concordo um pouco", score: 1 },
  { label: "Concordo totalmente", score: 2 },
];
const emptyQuestion = (type: FormQuestionType) => ({
  id: id("question"),
  prompt: "",
  type,
  alternatives: type === "likert"
    ? likertDefaults.map((preset) => ({ id: id("alternative"), ...preset }))
    : Array.from({ length: 2 }, emptyAlternative),
});
// Critério de classificação padrão (percentual sobre a amplitude total):
// até 33% Baixo, 34–66% Médio, acima de 66% Alto — orientação do responsável
// clínico. minScore/maxScore são percentuais (0–100), não pontuação bruta.
const standardResultBands = () => [
  { id: id("band"), minScore: 0, maxScore: 33, risk: "Risco Baixo", description: "" },
  { id: id("band"), minScore: 34, maxScore: 66, risk: "Risco Médio", description: "" },
  { id: id("band"), minScore: 67, maxScore: 100, risk: "Risco Alto", description: "" },
];
const emptyDefinition = (): FormDefinition => ({
  schemaVersion: 1,
  title: "",
  description: "",
  imageDataUrl: null,
  authors: [{ id: id("author"), name: "", institution: "" }],
  questions: [],
  resultBands: [{ id: id("band"), minScore: null, maxScore: null, risk: "", description: "" }],
});

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function Input({ label, value, onChange, disabled = false, multiline = false, required = false, type = "text", externalLabel = false, fieldHeight, multilineHeight }: {
  label: string; value: string; onChange: (value: string) => void; disabled?: boolean; multiline?: boolean; required?: boolean; type?: string; externalLabel?: boolean; fieldHeight?: number; multilineHeight?: number;
}) {
  const inputId = useId();
  const field = <TextField id={inputId} disabled={disabled} fullWidth label={externalLabel ? undefined : label} multiline={multiline} onChange={(event) => onChange(event.target.value)} required={required} size="small" type={type} value={value} sx={{ "& .MuiOutlinedInput-root": { alignItems: multiline ? "flex-start" : "center", borderRadius: "5px", bgcolor: "#fff", minHeight: fieldHeight }, "& .MuiInputBase-inputMultiline": { minHeight: multilineHeight, padding: multilineHeight ? "14px" : undefined }, "& .MuiInputLabel-root": { color: TEXT, fontSize: 13 } }} />;
  return externalLabel ? <Box sx={{ width: "100%" }}><Box component="label" htmlFor={inputId} sx={{ color: TEXT, display: "block", fontSize: 12, fontWeight: 600, mb: 0.75 }}>{label}{required ? " *" : ""}</Box>{field}</Box> : field;
}

export default function FormEditor({ formId, initialForm }: { user: AuthUser; formId?: string; initialForm?: FormDetail }) {
  const router = useRouter();
  const [definition, setDefinition] = useState<FormDefinition>(initialForm?.definition ?? emptyDefinition);
  const [currentId, setCurrentId] = useState(formId ?? initialForm?.id ?? "");
  const [catalogKey, setCatalogKey] = useState(initialForm?.catalogKey ?? "");
  const [revision, setRevision] = useState(initialForm?.revision ?? 0);
  const [status, setStatus] = useState(initialForm?.status ?? "unpublished");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(Boolean(formId && !initialForm));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [typeDialog, setTypeDialog] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);
  // A published form keeps its public snapshot while its editable definition becomes a draft.
  const readOnly = false;

  useEffect(() => {
    let active = true;
    getSession().then((session) => active && setCsrfToken(session.csrfToken)).catch(() => undefined);
    if (!formId || initialForm) return () => { active = false; };
    const controller = new AbortController();
    getForm(formId, controller.signal).then((form) => {
      if (!active) return;
      setDefinition(form.definition); setRevision(form.revision); setStatus(form.status); setCurrentId(form.id); setCatalogKey(form.catalogKey);
    }).catch((caught: unknown) => {
      if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
      if (caught instanceof FormsApiError && caught.status === 401) {
        void router.replace("/admin/login?reason=expired");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o formulário.");
    }).finally(() => active && setLoading(false));
    return () => { active = false; controller.abort(); };
  }, [formId, initialForm, router]);

  async function withCsrf<T>(operation: (token: string) => Promise<T>) {
    let token = csrfToken || (await getSession()).csrfToken;
    try { return await operation(token); } catch (caught) {
      if ((caught as Error & { status?: number }).status !== 403) throw caught;
      token = (await getSession()).csrfToken; setCsrfToken(token); return operation(token);
    }
  }

  function showMutationError(caught: unknown) {
    if (caught instanceof FormsApiError && caught.status === 401) { void router.replace("/admin/login?reason=expired"); return; }
    if (caught instanceof FormsApiError && caught.status === 409) { setError(caught.message); return; }
    if (caught instanceof FormsApiError && (caught.status === 403 || caught.status === 405)) { setError("O servidor não permite esta operação."); return; }
    setError(caught instanceof Error ? caught.message : "Não foi possível concluir a operação.");
  }

  async function persist(nextStatus?: "published") {
    setBusy(true); setError(""); setSuccess("");
    let formIdToSave = currentId;
    let createdNew = false;
    try {
      let nextRevision = revision;
      if (!formIdToSave) {
        const created = await withCsrf((token) => createForm(token, definition));
        formIdToSave = created.id; nextRevision = created.revision; setCurrentId(created.id); setRevision(created.revision);
        createdNew = true;
        setStatus(created.status);
        setSuccess("Alterações salvas.");
      } else {
        const saved = await withCsrf((token) => saveFormDefinition(formIdToSave, definition, nextRevision, token));
        setRevision(saved.revision); setStatus(saved.status); setSuccess("Alterações salvas.");
        nextRevision = saved.revision;
      }
      if (nextStatus) {
        const published = await withCsrf((token) => updateFormStatus(formIdToSave, "published", token, nextRevision));
        setStatus(published.status);
      }
      if (createdNew) await router.replace(`/admin/formularios/${formIdToSave}`);
      return formIdToSave;
    } catch (caught) {
      showMutationError(caught);
      if (createdNew && formIdToSave) await router.replace(`/admin/formularios/${formIdToSave}`);
      return null;
    } finally { setBusy(false); }
  }

  async function signOut() { try { const token = csrfToken || (await getSession()).csrfToken; await logout(token); await router.replace("/admin/login"); } catch { setError("Não foi possível sair."); } }
  function updateDefinition(patch: Partial<FormDefinition>) { setDefinition((current) => ({ ...current, ...patch })); }
  function updateQuestion(questionId: string, patch: Partial<FormDefinition["questions"][number]>) { updateDefinition({ questions: definition.questions.map((question) => question.id === questionId ? { ...question, ...patch } : question) }); }
  function updateAlternative(questionId: string, alternativeId: string, patch: { label?: string; score?: number | null }) { updateDefinition({ questions: definition.questions.map((question) => question.id === questionId ? { ...question, alternatives: question.alternatives.map((alternative) => alternative.id === alternativeId ? { ...alternative, ...patch } : alternative) } : question) }); }
  function removeQuestion(questionId: string) { updateDefinition({ questions: definition.questions.filter((question) => question.id !== questionId) }); }
  function moveQuestion(fromId: string, toId: string) { const questions = [...definition.questions]; const from = questions.findIndex((question) => question.id === fromId); const to = questions.findIndex((question) => question.id === toId); if (from < 0 || to < 0) return; const [item] = questions.splice(from, 1); questions.splice(to, 0, item); updateDefinition({ questions }); }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!/^image\/(?:png|jpe?g|webp|gif)$/i.test(file.type)) { setError("Escolha uma imagem PNG, JPEG, WebP ou GIF."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("A imagem deve ter aproximadamente no máximo 2 MB."); return; }
    const reader = new FileReader(); reader.onload = () => updateDefinition({ imageDataUrl: String(reader.result) }); reader.readAsDataURL(file);
  }

  const stepsComplete = useMemo(() => [
    Boolean(definition.title.trim()),
    definition.questions.length > 0 && definition.questions.every((question) => {
      const minimum = question.type === "likert" ? 3 : 2;
      return Boolean(question.prompt.trim())
        && question.alternatives.length >= minimum
        && question.alternatives.every((alternative) => Boolean(alternative.label.trim())
          && alternative.score !== null
          && Number.isFinite(alternative.score));
    }),
    definition.resultBands.length > 0 && definition.resultBands.every((band) => band.risk.trim()
      && band.minScore !== null
      && band.maxScore !== null
      && Number.isFinite(band.minScore)
      && Number.isFinite(band.maxScore)
      && band.minScore <= band.maxScore),
  ], [definition]);
  if (loading) return <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: "60vh" }}><CircularProgress sx={{ color: GREEN }} /></Box>;

  return <Box sx={{ bgcolor: BACKGROUND, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <AdminHeader loggingOut={false} onLogout={signOut} />
    <Box component="main" data-testid="editor" sx={{ flex: 1, maxWidth: 1315, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 4, sm: 6 }, width: "100%" }}>
      <Box sx={{ mb: { xs: 3, sm: 5 }, textAlign: "center" }}><Typography component="h1" sx={{ color: GREEN, fontSize: { xs: 28, sm: 40 }, fontWeight: 700, letterSpacing: "-0.03em" }}>{currentId ? (definition.title || "Editar formulário") : "Novo Formulário"}</Typography><Typography sx={{ color: TEXT, fontSize: 13, mt: 1 }}>Crie novas ferramentas de avaliação.</Typography><Box data-testid="stepper" sx={{ alignItems: "center", display: "flex", justifyContent: "center", mx: "auto", mt: 3, maxWidth: { xs: "100%", sm: 447 }, width: "100%" }}>{stepsComplete.map((complete, index) => <Box key={index} sx={{ alignItems: "center", display: "flex", flex: { xs: 1, sm: "0 0 auto" }, minWidth: 0 }}><Box sx={{ alignItems: "center", bgcolor: complete ? GREEN : BACKGROUND, border: `1px solid #47878E`, borderRadius: "50%", color: complete ? "#fff" : "#242E39", display: "flex", flexShrink: 0, fontSize: { xs: 16, sm: 22.69 }, fontWeight: 600, height: { xs: 36, sm: 55.85 }, justifyContent: "center", width: { xs: 36, sm: 55.85 } }}>{complete ? <CheckRoundedIcon sx={{ fontSize: { xs: 21, sm: 30 } }} /> : `0${index + 1}`}</Box>{index < 2 && <Box sx={{ bgcolor: "#47878E", flex: { xs: 1, sm: "0 0 139.63px" }, height: { xs: 2, sm: 3.491 }, minWidth: 0 }} />}</Box>)}</Box></Box>
      {error && <Alert onClose={() => setError("")} severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}{status === "published" && <Alert severity="info" sx={{ mb: 3 }}>Este formulário está publicado. Salvar cria ou atualiza o rascunho e mantém a versão pública até uma nova publicação.</Alert>}{["PENRISK", "QUALIPEN"].includes(catalogKey.toUpperCase()) && <Alert severity="warning" sx={{ mb: 3 }}>Instrumento pendente de fonte clínica oficial. Não preencher pontuações ou faixas de resultado por suposição.</Alert>}
      <Box component="fieldset" disabled={busy} onDragStart={(event) => { if (busy) event.preventDefault(); }} sx={{ border: 0, m: 0, minWidth: 0, p: 0 }}>
      <Card sx={{ border: 0, borderRadius: "8px", boxShadow: "0 2px 14px rgba(1, 93, 103, 0.05)", mb: 3 }}>
        <Box sx={{ px: { xs: 2, sm: 3.5 }, pt: { xs: 2.5, sm: 3.5 } }}><Typography component="h2" sx={{ color: GREEN, fontSize: { xs: 19, sm: 22 }, fontWeight: 700 }}>01 - Dados do Formulário</Typography></Box>
        <CardContent sx={{ p: { xs: 2, sm: 3.5 }, pt: { xs: 2.5, sm: 3 } }}><Box sx={{ display: "grid", gap: { xs: 3, md: 5 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" } }}><Stack spacing={{ xs: 2.25, sm: 2.75 }}><Input disabled={readOnly} externalLabel fieldHeight={71} label="Nome do Formulário" onChange={(value) => updateDefinition({ title: value })} required value={definition.title} /><Input disabled={readOnly} externalLabel label="Descrição" multiline multilineHeight={125} onChange={(value) => updateDefinition({ description: value })} value={definition.description} /><Box><Typography sx={{ color: TEXT, fontSize: 15, fontWeight: 700, mb: 1.25 }}>Autores do Formulário</Typography>{definition.authors.map((author, index) => <Box key={author.id} sx={{ alignItems: "start", display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, mb: 1.5 }}><Input disabled={readOnly} externalLabel fieldHeight={71} label="Nome do Autor" onChange={(value) => updateDefinition({ authors: definition.authors.map((item) => item.id === author.id ? { ...item, name: value } : item) })} value={author.name} /><Input disabled={readOnly} externalLabel fieldHeight={71} label="Instituição" onChange={(value) => updateDefinition({ authors: definition.authors.map((item) => item.id === author.id ? { ...item, institution: value } : item) })} value={author.institution} /><IconButton aria-label={`Remover autor ${index + 1}`} disabled={readOnly || definition.authors.length === 1} onClick={() => updateDefinition({ authors: definition.authors.filter((item) => item.id !== author.id) })} sx={{ justifySelf: { xs: "start", sm: "auto" }, mt: { xs: 0, sm: 3 } }}><RemoveCircleOutlineRoundedIcon /></IconButton></Box>)}<Button disabled={readOnly} onClick={() => updateDefinition({ authors: [...definition.authors, { id: id("author"), name: "", institution: "" }] })} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, textTransform: "none" }}>Adicionar autor</Button></Box><Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}><Button component="label" disabled={readOnly} startIcon={<ImageOutlinedIcon />} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>Adicionar imagem<input accept="image/*" hidden onChange={handleImage} type="file" /></Button>{definition.imageDataUrl && <Box component="img" alt="Pré-visualização da imagem do formulário" src={definition.imageDataUrl} sx={{ borderRadius: 2, height: 82, objectFit: "cover", width: 140 }} />}</Box></Stack><Box sx={{ alignItems: "center", bgcolor: "#E7F0F0", borderRadius: 2, display: "flex", minHeight: { xs: 180, md: 270 }, overflow: "hidden", position: "relative" }}>{definition.imageDataUrl ? <Box component="img" alt="Pré-visualização da imagem do formulário" src={definition.imageDataUrl} sx={{ height: "100%", objectFit: "cover", position: "absolute", width: "100%" }} /> : <Box component="img" alt="Imagem demonstrativa" src="/Rounded-Rectangle.svg" sx={{ height: "100%", objectFit: "cover", opacity: .85, width: "100%" }} />}</Box></Box></CardContent>
      </Card>

      <Card data-testid="questions-step" sx={{ border: 0, borderRadius: "8px", boxShadow: "0 2px 14px rgba(1, 93, 103, 0.05)", mb: 3, overflow: "hidden" }}>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, justifyContent: "space-between", px: { xs: 2, sm: 3.5 }, py: 2.5 }}>
          <Box><Typography component="h2" sx={{ color: GREEN, fontSize: { xs: 18, sm: 22 }, fontWeight: 700 }}>02 - Perguntas do Questionário</Typography><Typography sx={{ color: TEXT, fontSize: 12, mt: 0.5 }}>Crie e organize as perguntas do questionário.</Typography></Box>
          <Button data-testid="add-question" disabled={readOnly} onClick={() => setTypeDialog(true)} startIcon={<AddRoundedIcon />} sx={{ bgcolor: GREEN, color: "#fff", flexShrink: 0, px: 2.25, textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>Adicionar pergunta</Button>
        </Box>
        <Box sx={{ p: { xs: 2, sm: 3.5 } }}><Stack spacing={2}>{definition.questions.map((question, questionIndex) => <Card data-testid="question-card" draggable={!readOnly} key={question.id} onDragOver={(event) => event.preventDefault()} onDragStart={() => setDraggedQuestion(question.id)} onDrop={() => { if (draggedQuestion) moveQuestion(draggedQuestion, question.id); setDraggedQuestion(null); }} sx={{ border: `1px solid ${BORDER}`, borderRadius: "7px", boxShadow: "none", minWidth: 0 }}><CardContent sx={{ minWidth: 0, p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}><Box sx={{ alignItems: "center", display: "grid", gap: 1.25, gridTemplateColumns: { xs: "auto auto minmax(0, 1fr) auto", sm: "auto auto minmax(0, 1fr) auto" }, mb: 2.5 }}><DragIndicatorRoundedIcon aria-label="Arraste para reordenar" sx={{ color: GREEN, cursor: readOnly ? "default" : "grab" }} /><Typography sx={{ color: GREEN, fontWeight: 700 }}>{questionIndex + 1}.</Typography><Box sx={{ minWidth: 0 }}><Input disabled={readOnly} label="Pergunta" onChange={(value) => updateQuestion(question.id, { prompt: value })} value={question.prompt} /><Typography sx={{ color: TEXT, fontSize: 11, mt: 0.5 }}>Tipo: {question.type === "likert" ? "Escala Likert" : "Duas opções"}</Typography></Box><Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.25, justifyContent: "flex-end", minWidth: 0 }}><Button aria-label={`Mover pergunta ${questionIndex + 1} para cima`} disabled={readOnly || questionIndex === 0} onClick={() => moveQuestion(question.id, definition.questions[questionIndex - 1].id)} size="small" sx={{ color: GREEN, minWidth: 28, p: 0 }}>↑</Button><Button aria-label={`Mover pergunta ${questionIndex + 1} para baixo`} disabled={readOnly || questionIndex === definition.questions.length - 1} onClick={() => moveQuestion(question.id, definition.questions[questionIndex + 1].id)} size="small" sx={{ color: GREEN, minWidth: 28, p: 0 }}>↓</Button><IconButton aria-label={`Excluir pergunta ${questionIndex + 1}`} disabled={readOnly} onClick={() => removeQuestion(question.id)} size="small"><DeleteOutlineRoundedIcon /></IconButton></Box></Box><Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 120px 40px" }, mb: 1 }}><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>Alternativas</Typography><Typography sx={{ color: TEXT, display: { xs: "none", md: "block" }, fontSize: 12, fontWeight: 700 }}>Pontuação</Typography><Box /></Box><Stack spacing={1}>{question.alternatives.map((alternative) => <Box key={alternative.id} sx={{ alignItems: { xs: "stretch", md: "center" }, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 120px 40px" } }}><Input disabled={readOnly} label="Texto da alternativa" onChange={(value) => updateAlternative(question.id, alternative.id, { label: value })} value={alternative.label} /><TextField disabled={readOnly} fullWidth label="Pontuação" onChange={(event) => updateAlternative(question.id, alternative.id, { score: numberOrNull(event.target.value) })} size="small" type="number" value={alternative.score ?? ""} sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" }, "& input": { minWidth: 0 } }} /><IconButton aria-label="Excluir alternativa" disabled={readOnly || question.alternatives.length <= (question.type === "likert" ? 3 : 2)} onClick={() => updateQuestion(question.id, { alternatives: question.alternatives.filter((item) => item.id !== alternative.id) })} sx={{ alignSelf: { xs: "flex-start", md: "center" }, color: TEXT, justifySelf: { xs: "flex-end", md: "center" } }}><DeleteOutlineRoundedIcon /></IconButton></Box>)}</Stack><Button disabled={readOnly} onClick={() => updateQuestion(question.id, { alternatives: [...question.alternatives, emptyAlternative()] })} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, mt: 1.5, px: 0, textTransform: "none" }}>Adicionar alternativa</Button></CardContent></Card>)}</Stack></Box>
      </Card>

      <Card sx={{ border: 0, borderRadius: "8px", boxShadow: "0 2px 14px rgba(1, 93, 103, 0.05)", mb: 3 }}>
        <Box sx={{ alignItems: { xs: "flex-start", sm: "center" }, borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, justifyContent: "space-between", px: { xs: 2, sm: 3.5 }, py: 2.5 }}>
          <Box><Typography component="h2" sx={{ color: GREEN, fontSize: { xs: 18, sm: 22 }, fontWeight: 700 }}>03 - Faixa de Resultados</Typography><Typography sx={{ color: TEXT, fontSize: 12, mt: 0.5 }}>Defina os intervalos e a classificação exibida ao final do formulário.</Typography></Box>
          <Button disabled={readOnly} onClick={() => updateDefinition({ resultBands: [...definition.resultBands, { id: id("band"), minScore: null, maxScore: null, risk: "", description: "" }] })} startIcon={<AddRoundedIcon />} sx={{ bgcolor: GREEN, color: "#fff", flexShrink: 0, px: 2.25, textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>Adicionar faixa</Button>
        </Box>
        <Box sx={{ p: { xs: 2, sm: 3.5 } }}><Typography sx={{ color: TEXT, fontSize: 12, mb: 2 }}>As faixas usam percentual da pontuação (0 a 100%), não a pontuação bruta — o sistema normaliza automaticamente a soma das respostas para essa escala.</Typography><Box sx={{ display: { xs: "none", md: "grid" }, gap: 1.5, gridTemplateColumns: "minmax(190px, 1fr) minmax(160px, .8fr) minmax(260px, 1.5fr) 48px", mb: 1, px: 1.5 }}><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>Faixa (%)</Typography><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>Resultado</Typography><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>Descrição</Typography><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>Ações</Typography></Box><Stack spacing={1.5}>{definition.resultBands.map((band, index) => <Box data-testid="result-band" key={band.id} sx={{ border: `1px solid ${BORDER}`, borderRadius: "6px", display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "minmax(190px, 1fr) minmax(160px, .8fr) minmax(260px, 1.5fr) 48px" }, p: { xs: 1.5, sm: 2 } }}><Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr" } }}><TextField disabled={readOnly} inputProps={{ min: 0, max: 100 }} label="De (%)" onChange={(event) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, minScore: numberOrNull(event.target.value) } : item) })} size="small" type="number" value={band.minScore ?? ""} /><TextField disabled={readOnly} inputProps={{ min: 0, max: 100 }} label="Até (%)" onChange={(event) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, maxScore: numberOrNull(event.target.value) } : item) })} size="small" type="number" value={band.maxScore ?? ""} /></Box><Input disabled={readOnly} label="Resultado/Risco" onChange={(value) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, risk: value } : item) })} value={band.risk} /><Input disabled={readOnly} label="Descrição (opcional)" multiline onChange={(value) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, description: value } : item) })} value={band.description} /><IconButton aria-label={`Excluir faixa ${index + 1}`} disabled={readOnly} onClick={() => updateDefinition({ resultBands: definition.resultBands.filter((item) => item.id !== band.id) })} sx={{ alignSelf: { xs: "flex-start", md: "center" }, color: TEXT, justifySelf: { xs: "flex-end", md: "center" } }}><DeleteOutlineRoundedIcon /></IconButton></Box>)}</Stack><Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-start", mt: 2 }}><Button disabled={readOnly} onClick={() => updateDefinition({ resultBands: standardResultBands() })} sx={{ border: `1px solid ${GREEN}`, color: GREEN, textTransform: "none" }}>Preencher faixas padrão (Baixo/Médio/Alto)</Button></Box></Box>
      </Card>

      </Box>
      <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-end", pb: 3, pt: 1 }}><Button data-testid="back-form" onClick={() => router.push("/admin/formularios")} sx={{ border: `1px solid ${GREEN}`, color: GREEN, minWidth: 112, textTransform: "none" }}>Voltar</Button><Button data-testid="save-form" disabled={busy || readOnly || !definition.title.trim()} onClick={() => void persist()} sx={{ bgcolor: GREEN, color: "#fff", minWidth: 160, textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>{busy ? "Salvando..." : "Salvar alterações"}</Button><Button data-testid="publish-form" disabled={busy || readOnly || !definition.title.trim()} onClick={() => void persist("published")} sx={{ bgcolor: GREEN, color: "#fff", minWidth: 170, textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>{busy ? "Publicando..." : "Publicar Formulário"}</Button></Box>
    </Box><AdminFooter />
    <Dialog data-testid="question-type-dialog" onClose={() => setTypeDialog(false)} open={typeDialog} slotProps={{ paper: { sx: { borderRadius: "9px", maxWidth: 440, p: { xs: 3, sm: 4 }, position: "relative", width: "100%" } } }}>
      <IconButton aria-label="Fechar" onClick={() => setTypeDialog(false)} sx={{ position: "absolute", right: 16, top: 16 }}>
        <Box alt="" component="img" src="/fechar.svg" sx={{ height: 20, width: 20 }} />
      </IconButton>
      <Typography component="h2" sx={{ color: GREEN, fontSize: { xs: 20, sm: 22 }, fontWeight: 600, mb: 1, pr: 4 }}>
        Adicionar Pergunta
      </Typography>
      <Typography sx={{ color: TEXT, fontSize: 13, mb: 3 }}>
        Selecione o tipo de pergunta que deseja adicionar
      </Typography>
      <Stack spacing={2}>
        {[
          { type: "two-options" as const, title: "Duas Opções", description: "padrão de duas opções, podendo adicionar alternativas." },
          { type: "likert" as const, title: "Escala Likert", description: "padrão com escala de concordância editável." },
        ].map((option) => (
          <Box
            component="button"
            key={option.type}
            onClick={() => { updateDefinition({ questions: [...definition.questions, emptyQuestion(option.type)] }); setTypeDialog(false); }}
            sx={{ alignItems: "center", background: "none", border: `1px solid ${BORDER}`, borderRadius: "6px", cursor: "pointer", display: "flex", justifyContent: "space-between", p: 2, textAlign: "left", width: "100%", "&:hover": { borderColor: GREEN } }}
          >
            <Box>
              <Typography sx={{ color: GREEN, fontSize: 15, fontWeight: 700 }}>{option.title}</Typography>
              <Typography sx={{ color: TEXT, fontSize: 12, mt: 0.5 }}>{option.description}</Typography>
            </Box>
            <ChevronRightRoundedIcon sx={{ color: GREEN, flexShrink: 0 }} />
          </Box>
        ))}
      </Stack>
    </Dialog>
  </Box>;
}
