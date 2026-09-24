import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { AppBar, Box, IconButton, Link, Toolbar, Tooltip, Typography } from "@mui/material";
import NextLink from "next/link";

const FOREST_GREEN = "#015D67";
const PAGE_BACKGROUND = "#FAFCFC";
const FOOTER_SEPARATOR = "#E5EEEF";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Typography
      component="span"
      sx={{
        color: PAGE_BACKGROUND,
        display: "inline-flex",
        flexDirection: "column",
        fontSize: compact ? { xs: 22, sm: 28 } : { xs: 30, sm: 34.84 },
        fontWeight: 600,
        letterSpacing: "-0.03em",
        lineHeight: 0.78,
        whiteSpace: "nowrap",
      }}
    >
      <span>Câncer</span>
      <span style={{ paddingLeft: compact ? 25 : 25 }}>de Pênis</span>
    </Typography>
  );
}

export type AdminActivePage = "home" | "forms";

// Mirrors the public site header (src/shared/components/Header.tsx): same bar
// height, logo, link size and active underline, so admin and public match.
const navLinkSx = (active: boolean) => ({
  color: "#fff",
  fontWeight: 500,
  pb: "6px",
  position: "relative",
  whiteSpace: "nowrap",
  "&::after": {
    bgcolor: "#fff",
    bottom: 0,
    content: '""',
    height: "2px",
    left: 0,
    position: "absolute",
    transform: active ? "scaleX(1)" : "scaleX(0)",
    transition: "transform 0.2s ease-in-out",
    width: "100%",
  },
  "&:hover::after": { transform: "scaleX(1)" },
});

export function AdminHeader({
  activePage = "forms",
  onLogout,
  loggingOut,
}: {
  activePage?: AdminActivePage;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const homeIsActive = activePage === "home";
  const formsAreActive = activePage === "forms";

  return (
    <AppBar component="header" elevation={0} position="sticky" sx={{ bgcolor: FOREST_GREEN, zIndex: 1201 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Link
          component={NextLink}
          href="/admin"
          aria-label="Câncer de Pênis, Início"
          aria-current={homeIsActive ? "page" : undefined}
          sx={{ alignItems: "center", display: "flex" }}
        >
          <Box component="img" src="/logo-avaliapen.svg" alt="Câncer de Pênis" sx={{ height: 60 }} />
        </Link>

        <Box component="nav" aria-label="Navegação administrativa" sx={{ alignItems: "center", display: "flex", gap: { xs: 2.5, md: 10 }, px: { xs: 0, md: 2 } }}>
          <Link component={NextLink} href="/admin" underline="none" aria-current={homeIsActive ? "page" : undefined} sx={{ ...navLinkSx(homeIsActive), display: { xs: "none", sm: "inline-block" } }}>
            Início
          </Link>
          <Link component={NextLink} href="/admin/formularios" underline="none" aria-current={formsAreActive ? "page" : undefined} sx={navLinkSx(formsAreActive)}>
            Meus Formulários
          </Link>
          <Tooltip title="Sair">
            <span>
              <IconButton aria-label="Sair" color="inherit" disabled={loggingOut} onClick={onLogout}>
                <LogoutRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export function AdminFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: FOREST_GREEN, color: PAGE_BACKGROUND, mt: 7, width: "100%" }}>
      <Box sx={{ borderTop: `1px solid ${FOOTER_SEPARATOR}`, opacity: 0.9 }} />
      <Box sx={{ px: { xs: 3, sm: 8, md: 16 }, py: { xs: 3.5, sm: 4 }, textAlign: "center" }}>
        <Brand compact />
        <Typography sx={{ fontSize: 12, lineHeight: 1.3, mt: 2, mx: "auto", maxWidth: 1120 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Typography>
      </Box>
      <Box sx={{ borderTop: `1px solid ${FOOTER_SEPARATOR}`, opacity: 0.9 }} />
      <Typography sx={{ fontSize: 10, opacity: 0.85, py: 1.2, textAlign: "center" }}>
        © 2026 Copyright: PETComp Câncer de Pênis
      </Typography>
    </Box>
  );
}
