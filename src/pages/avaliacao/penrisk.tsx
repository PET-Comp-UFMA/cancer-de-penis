import Head from "next/head";
import { useState } from "react";
import { Box, Container, Typography, Button, Radio, RadioGroup, FormControlLabel, LinearProgress } from "@mui/material";
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";
import Link from "next/link";
import FormQuestionario from "@/components/Questionarios/FormQuestionario";
import { Stack } from "@mui/material";


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

interface QuestionBlockProps {
  numero: number;
  pergunta: string;
  onAnswer: (resposta: boolean) => void;
}

export function QuestionBlock({
  numero,
  pergunta,
  onAnswer,
}: QuestionBlockProps) {
  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",        // centraliza horizontalmente
        mt: 6,
        p: 4,
        textAlign: "left",
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: "#0A6C74",
          fontWeight: 700,
          display: "block",
          mb: 1,
        }}
      >
        {numero}.
      </Typography>

      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 500,
          color: "#454D5D",
        }}
      >
        {pergunta}
      </Typography>
    </Box>
  );
}


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

  /*return (
    <>
      <Head>
        <title>Penrisk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <Box component="main" sx={{ pt: 8, pb: 10, bgcolor: "#fff", minHeight: "90vh" }}>
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
            variant="h4"
            sx={{
              textAlign: "center",
              fontWeight: 800,
              color: "#1F6C75",
              mb: 5,
            }}
          >
            Questionário PENRISK
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 3 }}>
              {perguntas.map((_, i) => {
                const first = i == 0
                const isCurrent = i === index;
                const last = i === perguntas.length-1
                const CurrentIsLast = index == perguntas.length-1
                return (
                  <Box
                    key={i}
                    sx={{
                      width: isCurrent || last? 20: 4,
                      height: isCurrent || last? 20: 4,
                      borderRadius: "50%",
                      border: "1px solid #0A6C74",
                      backgroundColor: isCurrent ? "#0A6C74" : "transparent",

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      color: last && !CurrentIsLast? "#0A6C74": "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {isCurrent || last? i + 1 : ""}
                  </Box>            
                );
              })}
          
          </Box>

          <Button variant="contained" onClick={() => { proximo() }} sx={{ bgcolor: "#0A6C74", borderRadius: 2, px: 4, py: 1, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#085A61" }, }} > Avançar (teste) </Button>
          
        </Container>
      </Box>

      <Footer />
    </>
  );*/

  return (
    <>
      <Head>
        <title>Penrisk</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
      

      <Box component="main" sx={{ pt: 8, pb: 10, bgcolor: "#fff" }}>
        <Stack spacing="60px" alignItems="center"> 
          
          {/* ELEMENTO 1: Breadcrumbs (Links de navegação) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
              color: "#0A6C74",
              fontWeight: 600,
              fontSize: 20,
            }}
          >
            <Link href="/">Página Inicial</Link>
            <Typography sx={{ fontWeight: "inherit" }}>›</Typography>
            <Link href="/avaliacao">Avaliação de Risco</Link>
            <Typography sx={{ fontWeight: "inherit" }}>›</Typography>
            <Link href="/avaliacao" style={{textDecoration: "underline"}}>PENRISK</Link>

          </Box>

          {/* ELEMENTO 2: O Formulário */}
          <FormQuestionario 
            nome="PENRISK"
            perguntas={perguntas}
            tipoResposta="boolean"
          />
          
        </Stack>
      </Box>

      <Footer />
    </>
  );
  
}
