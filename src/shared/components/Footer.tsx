import { Box, Container, Typography } from "@mui/material";

export default function Footer() {
  return <Box component="footer" sx={{ bgcolor: "#015D67", color: "#fff", mt: 8 }}>
    <Box sx={{ borderTop: "1px solid #E5EEEF", opacity: 0.8 }} />
    <Container sx={{ py: { xs: 4, md: 5 }, textAlign: "center" }}>
      <Box component="img" src="/logo-avaliapen.svg" alt="AvaliaPen" sx={{ width: { xs: 160, md: 210 }, height: { xs: 69, md: 90 }, mb: 1 }} />
      <Typography variant="body2" sx={{ opacity: 0.82, maxWidth: 1120, mx: "auto", lineHeight: 1.3 }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </Typography>
    </Container>
    <Box sx={{ borderTop: "1px solid #E5EEEF", opacity: 0.8 }} />
    <Typography variant="caption" sx={{ display: "block", py: 2, textAlign: "center", opacity: 0.85 }}>
      © 2026 Copyright: PETComp Câncer de Pênis
    </Typography>
  </Box>;
}
