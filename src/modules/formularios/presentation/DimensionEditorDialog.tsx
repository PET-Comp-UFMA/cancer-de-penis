import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { FormDimension, FormQuestion, FormQuestionType, FormResultBand } from "../domain/types";
import { TEXT_LIMITS } from "../domain/limits";

const GREEN = "#015D67";
const TEXT = "#425466";
const BORDER = "#D9D9D9";
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emptyAlternative = () => ({ id: id("alternative"), label: "", score: null });
const likertDefaults = [
  { label: "Discordo totalmente", score: -2 },
  { label: "Discordo um pouco", score: -1 },
  { label: "Nem discordo, nem concordo", score: 0 },
  { label: "Concordo um pouco", score: 1 },
  { label: "Concordo totalmente", score: 2 },
];
const emptyQuestion = (type: FormQuestionType): FormQuestion => ({
  id: id("question"), prompt: "", type,
  alternatives: type === "likert"
    ? likertDefaults.map((preset) => ({ id: id("alternative"), ...preset }))
    : Array.from({ length: 2 }, emptyAlternative),
});
const emptyBand = (): FormResultBand => ({ id: id("band"), minScore: null, maxScore: null, risk: "", description: "" });
const emptyDimension = (): FormDimension => ({ id: id("dimension"), name: "", description: "", questions: [], resultBands: [] });
const standardBands = (): FormResultBand[] => [
  { id: id("band"), minScore: 0, maxScore: 33, risk: "Risco Baixo", description: "" },
  { id: id("band"), minScore: 34, maxScore: 66, risk: "Risco Médio", description: "" },
  { id: id("band"), minScore: 67, maxScore: 100, risk: "Risco Alto", description: "" },
];

function numberOrNull(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function Field({ label, value, onChange, maxLength, disabled = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; maxLength: number; disabled?: boolean; multiline?: boolean }) {
  return <TextField disabled={disabled} fullWidth helperText={`${value.length}/${maxLength}`} label={label} multiline={multiline} onChange={(event) => onChange(event.target.value)} size="small" value={value} slotProps={{ htmlInput: { maxLength }, formHelperText: { sx: { color: TEXT, fontSize: 11, mt: 0.25, textAlign: "right" } } }} sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff", borderRadius: "5px" } }} />;
}

export default function DimensionEditorDialog({ open, dimension, readOnly, onClose, onDirtyChange, onSave }: { open: boolean; dimension?: FormDimension; readOnly: boolean; onClose: () => void; onDirtyChange: (dirty: boolean) => void; onSave: (dimension: FormDimension) => void }) {
  const [draft, setDraft] = useState<FormDimension>(() => dimension ?? emptyDimension());
  const [initialDraft] = useState(() => JSON.stringify(draft));
  const [typeDialog, setTypeDialog] = useState(false);
  const [discardDialog, setDiscardDialog] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState<string | null>(null);
  const isDirty = !readOnly && JSON.stringify(draft) !== initialDraft;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  function update(patch: Partial<FormDimension>) { setDraft((current) => ({ ...current, ...patch })); }
  function updateQuestion(questionId: string, patch: Partial<FormQuestion>) { update({ questions: draft.questions.map((question) => question.id === questionId ? { ...question, ...patch } : question) }); }
  function updateAlternative(questionId: string, alternativeId: string, patch: { label?: string; score?: number | null }) { update({ questions: draft.questions.map((question) => question.id === questionId ? { ...question, alternatives: question.alternatives.map((alternative) => alternative.id === alternativeId ? { ...alternative, ...patch } : alternative) } : question) }); }
  function moveQuestion(fromId: string, toId: string) { const questions = [...draft.questions]; const from = questions.findIndex((question) => question.id === fromId); const to = questions.findIndex((question) => question.id === toId); if (from < 0 || to < 0) return; const [item] = questions.splice(from, 1); questions.splice(to, 0, item); update({ questions }); }
  function requestClose() { if (!readOnly && JSON.stringify(draft) !== initialDraft) { setDiscardDialog(true); return; } onClose(); }

  return <>
  <Dialog aria-labelledby="dimension-editor-dialog-title" fullWidth maxWidth="md" onClose={requestClose} open={open} slotProps={{ paper: { sx: { borderRadius: "10px", maxHeight: "92vh" } } }}>
    <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
      <Typography component="h2" id="dimension-editor-dialog-title" sx={{ color: GREEN, fontSize: 24, fontWeight: 700, mb: 0.5 }}>{dimension ? "Editar dimensão" : "Adicionar dimensão"}</Typography>
      <Typography sx={{ color: TEXT, fontSize: 13, mb: 3 }}>Configure as perguntas e faixas próprias desta dimensão.</Typography>
      <Stack spacing={2.5}>
        <Field disabled={readOnly} label="Nome da dimensão" maxLength={TEXT_LIMITS.dimensionName} onChange={(value) => update({ name: value })} value={draft.name} />
        <Field disabled={readOnly} label="Descrição" maxLength={TEXT_LIMITS.dimensionDescription} multiline onChange={(value) => update({ description: value })} value={draft.description} />
        <Box>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.25 }}><Typography sx={{ color: GREEN, fontSize: 17, fontWeight: 700 }}>Perguntas</Typography><Button disabled={readOnly} onClick={() => setTypeDialog(true)} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, textTransform: "none" }}>Adicionar pergunta</Button></Box>
          <Stack spacing={1.5}>{draft.questions.map((question, questionIndex) => <Card draggable={!readOnly} key={question.id} onDragOver={(event) => event.preventDefault()} onDragStart={() => setDraggedQuestion(question.id)} onDrop={() => { if (draggedQuestion) moveQuestion(draggedQuestion, question.id); setDraggedQuestion(null); }} sx={{ border: `1px solid ${BORDER}`, boxShadow: "none" }}><CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}><Box sx={{ alignItems: "center", display: "grid", gap: 1, gridTemplateColumns: "auto auto minmax(0,1fr) auto", mb: 1.5 }}><DragIndicatorRoundedIcon sx={{ color: GREEN }} /><Typography sx={{ color: GREEN, fontWeight: 700 }}>{questionIndex + 1}.</Typography><Field disabled={readOnly} label="Pergunta" maxLength={TEXT_LIMITS.question} onChange={(value) => updateQuestion(question.id, { prompt: value })} value={question.prompt} /><Box sx={{ display: "flex" }}><Button aria-label={`Mover pergunta ${questionIndex + 1} para cima`} disabled={readOnly || questionIndex === 0} onClick={() => moveQuestion(question.id, draft.questions[questionIndex - 1].id)} sx={{ color: GREEN, minWidth: 26, p: 0 }}>↑</Button><Button aria-label={`Mover pergunta ${questionIndex + 1} para baixo`} disabled={readOnly || questionIndex === draft.questions.length - 1} onClick={() => moveQuestion(question.id, draft.questions[questionIndex + 1].id)} sx={{ color: GREEN, minWidth: 26, p: 0 }}>↓</Button><IconButton aria-label={`Excluir pergunta ${questionIndex + 1}`} disabled={readOnly} onClick={() => update({ questions: draft.questions.filter((item) => item.id !== question.id) })} size="small"><DeleteOutlineRoundedIcon /></IconButton></Box></Box><Typography sx={{ color: TEXT, fontSize: 12, fontWeight: 700, mb: 0.75 }}>Alternativas e pontuações · {question.type === "likert" ? "Escala Likert" : "Duas opções"}</Typography><Stack spacing={1}>{question.alternatives.map((alternative) => <Box key={alternative.id} sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "minmax(0,1fr) 120px 40px" } }}><Field disabled={readOnly} label="Texto da alternativa" maxLength={TEXT_LIMITS.alternative} onChange={(value) => updateAlternative(question.id, alternative.id, { label: value })} value={alternative.label} /><TextField disabled={readOnly} fullWidth label="Pontuação" onChange={(event) => updateAlternative(question.id, alternative.id, { score: numberOrNull(event.target.value) })} size="small" type="number" value={alternative.score ?? ""} /><IconButton aria-label="Excluir alternativa" disabled={readOnly || question.alternatives.length <= (question.type === "likert" ? 3 : 2)} onClick={() => updateQuestion(question.id, { alternatives: question.alternatives.filter((item) => item.id !== alternative.id) })} sx={{ justifySelf: { xs: "end", sm: "center" } }}><DeleteOutlineRoundedIcon /></IconButton></Box>)}</Stack><Button disabled={readOnly} onClick={() => updateQuestion(question.id, { alternatives: [...question.alternatives, emptyAlternative()] })} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, mt: 1, px: 0, textTransform: "none" }}>Adicionar alternativa</Button></CardContent></Card>)}</Stack>
        </Box>
        <Box>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.25 }}><Typography sx={{ color: GREEN, fontSize: 17, fontWeight: 700 }}>Faixas de resultados</Typography><Button disabled={readOnly} onClick={() => update({ resultBands: [...draft.resultBands, emptyBand()] })} startIcon={<AddRoundedIcon />} sx={{ color: GREEN, textTransform: "none" }}>Adicionar faixa</Button></Box>
          <Stack spacing={1.25}>{draft.resultBands.map((band, index) => <Box key={band.id} sx={{ border: `1px solid ${BORDER}`, borderRadius: 1, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, p: 1.5 }}><TextField disabled={readOnly} inputProps={{ min: 0, max: 100, step: 1 }} label="De (%)" onChange={(event) => update({ resultBands: draft.resultBands.map((item) => item.id === band.id ? { ...item, minScore: numberOrNull(event.target.value) } : item) })} size="small" type="number" value={band.minScore ?? ""} /><TextField disabled={readOnly} inputProps={{ min: 0, max: 100, step: 1 }} label="Até (%)" onChange={(event) => update({ resultBands: draft.resultBands.map((item) => item.id === band.id ? { ...item, maxScore: numberOrNull(event.target.value) } : item) })} size="small" type="number" value={band.maxScore ?? ""} /><Field disabled={readOnly} label="Resultado/Risco" maxLength={TEXT_LIMITS.risk} onChange={(value) => update({ resultBands: draft.resultBands.map((item) => item.id === band.id ? { ...item, risk: value } : item) })} value={band.risk} /><Field disabled={readOnly} label="Descrição (opcional)" maxLength={TEXT_LIMITS.bandDescription} multiline onChange={(value) => update({ resultBands: draft.resultBands.map((item) => item.id === band.id ? { ...item, description: value } : item) })} value={band.description} /><IconButton aria-label={`Excluir faixa ${index + 1}`} disabled={readOnly} onClick={() => update({ resultBands: draft.resultBands.filter((item) => item.id !== band.id) })} sx={{ justifySelf: "end" }}><DeleteOutlineRoundedIcon /></IconButton></Box>)}</Stack>
          <Button disabled={readOnly} onClick={() => update({ resultBands: standardBands() })} sx={{ color: GREEN, mt: 1, textTransform: "none" }}>Preencher faixas padrão (Baixo/Médio/Alto)</Button>
        </Box>
      </Stack>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", mt: 3 }}><Button onClick={requestClose} sx={{ color: GREEN, textTransform: "none" }}>Cancelar</Button><Button disabled={readOnly} onClick={() => { onSave(draft); onClose(); }} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>Salvar dimensão</Button></Box>
    </Box>
    <Dialog aria-labelledby="dimension-question-type-dialog-title" onClose={() => setTypeDialog(false)} open={typeDialog} slotProps={{ paper: { sx: { borderRadius: 2, p: 3 } } }}><Typography id="dimension-question-type-dialog-title" sx={{ color: GREEN, fontWeight: 700, mb: 2 }}>Tipo de pergunta</Typography><Stack spacing={1}><Button disabled={readOnly} onClick={() => { update({ questions: [...draft.questions, emptyQuestion("two-options")] }); setTypeDialog(false); }} sx={{ justifyContent: "flex-start", textTransform: "none" }}>Duas opções</Button><Button disabled={readOnly} onClick={() => { update({ questions: [...draft.questions, emptyQuestion("likert")] }); setTypeDialog(false); }} sx={{ justifyContent: "flex-start", textTransform: "none" }}>Escala Likert</Button></Stack></Dialog>
  </Dialog>
  <Dialog aria-labelledby="dimension-discard-dialog-title" onClose={() => setDiscardDialog(false)} open={discardDialog} slotProps={{ paper: { sx: { borderRadius: 2, p: 3 } } }}>
    <Typography component="h2" id="dimension-discard-dialog-title" sx={{ color: GREEN, fontWeight: 700, mb: 1.5 }}>Descartar alterações?</Typography>
    <Typography sx={{ color: TEXT, fontSize: 14, mb: 2.5 }}>As alterações desta dimensão ainda não foram incorporadas ao formulário.</Typography>
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
      <Button onClick={() => setDiscardDialog(false)} sx={{ color: GREEN, textTransform: "none" }}>Continuar editando</Button>
      <Button onClick={() => { setDiscardDialog(false); onClose(); }} sx={{ bgcolor: GREEN, color: "#fff", textTransform: "none", "&:hover": { bgcolor: "#014b53" } }}>Descartar</Button>
    </Box>
  </Dialog>
  </>;
}
