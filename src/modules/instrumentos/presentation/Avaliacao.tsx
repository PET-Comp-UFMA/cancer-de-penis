import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  InputAdornment,
  OutlinedInput,
  Pagination,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import { getPublishedForms, type PublicForm } from "./public-forms";

const PAGE_SIZE = 6;

type CatalogCard = {
  id: string;
  catalogKey: string;
  title: string;
  description: string;
  image?: string;
  href?: string;
};

const legacyForms: CatalogCard[] = [
  {
    id: "legacy-penrisk",
    catalogKey: "PENRISK",
    title: "PENRISK",
    description:
      "Esta avaliação ajuda a identificar seu risco de desenvolver câncer de pênis. Quanto mais cedo for detectado, maiores são as chances de um tratamento bem sucedido.",
    image: "/rounded.svg",
    href: "/tela-avaliacao/penrisk",
  },
  {
    id: "legacy-qualipen",
    catalogKey: "QUALIPEN",
    title: "QUALIPEN",
    description:
      "Esta avaliação tem o objetivo de entender como o câncer de pênis afeta a sua vida. Suas respostas nos ajudarão a entender o impacto da doença no seu dia a dia.",
    image: "/Rounded-Rectangle.svg",
    href: "/tela-avaliacao/qualipen",
  },
];

function normalizeCatalogKey(catalogKey: string) {
  return catalogKey.trim().toUpperCase();
}

function toPublishedCard(form: PublicForm): CatalogCard {
  const knownForm = legacyForms.find(
    (legacyForm) => normalizeCatalogKey(legacyForm.catalogKey) === normalizeCatalogKey(form.catalogKey),
  );

  return {
    id: form.id,
    catalogKey: form.catalogKey,
    title: form.title,
    description: form.description,
    image: knownForm?.image,
    href: knownForm?.href,
  };
}

function matchesSearch(card: CatalogCard, value: string) {
  const query = value.trim().toLocaleLowerCase();
  if (!query) return true;
  return [card.catalogKey, card.title, card.description]
    .some((field) => field.toLocaleLowerCase().includes(query));
}

export default function Avaliacao() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [forms, setForms] = useState<PublicForm[]>([]);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    let settled = false;
    const loadingTimer = window.setTimeout(() => {
      if (settled) return;
      setLoading(true);
      setError(null);
    });

    getPublishedForms({ search: debouncedSearch, page, pageSize: PAGE_SIZE, signal: controller.signal })
      .then((result) => {
        setForms(result.forms);
        setPublishedTotal(result.publishedTotal);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setForms([]);
        setPublishedTotal(0);
        setTotalPages(1);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar as avaliações publicadas.",
        );
      })
      .finally(() => {
        settled = true;
        window.clearTimeout(loadingTimer);
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      settled = true;
      window.clearTimeout(loadingTimer);
      controller.abort();
    };
  }, [debouncedSearch, page]);

  function handleSearchChange(value: string) {
    setSearch(value);
  }

  const cards = useMemo(() => {
    if (publishedTotal === 0) return legacyForms.filter((form) => matchesSearch(form, search));
    return forms.map(toPublishedCard);
  }, [forms, publishedTotal, search]);

  return (
    <>
      <Head>
        <title>Ferramentas de Avaliação</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <Box component="main" sx={{ minHeight: "75vh", pt: { xs: 7, md: 9 }, pb: 10, bgcolor: "#FAFCFC" }}>
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mb: 3, color: "#0A6C74", fontSize: 14 }}>
            <Link href="/" style={{ color: "#0A6C74", fontWeight: 600, textDecoration: "none" }}>Página Inicial</Link>
            <Typography component="span" sx={{ color: "#0A6C74" }}>›</Typography>
            <Typography component="span" sx={{ fontWeight: 700, textDecoration: "underline" }}>Ferramentas de Avaliação</Typography>
          </Box>

          <Typography variant="h3" sx={{ textAlign: "center", fontWeight: 800, color: "#1F6C75", mb: 4, fontSize: { xs: "2rem", md: "3rem" } }}>
            Ferramentas de Avaliação
          </Typography>

          <Box sx={{ maxWidth: 1280, mx: "auto", mb: 5, minHeight: 124, p: { xs: 2, md: 4 }, bgcolor: "#FAFCFC", border: "1px solid #D9D9D9", borderRadius: 2 }}>
            <OutlinedInput
              fullWidth
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Buscar formulários..."
              inputProps={{ "aria-label": "Buscar formulários" }}
              startAdornment={<InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>}
              sx={{ bgcolor: "#FFFFFF", borderRadius: "5px", height: 52, maxWidth: { xs: "100%", md: 392 }, fontSize: 14 }}
            />
          </Box>

          {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 8 }} aria-label="Carregando avaliações"><CircularProgress /></Box>}
          {!loading && error && cards.length === 0 && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}
          {!loading && !error && cards.length === 0 && <Alert severity="info" sx={{ mb: 4 }}>Nenhuma ferramenta publicada corresponde à busca.</Alert>}

          {!loading && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 420px))" }, justifyContent: "center", gap: { xs: 3, md: 7 } }}>
              {cards.map((card) => (
                <Card key={card.id} sx={{ width: "100%", borderRadius: 3, boxShadow: "0 10px 30px rgba(0,0,0,0.10)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {card.image ? <Box sx={{ p: 2, pb: 0 }}><CardMedia component="img" height="200" image={card.image} alt={card.title} sx={{ borderRadius: 3, objectFit: "cover" }} /></Box> : <Box sx={{ height: 216, m: 2, mb: 0, borderRadius: 3, bgcolor: "#E7F3F3" }} />}
                  <CardContent sx={{ p: 2.2, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <Typography sx={{ fontSize: 24, fontWeight: 800, letterSpacing: 0.3, color: "#1F6C75", mb: 1 }}>{card.title}</Typography>
                    <Typography sx={{ color: "#667085", fontSize: 13, lineHeight: 1.6, mb: 2, flexGrow: 1 }}>{card.description}</Typography>
                    {card.href ? <Button variant="contained" href={card.href} sx={{ alignSelf: "flex-start", bgcolor: "#0A6C74", borderRadius: 2, px: 3, py: 1, textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#085A61" } }}>Iniciar</Button> : <Button variant="contained" disabled sx={{ alignSelf: "flex-start", borderRadius: 2, px: 3, py: 1, textTransform: "none", fontWeight: 700 }}>Disponível em breve</Button>}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {!loading && totalPages > 1 && <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><Pagination count={totalPages} page={page} onChange={(_, nextPage) => setPage(nextPage)} color="primary" shape="rounded" aria-label="Paginação das ferramentas de avaliação" /></Box>}
        </Container>
      </Box>

      <Footer />
    </>
  );
}
