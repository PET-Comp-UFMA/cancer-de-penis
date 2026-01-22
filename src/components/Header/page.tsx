import { AppBar, Toolbar, Button, Box, Typography, Link } from "@mui/material";

export default function Header() {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{ bgcolor: "#015D67", zIndex: 1201 }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="/logo-avaliapen.svg"
            alt="Logo site"
            style={{ height: 60, objectFit: "contain" }}
          />
        </Box>

        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4 }}>
          {["Inicio", "Avaliação de Risco", "Autores"].map((text) => (
            <Link
              key={text}
              href="#"
              underline="none"
              sx={{ color: "#fff", fontWeight: 500 }}
            >
              {text}
            </Link>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
