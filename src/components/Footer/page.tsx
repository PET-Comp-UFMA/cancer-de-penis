import { Box, Typography, Container, Stack, Link } from "@mui/material";

export default function Footer() {
  return (
    <Box sx={{ bgcolor: "#015D67", color: "#fff", py: 4, mt: 8 }}>
      {/* Topo - Links */}
      <Container sx={{ py: 3 }}>
        <Stack direction="row" spacing={4} justifyContent="center" mb={3}>
          {[
            "Sobre Nós",
            "Suporte",
            "Política de Privacidade",
            "Termos de Uso",
          ].map((item) => (
            <Link
              key={item}
              href="#"
              color="inherit"
              underline="hover"
              variant="body2"
            >
              {item}
            </Link>
          ))}
        </Stack>
      </Container>

      {/* Linha Superior */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.3)" }} />

      {/* Conteúdo Central */}
      <Container sx={{ py: 5, textAlign: "center" }}>
        {/* Logo */}
        <Box
          component="img"
          src="/logo-avaliapen.svg"
          alt="logo site"
          sx={{ height: 60, mb: 2 }}
        />

        <Typography
          variant="body2"
          align="center"
          sx={{ opacity: 0.7, maxWidth: 600, mx: "auto" }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum
          dolor sit amet consectetur adipisicing elit. Eaque expedita veniam
          nulla eveniet vero magnam, soluta quidem quo necessitatibus tempora
          molestiae cum eum?
        </Typography>
      </Container>

      {/* Linha Inferior */}
      <Box sx={{ borderTop: "5px solid rgba(255,255,255,0.3)" }} />

      {/* Copyright */}
      <Typography
        variant="caption"
        align="center"
        sx={{ display: "block", py: 2, opacity: 0.8 }}
      >
        © 2026 Copyright: PETComp Câncer de Pênis
      </Typography>
    </Box>
  );
}
