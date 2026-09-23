import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Box, IconButton, Link, Tooltip, Typography } from "@mui/material";
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
    <Box
      component="header"
      sx={{
        bgcolor: FOREST_GREEN,
        color: PAGE_BACKGROUND,
        width: "100%",
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          minHeight: { xs: 72, sm: 92 },
          px: { xs: 2, sm: 2.5, md: 4.6 },
          width: "100%",
        }}
      >
        <Link
          component={NextLink}
          href="/admin"
          underline="none"
          aria-label="Câncer de Pênis, Início"
          aria-current={homeIsActive ? "page" : undefined}
          sx={{ display: "inline-flex" }}
        >
          <Brand />
        </Link>

        <Box
          component="nav"
          aria-label="Navegação administrativa"
          sx={{ alignItems: "center", display: "flex", gap: { xs: 1.5, sm: 2, md: 11.25 } }}
        >
          <Link
            component={NextLink}
            href="/admin"
            underline={homeIsActive ? "always" : "none"}
            aria-current={homeIsActive ? "page" : undefined}
            sx={{
              color: "inherit",
              display: { xs: "none", sm: "inline-flex" },
              fontSize: { sm: 18, md: 24.19 },
              fontWeight: 500,
              px: 0.5,
              py: 1,
              textUnderlineOffset: "4px",
            }}
          >
            Início
          </Link>
          <Link
            component={NextLink}
            href="/admin/formularios"
            underline={formsAreActive ? "always" : "none"}
            aria-current={formsAreActive ? "page" : undefined}
            sx={{
              color: "inherit",
              fontSize: { xs: 14, sm: 18, md: 24.19 },
              fontWeight: 500,
              textUnderlineOffset: "4px",
              whiteSpace: "nowrap",
            }}
          >
            Meus Formulários
          </Link>
          <Tooltip title="Sair">
            <span>
              <IconButton
                aria-label="Sair"
                color="inherit"
                disabled={loggingOut}
                onClick={onLogout}
                sx={{ p: 0.5 }}
              >
                <LogoutRoundedIcon sx={{ fontSize: { xs: 28, sm: 34 } }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
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
