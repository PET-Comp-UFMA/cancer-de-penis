import AddRoundedIcon from "@mui/icons-material/AddRounded";
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
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
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
const emptyQuestion = (type: FormQuestionType) => ({
  id: id("question"),
  prompt: "",
  type,
  alternatives: Array.from({ length: type === "likert" ? 5 : 2 }, emptyAlternative),
});
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

function Input({ label, value, onChange, disabled = false, multiline = false, required = false, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; disabled?: boolean; multiline?: boolean; required?: boolean; type?: string;
}) {
  return <TextField disabled={disabled} fullWidth label={label} multiline={multiline} onChange={(event) => onChange(event.target.value)} required={required} size="small" type={type} value={value} />;
}

function Step({ number, title, complete, children, testId }: { number: string; title: string; complete: boolean; children: ReactNode; testId?: string }) {
  return <Card data-testid={testId} sx={{ border: `1px solid ${BORDER}`, borderRadius: "8px", boxShadow: "none", mb: 3 }}>
    <Box sx={{ alignItems: "center", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 1.5, p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ alignItems: "center", bgcolor: complete ? GREEN : "transparent", border: `1px solid ${GREEN}`, borderRadius: "50%", color: complete ? "#fff" : GREEN, display: "flex", fontSize: 13, fontWeight: 700, height: 30, justifyContent: "center", width: 30 }}>{complete ? "✓" : number}</Box>
      <Typography component="h2" sx={{ color: GREEN, fontSize: { xs: 17, sm: 20 }, fontWeight: 700 }}>{number} - {title}</Typography>
    </Box>
    <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>{children}</CardContent>
  </Card>;
}

export default function FormEditor({ formId, initialForm }: { user: AuthUser; formId?: string; initialForm?: FormDetail }) {
  const router = useRouter();
  const [definition, setDefinition] = useState<FormDefinition>(initialForm?.definition ?? emptyDefinition);
  const [currentId, setCurrentId] = useState(formId ?? initialForm?.id ?? "");
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
      setDefinition(form.definition); setRevision(form.revision); setStatus(form.status); setCurrentId(form.id);
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
    <Box component="main" data-testid="editor" sx={{ flex: 1, maxWidth: 1315, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 4, sm: 5 }, width: "100%" }}>
      <Box sx={{ mb: 3, textAlign: "center" }}><Typography component="h1" sx={{ color: GREEN, fontSize: { xs: 28, sm: 38 }, fontWeight: 700 }}>{currentId ? (definition.title || "Editar formulário") : "Novo Formulário"}</Typography><Typography sx={{ color: TEXT, fontSize: 12, mt: 1 }}>Crie novas ferramentas de avaliação.</Typography><Box data-testid="stepper" sx={{ display: "flex", justifyContent: "center", mt: 2 }}>{stepsComplete.map((complete, index) => <Box key={index} sx={{ alignItems: "center", display: "flex" }}><Box sx={{ alignItems: "center", bgcolor: complete ? GREEN : BACKGROUND, border: `1px solid ${GREEN}`, borderRadius: "50%", color: complete ? "#fff" : GREEN, display: "flex", fontSize: 11, fontWeight: 700, height: 25, justifyContent: "center", width: 25 }}>{complete ? "✓" : `0${index + 1}`}</Box>{index < 2 && <Box sx={{ bgcolor: "#B9C9CA", height: 1, width: { xs: 36, sm: 80 } }} />}</Box>)}</Box></Box>
      {error && <Alert onClose={() => setError("")} severity="error" sx={{ mb: 2 }}>{error}</Alert>}{success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}{status === "published" && <Alert severity="info" sx={{ mb: 3 }}>Este formulário está publicado. Salvar cria ou atualiza o rascunho e mantém a versão pública até uma nova publicação.</Alert>}
      <Box component="fieldset" disabled={busy} onDragStart={(event) => { if (busy) event.preventDefault(); }} sx={{ border: 0, m: 0, minWidth: 0, p: 0 }}>
      <Step complete={stepsComplete[0]} number="01" title="Dados do Formulário">
        <Stack spacing={2}><Input disabled={readOnly} label="Nome do Formulário" onChange={(value) => updateDefinition({ title: value })} required value={definition.title} /><Input disabled={readOnly} label="Descrição" multiline onChange={(value) => updateDefinition({ description: value })} value={definition.description} /><Box><Typography sx={{ color: TEXT, fontSize: 15, fontWeight: 700, mb: 1 }}>Autores do Formulário</Typography>{definition.authors.map((author, index) => <Box key={author.id} sx={{ alignItems: "center", display: "flex", gap: 1, mb: 1 }}><Input disabled={readOnly} label="Nome do Autor" onChange={(value) => updateDefinition({ authors: definition.authors.map((item) => item.id === author.id ? { ...item, name: value } : item) })} value={author.name} /><Input disabled={readOnly} label="Instituição" onChange={(value) => updateDefinition({ authors: definition.authors.map((item) => item.id === author.id ? { ...item, institution: value } : item) })} value={author.institution} /><IconButton aria-label={`Remover autor ${index + 1}`} disabled={readOnly || definition.authors.length === 1} onClick={() => updateDefinition({ authors: definition.authors.filter((item) => item.id !== author.id) })}><RemoveCircleOutlineRoundedIcon /></IconButton></Box>)}<Button disabled={readOnly} onClick={() => updateDefinition({ authors: [...definition.authors, { id: id("author"), name: "", institution: "" }] })} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, textTransform: "none" }}>Adicionar autor</Button></Box><Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}><Button component="label" disabled={readOnly} startIcon={<ImageOutlinedIcon />} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>Adicionar imagem<input accept="image/*" hidden onChange={handleImage} type="file" /></Button>{definition.imageDataUrl && <Box component="img" alt="Pré-visualização da imagem do formulário" src={definition.imageDataUrl} sx={{ borderRadius: 2, height: 82, objectFit: "cover", width: 140 }} />}</Box></Stack>
      </Step>

      <Step complete={stepsComplete[1]} number="02" title="Perguntas do Questionário" testId="questions-step"><Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}><Button data-testid="add-question" disabled={readOnly} onClick={() => setTypeDialog(true)} startIcon={<AddRoundedIcon />} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none" }}>Adicionar pergunta</Button></Box><Stack spacing={2}>{definition.questions.map((question, questionIndex) => <Card data-testid="question-card" draggable={!readOnly} key={question.id} onDragOver={(event) => event.preventDefault()} onDragStart={() => setDraggedQuestion(question.id)} onDrop={() => { if (draggedQuestion) moveQuestion(draggedQuestion, question.id); setDraggedQuestion(null); }} sx={{ border: `1px solid ${BORDER}`, boxShadow: "none" }}><CardContent><Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 2 }}><DragIndicatorRoundedIcon aria-label="Arraste para reordenar" sx={{ color: GREEN, cursor: readOnly ? "default" : "grab" }} /><Typography sx={{ color: GREEN, fontWeight: 700 }}>{questionIndex + 1}.</Typography><Typography sx={{ color: TEXT, fontSize: 13 }}>Tipo: {question.type === "likert" ? "Escala Likert" : "Duas opções"}</Typography><Box sx={{ flex: 1 }} /><Button disabled={readOnly || questionIndex === 0} onClick={() => moveQuestion(question.id, definition.questions[questionIndex - 1].id)} size="small" sx={{ minWidth: 28, p: 0 }}>↑</Button><Button disabled={readOnly || questionIndex === definition.questions.length - 1} onClick={() => moveQuestion(question.id, definition.questions[questionIndex + 1].id)} size="small" sx={{ minWidth: 28, p: 0 }}>↓</Button><IconButton aria-label={`Excluir pergunta ${questionIndex + 1}`} disabled={readOnly} onClick={() => removeQuestion(question.id)} size="small"><DeleteOutlineRoundedIcon /></IconButton></Box><Input disabled={readOnly} label="Pergunta" onChange={(value) => updateQuestion(question.id, { prompt: value })} value={question.prompt} /><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700, mt: 2 }}>Alternativas</Typography><Stack spacing={1} sx={{ mt: 1 }}>{question.alternatives.map((alternative) => <Box key={alternative.id} sx={{ alignItems: "center", display: "flex", gap: 1 }}><Input disabled={readOnly} label="Texto da alternativa" onChange={(value) => updateAlternative(question.id, alternative.id, { label: value })} value={alternative.label} /><TextField disabled={readOnly} fullWidth label="Pontuação" onChange={(event) => updateAlternative(question.id, alternative.id, { score: numberOrNull(event.target.value) })} size="small" type="number" value={alternative.score ?? ""} /><IconButton aria-label="Excluir alternativa" disabled={readOnly || question.alternatives.length <= (question.type === "likert" ? 3 : 2)} onClick={() => updateQuestion(question.id, { alternatives: question.alternatives.filter((item) => item.id !== alternative.id) })}><DeleteOutlineRoundedIcon /></IconButton></Box>)}</Stack><Button disabled={readOnly} onClick={() => updateQuestion(question.id, { alternatives: [...question.alternatives, emptyAlternative()] })} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, mt: 1, textTransform: "none" }}>Adicionar alternativa</Button></CardContent></Card>)}</Stack></Step>

      <Step complete={stepsComplete[2]} number="03" title="Faixas de Resultados"><Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}><Button disabled={readOnly} onClick={() => updateDefinition({ resultBands: [...definition.resultBands, { id: id("band"), minScore: null, maxScore: null, risk: "", description: "" }] })} startIcon={<AddRoundedIcon />} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none" }}>Adicionar faixa</Button></Box><Stack spacing={1.5}>{definition.resultBands.map((band, index) => <Box data-testid="result-band" key={band.id} sx={{ alignItems: "center", border: `1px solid ${BORDER}`, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "0.7fr 0.7fr 1fr 1.5fr auto" }, p: 2 }}><TextField disabled={readOnly} label="De" onChange={(event) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, minScore: numberOrNull(event.target.value) } : item) })} size="small" type="number" value={band.minScore ?? ""} /><TextField disabled={readOnly} label="Até" onChange={(event) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, maxScore: numberOrNull(event.target.value) } : item) })} size="small" type="number" value={band.maxScore ?? ""} /><Input disabled={readOnly} label="Resultado/Risco" onChange={(value) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, risk: value } : item) })} value={band.risk} /><Input disabled={readOnly} label="Descrição (opcional)" multiline onChange={(value) => updateDefinition({ resultBands: definition.resultBands.map((item) => item.id === band.id ? { ...item, description: value } : item) })} value={band.description} /><IconButton aria-label={`Excluir faixa ${index + 1}`} disabled={readOnly} onClick={() => updateDefinition({ resultBands: definition.resultBands.filter((item) => item.id !== band.id) })}><DeleteOutlineRoundedIcon /></IconButton></Box>)}</Stack></Step>

      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-end", pb: 3 }}><Button data-testid="back-form" onClick={() => router.push("/admin/formularios")} sx={{ border: `1px solid ${GREEN}`, color: GREEN, textTransform: "none" }}>Voltar</Button><Button data-testid="save-form" disabled={busy || readOnly || !definition.title.trim()} onClick={() => void persist()} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none" }}>{busy ? "Salvando..." : "Salvar alterações"}</Button><Button data-testid="publish-form" disabled={busy || readOnly || !definition.title.trim()} onClick={() => void persist("published")} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none" }}>{busy ? "Publicando..." : "Publicar Formulário"}</Button></Box>
    </Box><AdminFooter />
    <Dialog data-testid="question-type-dialog" onClose={() => setTypeDialog(false)} open={typeDialog}><DialogTitle>Escolha o tipo da pergunta</DialogTitle><DialogContent><Stack spacing={1} sx={{ minWidth: { xs: 240, sm: 360 }, pt: 1 }}><Button onClick={() => { updateDefinition({ questions: [...definition.questions, emptyQuestion("two-options")] }); setTypeDialog(false); }} variant="outlined">Duas opções</Button><Button onClick={() => { updateDefinition({ questions: [...definition.questions, emptyQuestion("likert")] }); setTypeDialog(false); }} variant="outlined">Escala Likert</Button></Stack></DialogContent><DialogActions><Button onClick={() => setTypeDialog(false)}>Cancelar</Button></DialogActions></Dialog>
  </Box>;
}
