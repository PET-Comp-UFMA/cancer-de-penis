import { Alert, Box } from "@mui/material";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getSession, logout } from "@/modules/auth/presentation/api";
import { HomeContent } from "@/modules/inicio/presentation/Home";
import { AdminFooter, AdminHeader } from "./AdminChrome";

const PAGE_BACKGROUND = "#FAFCFC";

export default function AdminHome() {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (active) setCsrfToken(session.csrfToken);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    setLoggingOut(true);
    setError("");
    try {
      let token = csrfToken || (await getSession()).csrfToken;
      try {
        await logout(token);
      } catch (caught) {
        if ((caught as Error & { status?: number }).status !== 403) throw caught;
        token = (await getSession()).csrfToken;
        setCsrfToken(token);
        await logout(token);
      }
      await router.replace("/admin/login");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível sair.");
      setLoggingOut(false);
    }
  }

  return (
    <Box sx={{ bgcolor: PAGE_BACKGROUND, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Head>
        <title>Início | Administração</title>
        <meta name="description" content="Página inicial da área administrativa." />
      </Head>
      <AdminHeader activePage="home" loggingOut={loggingOut} onLogout={signOut} />
      <Box component="main" sx={{ flex: 1 }}>
        {error && <Alert severity="error" sx={{ m: { xs: 2, sm: 3 } }}>{error}</Alert>}
        <HomeContent />
      </Box>
      <AdminFooter />
    </Box>
  );
}
