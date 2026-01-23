// pages/questionario.tsx
import Head from "next/head";
import { useState } from "react";
import { Box, Container, Typography, Button, Radio, RadioGroup, FormControlLabel, LinearProgress } from "@mui/material";
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";

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
  'Você apresenta ou apresentou recentementecoceira na pele ou na cabeça do pênis?',
  'Você tem verruga no pênis?',
  'Você já fez sexo com animais?',
];

export default function Questionario() {
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
        <title>Questionário PENRISK</title>
        <meta name="description" content="Questionário de avaliação de risco de câncer de pênis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Conteúdo Principal */}
      <Box
        component="section"
        sx={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          pt: 14,
          pb: { xs: 6, md: 12 },
        }}
      >
        <Container maxWidth="lg" sx={{ textAlign: "left" }}>
          <Box sx={{ maxWidth: 600 }}>
            
          </Box>
        </Container>
      </Box>

      <Footer />
    </>
  );
}
