import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getSession, login } from "./api";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const bootstrap = useCallback(async () => {
    setLoading(true); setBootstrapError("");
    try {
      const session = await getSession();
      setCsrfToken(session.csrfToken);
      if (session.user) await router.replace(session.mustChangePassword ? "/admin/alterar-senha" : "/admin/formularios");
    } catch { setBootstrapError("Não foi possível verificar a sessão."); }
    finally { setLoading(false); }
  }, [router]);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Informe seu nome de usuário e sua senha.");
      (!username.trim() ? usernameRef : passwordRef).current?.focus();
      return;
    }
    setLoading(true);
    try {
      let token = csrfToken;
      if (!token) {
        const session = await getSession();
        setCsrfToken(session.csrfToken); token = session.csrfToken;
        if (session.user) { await router.replace(session.mustChangePassword ? "/admin/alterar-senha" : "/admin/formularios"); return; }
      }
      let result;
      try {
        result = await login(username.trim(), password, token);
      } catch (caught) {
        if ((caught as Error & { status?: number }).status !== 403) throw caught;
        const session = await getSession();
        setCsrfToken(session.csrfToken);
        if (session.user) { await router.replace(session.mustChangePassword ? "/admin/alterar-senha" : "/admin/formularios"); return; }
        result = await login(username.trim(), password, session.csrfToken);
      }
      await router.replace(result.redirectTo || (result.mustChangePassword ? "/admin/alterar-senha" : "/admin/formularios"));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível entrar."); }
    finally { setLoading(false); }
  }

  return <Box component="form" onSubmit={submit} noValidate>
    {bootstrapError && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{bootstrapError} <Button size="small" onClick={() => void bootstrap()}>Tentar novamente</Button></Alert>}
    {router.query.reason === "expired" && <Alert severity="info" sx={{ mb: 2 }}>Sua sessão expirou. Entre novamente.</Alert>}
    {error && <Alert id="login-error" severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
    <TextField inputRef={usernameRef} fullWidth label="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus disabled={loading} margin="normal" slotProps={{ htmlInput: { maxLength: 64, "aria-describedby": error ? "login-error" : undefined } }} />
    <TextField inputRef={passwordRef} fullWidth label="Senha" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={loading} margin="normal" slotProps={{ htmlInput: { maxLength: 128, "aria-describedby": error ? "login-error" : undefined }, input: { endAdornment: <InputAdornment position="end"><IconButton sx={{ minWidth: 44, minHeight: 44 }} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)} edge="end"><span aria-hidden="true">{showPassword ? <VisibilityOff /> : <Visibility />}</span></IconButton></InputAdornment> } }} />
    <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 3, bgcolor: "#015D67" }}>{loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}</Button>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>Esqueceu sua senha? Entre em contato com o responsável pelo sistema.</Typography>
  </Box>;
}

