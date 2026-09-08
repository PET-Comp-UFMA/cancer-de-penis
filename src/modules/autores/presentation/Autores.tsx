import Head from "next/head";
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Breadcrumbs,
  Link,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";

export default function Autores() {
  const autores = [
    {
      nome: "Chriss Taylor",
      especialidade: "Internal Medicine",
      imagem: "/autor1.png",
    },
    {
      nome: "Jonshon Aliven",
      especialidade: "Internal Medicine",
      imagem: "/autor2.png",
    },
    {
      nome: "Triklen Munaska",
      especialidade: "Internal Medicine",
      imagem: "/autor3.png",
    },
    {
      nome: "Khabian Jerry",
      especialidade: "Internal Medicine",
      imagem: "/autor4.png",
    },
    {
      nome: "Chriss Taylor",
      especialidade: "Internal Medicine",
      imagem: "/autor5.png",
    },
    {
      nome: "Jonshon Aliven",
      especialidade: "Internal Medicine",
      imagem: "/autor6.png",
    },
    {
      nome: "Triklen Munaska",
      especialidade: "Internal Medicine",
      imagem: "/autor7.png",
    },
    {
      nome: "Triklen Munaska",
      especialidade: "Internal Medicine",
      imagem: "/autor8.png",
    },
  ];

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
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#1E6B73",
              textAlign: "center",
              mb: 1,
            }}
          >
            Autores ...
          </Typography>
        </Container>
      </Box>

      {/* Grid de Autores */}
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {autores.map((autor, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                <Card
                  sx={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    borderRadius: 2,
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="240"
                    image={autor.imagem}
                    alt={autor.nome}
                    sx={{
                      objectFit: "cover",
                    }}
                  />
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#1E6B73",
                        mb: 0.5,
                        fontSize: "1.1rem",
                      }}
                    >
                      {autor.nome}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#5FA8B0",
                        fontSize: "0.9rem",
                      }}
                    >
                      {autor.especialidade}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Footer />
    </>
  );
}
