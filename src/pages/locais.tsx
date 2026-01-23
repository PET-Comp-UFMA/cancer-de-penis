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
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";

export default function Hospitais() {
  const hospitais = [
    {
    nome: "Hospital Aldenora Belo",
    local: "R. Seroa da Mota, 23 - Apeadouro, São Luís - MA",
    imagem: "/Hospital (1).svg",
    href: "https://fundacaoantoniodino.org.br",
    },
    {
      nome: "Hospital de Oncologia do Maranhão - Dr. Tarquínio Lopes Filho",
      local: "R. São Pantaleão, 02 - Centro, São Luís - MA",
      imagem: "/Hospital (5).svg",
      href:"https://abeas.org.br/hospital-de-cancer-do-maranhao/",
    },
    {
      nome: "Uromar - Inatituto de Urologia do Maranhão",
      local: "Av. Prof. Carlos Cunha, 2.000, Ed. Medical Center II,  Jaracaty, São Luís - MA",
      imagem: "/Hospital (4).svg",
      href: "https://uromar.com.br/"
    },
    {
      nome: "Centro de Radioterapia do Maranhão",
      local: "Altura do n° 03 - Av. dos Franceses, S/N - Vila Palmeira, São Luís - MA",
      imagem: "/Hospital (3).svg",
      href: "https://www.saude.ma.gov.br",
    },
    {
      nome: "Hospital Universitário ",
      local: "R. Barão de Itapari, 227 - Centro, São Luís - MA",
      imagem: "/Hospital.svg",
      href: "https://www.gov.br/ebserh/pt-br/hospitais-universitarios/regiao-nordeste/hu-ufma",
    },
    {
      nome: "Hospital São Domingos",
      local: "Av. Jerônimo de Albuquerque, 540 -  Bequimão, São Luís - MA",
      imagem: "/Hospital (2).svg",
      href: "https://www.hospitalsaodomingos.com.br",
    },
  ];

  return (
    <>
      <Head>
        <title>Locais de Atendimento - Câncer de Pênis</title>
        <meta name="description" content="Conheça os locales e especialistas" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Breadcrumbs */}
      <Box sx={{ py: 2 }}>
        <Container maxWidth="lg">
          <Breadcrumbs
            separator="›"
            sx={{
              fontSize: "0.9rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Link
              href="/"
              underline="hover"
              sx={{ color: "#1E6B73", fontWeight: 500 }}
            >
              Página Inicial
            </Link>
            <Typography sx={{ color: "#1E6B73", fontWeight: 600 }}>
              Centros de Atendimento
            </Typography>
          </Breadcrumbs>
        </Container>
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
            Centros de Atendimentos
          </Typography>
        </Container>
      </Box>

      {/* Grid de hospitais */}
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={5}>
            {hospitais.map((local, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: 400,     
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
                    image={local.imagem}
                    alt={local.nome}
                    sx={{
                      objectFit: "cover",
                    }}
                  />
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                        <Typography
                            variant="h6"
                            component="a"
                            href={local.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                            fontWeight: 700,
                            color: "#1E6B73",
                            mb: 0.5,
                            fontSize: "1.1rem",
                            textDecoration: "none",
                            display: "inline-block",
                            "&:hover": { textDecoration: "underline" },
                            }}
                        >
                            {local.nome}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                            color: "#00ACB1",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            }}
                        >
                            {local.local}
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
