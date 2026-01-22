import { AppBar, Toolbar, Button, Box, Typography, Link } from "@mui/material";
import { Person } from "@mui/icons-material";

export default function Header() {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{ bgcolor: "#0288d1", zIndex: 1201 }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
            Dev
            <br />
            Livery
          </Typography>
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
