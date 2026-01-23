// pages/questionario.tsx
import Head from "next/head";
import { useState } from "react";
import { Box, Container, Typography, Button, Radio, RadioGroup, FormControlLabel, LinearProgress } from "@mui/material";
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";
import Link from "next/link";


const perguntas = [
  'Você puxa a pele do pênis e lava a cabeça do pênis diariamente com água e sabão?',
  'Ao puxar a pele do pênis, você consegue colocar a cabeça do pênis para fora?',
  'Você ou alguém do seu convivo íntimo já sentiu mau cheiro no seu pênis?',
  'Você percebeu alguma mudança na cor ou textura da pele do pênis?',
  'Você já foi diagnosticado com o vírus do HPV por algum profissional da saúde?',
  'Você já foi diagnosticado com o vírus da AIDS por algum profissional da saúde?',
  'A cabeça do seu pênis apresenta alguma secreção esbranquiçada?',
  'A pele ou a cabeça do seu pênis apresenta alguma ferida ou sangramento?',
  'Você fuma ou fumou por muito tempo? ',
  'Você já teve infecções no pênis?',
  'Você apresenta ou apresentou recentemente coceira na pele ou na cabeça do pênis?',
  'Você tem verruga no pênis?',
  'Você já fez sexo com animais?',
];

export default function Penrisk() {
  const [index, setIndex] = useState(0);
  const [respostas, setRespostas] = useState<(boolean | null)[]>(Array(perguntas.length).fill(null));

  const handleResposta = (resposta: boolean) => {
    const novasRespostas = [...respostas];
    novasRespostas[index] = resposta;
    setRespostas(novasRespostas);
  };

  const proximo = () => {
    if (index < perguntas.length - 1) setIndex(index + 1);
  };

  const enviar = async () => {
    await fetch('/api/respostas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ respostas }),
    });
    alert('Respostas enviadas com sucesso!');
  };

  return (
    <>
      <Head>
        <title>Penrisk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      {/* Conteúdo Principal */}
      <Box component="main" sx={{ pt: 8, pb: 10, bgcolor: "#fff", minHeight: "90vh" }}>
        <Container maxWidth="lg">
          {/* Breadcrumb */}
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
            <Link
              href="/avaliacao"
              style={{
                color: "#0A6C74",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Avaliação de Risco
            </Link>
            <Typography component="span" sx={{ color: "#0A6C74" }}>
              ›
            </Typography>
            <Typography component="span" sx={{ fontWeight: 700, textDecoration: "underline" }}>
              PENRISK
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
            Questionário PENRISK
          </Typography>

          
        </Container>
      </Box>

      <Footer />
    </>
  );
}
