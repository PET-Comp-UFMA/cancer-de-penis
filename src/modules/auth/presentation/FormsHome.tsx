import { Alert, AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { AuthUser } from "./api";
import { getSession, logout } from "./api";

export default function FormsHome({ user }: { user: AuthUser }) {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [csrfToken, setCsrfToken] = useState("");
  useEffect(() => { getSession().then((session) => setCsrfToken(session.csrfToken)).catch(() => undefined); }, []);
  async function signOut() {
    setLoading(true); setError("");
    try {
      let token = csrfToken || (await getSession()).csrfToken;
      try { await logout(token); }
      catch (caught) {
        if ((caught as Error & { status?: number }).status !== 403) throw caught;
        token = (await getSession()).csrfToken;
        setCsrfToken(token);
        await logout(token);
      }
      await router.replace("/admin/login");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível sair."); setLoading(false); }
  }
  const isAdmin = user.roles.includes("admin");
  return <Box sx={{ minHeight: "100vh", bgcolor: "#f4f8f8" }}><AppBar position="static" elevation={0} sx={{ bgcolor: "#015D67" }}><Toolbar><Image src="/logo-avaliapen.svg" alt="AvaliPen" width={155} height={52} priority style={{ width: "auto", height: 52 }} /><Box sx={{ flexGrow: 1 }} /><Typography sx={{ mr: 2, display: { xs: "none", sm: "block" } }}>{user.username}</Typography><Button color="inherit" onClick={signOut} disabled={loading}>Sair</Button></Toolbar></AppBar><Container maxWidth="md" sx={{ py: { xs: 5, sm: 9 } }}>{error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}{isAdmin ? <><Typography component="h1" variant="h4" sx={{ color: "#015D67", fontWeight: 700, mb: 2 }}>Formulários</Typography><Alert severity="info">A gestão de formulários será disponibilizada na próxima etapa.</Alert></> : <Alert severity="info"><Typography fontWeight={700}>Acesso de responsável</Typography>Seu usuário foi provisionado, mas a gestão de formulários requer o perfil de administrador. Entre em contato com o responsável pelo sistema.</Alert>}</Container></Box>;
}
