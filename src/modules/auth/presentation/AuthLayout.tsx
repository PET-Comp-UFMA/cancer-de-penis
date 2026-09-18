import { Box, Container, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f8f8", py: { xs: 5, sm: 9 } }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Image src="/logo-avaliapen.svg" alt="AvaliPen" width={190} height={64} priority style={{ width: "auto", height: 64 }} />
          <Typography component="h1" variant="h5" sx={{ mt: 2, color: "#015D67", fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        <Paper elevation={1} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
