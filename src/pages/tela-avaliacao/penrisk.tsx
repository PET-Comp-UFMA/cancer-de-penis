import Head from "next/head";
import Link from "next/link";
import { Box, Container, Typography, Card, CardMedia, CardContent, Button, Chip } from "@mui/material";
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";
export default function Penrisk() {
  return (
    <>
      <Head>
        <title>PENRISK</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <Box component="main" sx={{ pt: 14, pb: 10, bgcolor: "#fff" }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              mb: 3,
              color: "#0A6C74",
              fontSize: 14,
            }}
          >
            <Link href="/" style={{ color: "#0A6C74", fontWeight: 600, textDecoration: "none" }}>
              Página Inicial
            </Link>
            <Typography component="span" sx={{ color: "#0A6C74" }}>
              ›
            </Typography>
            <Typography component="span" sx={{ fontWeight: 700, textDecoration: "underline" }}>
              Avaliação de Risco
            </Typography>
             <Typography component="span" sx={{ fontWeight: 700, textDecoration: "underline" }}>
              Penrisk
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              fontWeight: 800,
              color: "#1F6C75",
              mb: 5,
            }}
          >
            Ferramentas de Avaliação
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 4,
              justifyItems: "center",
            }}
          >
            {/* Card 1 */}
            <Card
              sx={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2, pb: 0 }}>
                <CardMedia
                  component="img"
                  height="190"
                  image="/rounded.svg"
                  alt="PENRISK"
                  sx={{ borderRadius: 3, objectFit: "cover" }}
                />
              </Box>

              <CardContent sx={{ p: 2.2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, color: "#1F6C75" }}>
                    PENRISK
                  </Typography>

                </Box>

                <Typography sx={{ color: "#667085", fontSize: 13, lineHeight: 1.6, mb: 2 }}>
                  Esta avaliação ajuda a identificar seu risco de desenvolver câncer de pênis. Quanto mais cedo
                  for detectado, maiores são as chances de um tratamento bem sucedido.
                </Typography>

                <Button
                  variant="contained"
                  href="/tela-avaliacao/penrisk"
                  sx={{
                    bgcolor: "#0A6C74",
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#085A61" },
                  }}
                >
                  Avançar
                </Button>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card
              sx={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 3,
                boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}
            >
              <Box sx={{ p: 2, pb: 0 }}>
                <CardMedia
                  component="img"
                  height="190"
                  image="/Rounded-Rectangle.svg"
                  alt="QUALIPEN"
                  sx={{ borderRadius: 3, objectFit: "cover" }}
                />
              </Box>

              <CardContent sx={{ p: 2.2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, letterSpacing: 0.3, color: "#1F6C75" }}>
                    QUALIPEN
                  </Typography>
                </Box>

                <Typography sx={{ color: "#667085", fontSize: 13, lineHeight: 1.6, mb: 2 }}>
                  Esta avaliação tem o objetivo de entender como o câncer de pênis afeta a sua vida. Suas
                  respostas nos ajudarão a entender o impacto da doença no seu dia a dia.
                </Typography>

                <Button
                  variant="contained"
                  href="/qualipen"
                  sx={{
                    bgcolor: "#0A6C74",
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#085A61" },
                  }}
                >
                  Avançar
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      <Footer />
    </>
  );
}
