import Head from "next/head";
import {
  Box,
  Container,
  Typography,
  Link,
} from "@mui/material";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import AuthorsGrid from "./AuthorsGrid";
import { workAuthors } from "../domain/authors";

export default function Autores() {
  return (
    <>
      <Head>
        <title>Autores - Câncer de Pênis</title>
        <meta name="description" content="Conheça os autores e especialistas" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 1,
          mb: 3,
          pt: 8,
          color: "#0A6C74",
          fontSize: 14,
        }}
      >
        <Link
          href="/"
          style={{
            color: "#0A6C74",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Página Inicial
        </Link>
        <Typography component="span" sx={{ color: "#0A6C74" }}>
          ›
        </Typography>
        <Typography
          component="span"
          sx={{ fontWeight: 700, textDecoration: "underline" }}
        >
          Autores
        </Typography>
      </Box>

      {/* Título */}
      <Box sx={{ bgcolor: "#FFFFFF", py: 4 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#1F6C75",
              textAlign: "center",
              mb: 4,
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            Autores do Trabalho
          </Typography>
        </Container>
      </Box>

      {/* Grid de Autores */}
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <AuthorsGrid authors={workAuthors} />
        </Container>
      </Box>

      <Footer />
    </>
  );
}
