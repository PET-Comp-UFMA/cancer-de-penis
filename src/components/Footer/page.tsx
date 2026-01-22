import { Box, Typography, Container, Stack, Link } from "@mui/material";

export default function Footer() {
  return (
    <Box sx={{ bgcolor: "#0d47a1", color: "#fff", py: 4, mt: 8 }}>
      <Container>
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
        <Typography variant="body2" align="center" sx={{ opacity: 0.7 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Typography>
        <Box
          sx={{
            textAlign: "center",
            mt: 4,
            pt: 2,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Typography variant="caption">
            © 2025 Copyright: PETComp DevLivery
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
