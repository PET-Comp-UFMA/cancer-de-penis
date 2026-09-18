import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useRef, useState } from "react";
import { changePassword, getSession } from "./api";

const validLength = (value: string) => value.length >= 12 && value.length <= 128;

export default function ChangePasswordForm({ initialCsrfToken = "" }: { initialCsrfToken?: string }) {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState(initialCsrfToken);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState("");
  const currentRef = useRef<HTMLInputElement>(null); const newRef = useRef<HTMLInputElement>(null); const confirmationRef = useRef<HTMLInputElement>(null);

  async function bootstrap() { setBootstrapError(""); try { const session = await getSession(); setCsrfToken(session.csrfToken); } catch { setBootstrapError("Não foi possível verificar a sessão."); } }
  useEffect(() => { if (!csrfToken) void bootstrap(); }, [csrfToken]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!currentPassword || !validLength(newPassword) || newPassword !== confirmation) {
      setError(!currentPassword ? "Informe sua senha atual." : !validLength(newPassword) ? "A nova senha deve ter entre 12 e 128 caracteres." : "As novas senhas devem coincidir.");
      if (!currentPassword) currentRef.current?.focus(); else if (!validLength(newPassword)) newRef.current?.focus(); else confirmationRef.current?.focus(); return;
    }
    setLoading(true);
    try {
      let result;
      try { result = await changePassword(currentPassword, newPassword, csrfToken); }
      catch (caught) {
        if ((caught as Error & { status?: number }).status !== 403) throw caught;
        const session = await getSession(); setCsrfToken(session.csrfToken);
        result = await changePassword(currentPassword, newPassword, session.csrfToken);
      }
      setSuccess("Senha alterada com sucesso.");
      await router.replace(result.redirectTo || "/admin/formularios");
    } catch (caught) {
      const status = (caught as Error & { status?: number }).status;
      if (status === 401) await router.replace("/admin/login?reason=expired");
      else setError(caught instanceof Error ? caught.message : "Não foi possível alterar a senha.");
    } finally { setLoading(false); }
  }
  const fieldProps = { type: show ? "text" : "password", disabled: loading, inputProps: { maxLength: 128 }, InputProps: { endAdornment: <InputAdornment position="end"><IconButton sx={{ minWidth: 44, minHeight: 44 }} aria-label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show} onClick={() => setShow((value) => !value)} edge="end"><span aria-hidden="true">{show ? <VisibilityOff /> : <Visibility />}</span></IconButton></InputAdornment> } };
  return <Box component="form" onSubmit={submit} noValidate>
    {bootstrapError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{bootstrapError} <Button size="small" onClick={() => void bootstrap()}>Tentar novamente</Button></Alert>}
    {error && <Alert id="change-password-error" severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
    {success && <Alert severity="success" role="status" sx={{ mb: 2 }}>{success}</Alert>}
    <TextField fullWidth label="Senha atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" inputRef={currentRef} aria-describedby={error ? "change-password-error" : undefined} margin="normal" {...fieldProps} />
    <TextField fullWidth label="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" inputRef={newRef} aria-describedby={error ? "change-password-error" : undefined} helperText="Use entre 12 e 128 caracteres." margin="normal" {...fieldProps} />
    <TextField fullWidth label="Confirme a nova senha" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" inputRef={confirmationRef} aria-describedby={error ? "change-password-error" : undefined} margin="normal" {...fieldProps} />
    <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, bgcolor: "#015D67" }}>{loading ? <CircularProgress size={24} color="inherit" /> : "Alterar senha"}</Button>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>Se precisar de ajuda, entre em contato com o responsável pelo sistema.</Typography>
  </Box>;
}
