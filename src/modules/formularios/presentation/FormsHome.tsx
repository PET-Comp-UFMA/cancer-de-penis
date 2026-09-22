import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UnpublishedRoundedIcon from "@mui/icons-material/UnpublishedRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  InputAdornment,
  Link,
  OutlinedInput,
  Tooltip,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { AuthUser } from "@/modules/auth/presentation/api";
import { getSession, logout } from "@/modules/auth/presentation/api";
import { AdminFooter, AdminHeader } from "@/modules/admin/presentation/AdminChrome";
import {
  deleteForm,
  FormsApiError,
  getForms,
  updateFormStatus,
  type FormListItem,
} from "./api";

const PAGE_SIZE = 6;
const FOREST_GREEN = "#015D67";
const PAGE_BACKGROUND = "#FAFCFC";
const BODY_TEXT = "#425466";
const BORDER = "#D9D9D9";

function statusLabel(form: FormListItem) {
  if (form.status === "published") return "Publicado";
  return "Não publicado";
}

function statusColor(form: FormListItem) {
  if (form.status === "published") return { bg: "#B7EEE7", color: "#0E6C51" };
  return { bg: "#C6CDCE", color: "#666969" };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function LoadingRows() {
  return (
    <Box role="status" aria-label="Carregando formulários" sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 210 }}>
      <CircularProgress size={28} sx={{ color: FOREST_GREEN }} />
    </Box>
  );
}

function FormRow({
  action,
  form,
  onDelete,
  onStatusChange,
  username,
}: {
  action: string | null;
  form: FormListItem;
  onDelete: (form: FormListItem) => void;
  onStatusChange: (form: FormListItem) => void;
  username: string;
}) {
  const status = statusColor(form);
  const incomplete = form.definitionState === "incomplete";
  const isPublished = form.status === "published";
  // The public route resolves any published catalogKey generically (see
  // getServerPublicFormDefinition) — preview just needs the form published,
  // not a hardcoded allowlist of catalog keys.
  const previewHref = isPublished ? `/tela-avaliacao/${form.catalogKey.trim().toLowerCase()}` : undefined;
  const actionBusy = action !== null;
  return (
    <Box
      component="article"
      data-testid="form-row"
      sx={{
        alignItems: "center",
        borderBottom: `1px solid ${BORDER}`,
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "minmax(360px, 1.55fr) minmax(155px, 0.75fr) minmax(230px, 1fr) minmax(130px, 0.55fr)",
        },
        minHeight: { xs: "auto", sm: 105 },
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 0 },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, minWidth: 0 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: isPublished ? "#B7EEE7" : "#C6CDCE",
            borderRadius: "4px",
            color: isPublished ? FOREST_GREEN : "#666969",
            display: "flex",
            flex: "0 0 40px",
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <DescriptionOutlinedIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Link component={NextLink} href={`/admin/formularios/${form.id}`} underline="hover" sx={{ color: FOREST_GREEN, fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>
            {form.title}
          </Link>
          <Typography
            sx={{
              color: BODY_TEXT,
              display: "-webkit-box",
              fontSize: 12,
              lineHeight: 1.35,
              maxWidth: 390,
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {form.description}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", justifySelf: "start" }}>
        <Typography
          sx={{
            bgcolor: status.bg,
            borderRadius: "5px",
            color: status.color,
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.3,
            minWidth: 120,
            px: 1.5,
            py: 1,
            textAlign: "center",
          }}
        >
          {statusLabel(form)}
        </Typography>
      </Box>

      <Box>
        <Typography sx={{ color: "#525252", fontSize: 16, lineHeight: 1.35 }}>
          {formatDate(form.updatedAt)}
        </Typography>
        <Typography sx={{ color: "#525252", fontSize: 13, lineHeight: 1.35 }}>
          por {username}
        </Typography>
      </Box>

      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "flex-start" }}>
        <Tooltip title={previewHref ? "Visualizar formulário" : "Publique o formulário para poder visualizá-lo"}>
          <span>
            {previewHref ? (
              <IconButton
                aria-label={`Visualizar ${form.title}`}
                component={NextLink}
                disabled={actionBusy}
                href={previewHref}
                size="small"
              >
                <VisibilityOutlinedIcon />
              </IconButton>
            ) : (
              <IconButton aria-label={`Visualizar ${form.title}`} disabled size="small">
                <VisibilityOutlinedIcon />
              </IconButton>
            )}
          </span>
        </Tooltip>
        <Tooltip
          title={
            isPublished
              ? "Retirar formulário da publicação"
              : incomplete
                ? "Complete o formulário para publicar"
                : "Publicar formulário"
          }
        >
          <span>
            <IconButton
              aria-label={isPublished ? `Retirar ${form.title} da publicação` : `Publicar ${form.title}`}
              disabled={actionBusy || (!isPublished && incomplete)}
              onClick={() => onStatusChange(form)}
              size="small"
            >
              {isPublished ? <UnpublishedRoundedIcon /> : <PublishRoundedIcon />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={isPublished ? "Retire o formulário da publicação antes de excluí-lo" : "Excluir formulário"}>
          <span>
            <IconButton
              aria-label={`Excluir ${form.title}`}
              disabled={isPublished || actionBusy}
              onClick={() => onDelete(form)}
              size="small"
            >
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

function DeleteFormDialog({
  form,
  busy,
  onCancel,
  onConfirm,
}: {
  form: FormListItem | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      onClose={onCancel}
      open={Boolean(form)}
      slotProps={{ paper: { sx: { borderRadius: "17px", maxWidth: 560, p: { xs: 3, sm: 4 }, position: "relative", width: "100%" } } }}
    >
      <IconButton aria-label="Fechar" disabled={busy} onClick={onCancel} sx={{ position: "absolute", right: 16, top: 16 }}>
        <Box alt="" component="img" src="/fechar.svg" sx={{ height: 22, width: 22 }} />
      </IconButton>
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, mb: 3 }}>
        <Box alt="" component="img" src="/alerta-exclusao.svg" sx={{ flexShrink: 0, height: 52, width: 61 }} />
        <Typography component="h2" sx={{ color: FOREST_GREEN, fontSize: { xs: 24, sm: 30 }, fontWeight: 700 }}>
          Excluir formulário
        </Typography>
      </Box>
      <Typography sx={{ color: BODY_TEXT, fontSize: { xs: 16, sm: 20 }, mb: 2 }}>
        Tem certeza que deseja excluir esse formulário?
      </Typography>
      <Typography sx={{ color: BODY_TEXT, fontSize: { xs: 16, sm: 20 }, mb: 2 }}>
        Esta ação irá remover permanentemente a estrutura e as configurações do formulário{" "}
        <Box component="span" sx={{ fontWeight: 700 }}>
          &ldquo;{form?.title}&rdquo;
        </Box>
        .
      </Typography>
      <Typography sx={{ color: BODY_TEXT, fontSize: { xs: 16, sm: 20 }, mb: 4 }}>
        Essa ação não poderá ser desfeita.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          disabled={busy}
          onClick={onCancel}
          sx={{ border: `1px solid ${FOREST_GREEN}`, borderRadius: "5px", color: FOREST_GREEN, fontSize: 18, px: 3, py: 1.25, textTransform: "none" }}
        >
          Cancelar
        </Button>
        <Button
          disabled={busy}
          onClick={onConfirm}
          sx={{ bgcolor: "#F52323", borderRadius: "5px", color: "#FAFCFC", fontSize: 17, px: 3, py: 1.25, textTransform: "none", "&:hover": { bgcolor: "#D81E1E" } }}
        >
          {busy ? "Excluindo..." : "Excluir Formulário"}
        </Button>
      </Box>
    </Dialog>
  );
}

type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

function paginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  const items: PaginationItem[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let item = start; item <= end; item += 1) items.push(item);
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = paginationItems(page, totalPages);
  return (
    <Box aria-label="Paginação" component="nav" sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.25, justifyContent: "center", minHeight: 48 }}>
      <IconButton
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        sx={{ border: `1px solid ${FOREST_GREEN}`, color: FOREST_GREEN, height: 37, width: 37 }}
      >
        <ChevronLeftRoundedIcon fontSize="small" />
      </IconButton>
      {pages.map((item) => item === "ellipsis-start" || item === "ellipsis-end" ? (
        <Typography aria-hidden="true" key={item} sx={{ color: FOREST_GREEN, fontSize: 14, minWidth: 16, textAlign: "center" }}>
          …
        </Typography>
      ) : (
        <Button
          key={item}
          aria-current={item === page ? "page" : undefined}
          aria-label={`Página ${item}`}
          onClick={() => onChange(item)}
          sx={{
            bgcolor: item === page ? FOREST_GREEN : "transparent",
            borderRadius: "6px",
            color: item === page ? PAGE_BACKGROUND : FOREST_GREEN,
            fontFamily: "Inter, Montserrat, sans-serif",
            fontSize: 12,
            fontWeight: 800,
            height: 37,
            minWidth: 37,
            p: 0,
            "&:hover": { bgcolor: item === page ? FOREST_GREEN : "rgba(1,93,103,0.08)" },
          }}
        >
          {item}
        </Button>
      ))}
      <IconButton
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        sx={{ border: `1px solid ${FOREST_GREEN}`, color: FOREST_GREEN, height: 37, width: 37 }}
      >
        <ChevronRightRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export default function FormsHome({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [action, setAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);

  useEffect(() => {
    let active = true;
    getSession()
      .then((session) => {
        if (active) setCsrfToken(session.csrfToken);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setForms([]);
    setTotalPages(1);
    const timeout = window.setTimeout(() => {
      getForms({ search, page, pageSize: PAGE_SIZE, signal: controller.signal })
        .then((result) => {
          if (!active) return;
          setForms(result.forms);
          setTotalPages(result.totalPages);
        })
        .catch((caught: unknown) => {
          if (!active || (caught instanceof DOMException && caught.name === "AbortError")) return;
          if (caught instanceof FormsApiError && caught.status === 401) {
            void router.replace("/admin/login?reason=expired");
            return;
          }
          setError(caught instanceof Error ? caught.message : "Não foi possível carregar seus formulários.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [page, reloadToken, router, search]);

  async function signOut() {
    setLoggingOut(true);
    setError("");
    try {
      let token = csrfToken || (await getSession()).csrfToken;
      try {
        await logout(token);
      } catch (caught) {
        if ((caught as Error & { status?: number }).status !== 403) throw caught;
        token = (await getSession()).csrfToken;
        setCsrfToken(token);
        await logout(token);
      }
      await router.replace("/admin/login");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível sair.");
      setLoggingOut(false);
    }
  }

  async function withCsrf<T>(operation: (token: string) => Promise<T>) {
    let token = csrfToken || (await getSession()).csrfToken;
    try {
      return await operation(token);
    } catch (caught) {
      if ((caught as Error & { status?: number }).status !== 403) throw caught;
      token = (await getSession()).csrfToken;
      setCsrfToken(token);
      return operation(token);
    }
  }

  async function handleStatusChange(form: FormListItem) {
    const nextStatus = form.status === "published" ? "unpublished" : "published";
    setAction(`status:${form.id}`);
    setActionError("");
    try {
      const updated = await withCsrf((token) => updateFormStatus(form.id, nextStatus, token, form.revision));
      setForms((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (caught) {
      if (caught instanceof FormsApiError && caught.status === 401) {
        void router.replace("/admin/login?reason=expired");
        return;
      }
      setActionError(caught instanceof Error ? caught.message : "Não foi possível atualizar o estado do formulário.");
    } finally {
      setAction(null);
    }
  }

  function handleDelete(form: FormListItem) {
    if (form.status === "published") return;
    setDeleteTarget(form);
  }

  function cancelDelete() {
    if (action) return;
    setDeleteTarget(null);
  }

  function confirmDelete() {
    const form = deleteTarget;
    if (!form) return;
    setAction(`delete:${form.id}`);
    setActionError("");
    void withCsrf((token) => deleteForm(form.id, token))
      .then(() => {
        setDeleteTarget(null);
        setPage((currentPage) => currentPage > 1 && forms.length === 1 ? currentPage - 1 : currentPage);
        setReloadToken((current) => current + 1);
      })
      .catch((caught: unknown) => {
        if (caught instanceof FormsApiError && caught.status === 401) {
          void router.replace("/admin/login?reason=expired");
          return;
        }
        setActionError(caught instanceof Error ? caught.message : "Não foi possível excluir o formulário.");
      })
      .finally(() => setAction(null));
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <Box sx={{ bgcolor: PAGE_BACKGROUND, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AdminHeader loggingOut={loggingOut} onLogout={signOut} />
      <Box component="main" sx={{ flex: 1, pb: { xs: 4, sm: 7 }, pt: { xs: 4, sm: 5 } }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, textAlign: "center" }}>
          <Typography sx={{ color: FOREST_GREEN, fontSize: { xs: 14, sm: 20 }, fontWeight: 700 }}>
            <Link component={NextLink} href="/admin" underline="none" sx={{ color: "inherit" }}>
              Página Inicial
            </Link>{" "}
            → {" "}
            <Link component={NextLink} href="/admin/formularios" underline="always" sx={{ color: "inherit", textUnderlineOffset: "3px" }}>
              Meus Formulários
            </Link>
          </Typography>
          <Typography component="h1" sx={{ color: FOREST_GREEN, fontSize: { xs: 32, sm: 46 }, fontWeight: 700, mt: 2 }}>
            Meus Formulários
          </Typography>
          <Typography sx={{ color: BODY_TEXT, fontSize: { xs: 12, sm: 14 }, fontWeight: 700, mt: 1 }}>
            Crie novas ferramentas de avaliação.
          </Typography>
        </Box>

        <Box sx={{ margin: "40px auto 0", maxWidth: 1371, width: { xs: "calc(100% - 32px)", sm: "calc(100% - 44px)" } }}>
          {error && (
            <Alert
              action={<Button color="inherit" onClick={() => setReloadToken((current) => current + 1)}>Tentar novamente</Button>}
              severity="error"
              sx={{ mb: 2, textAlign: "left" }}
            >
              {error}
            </Alert>
          )}
          {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
          <Box sx={{ bgcolor: PAGE_BACKGROUND, border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
            <Box sx={{ alignItems: "center", borderBottom: `1px solid ${BORDER}`, display: "flex", minHeight: { xs: 96, sm: 124 }, px: { xs: 2, sm: 3.8 } }}>
              <OutlinedInput
                fullWidth
                inputProps={{ "aria-label": "Buscar formulários" }}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Buscar formulários..."
                startAdornment={<InputAdornment position="start"><SearchRoundedIcon sx={{ color: "#525252", fontSize: 18 }} /></InputAdornment>}
                value={search}
                sx={{
                  bgcolor: "#FFFFFF",
                  borderRadius: "5px",
                  fontFamily: "Inter, Montserrat, sans-serif",
                  fontSize: 14,
                  height: 52,
                  maxWidth: { xs: "100%", sm: 392 },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: BORDER },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#A7A7A7" },
                }}
              />
            </Box>

            <Box sx={{ overflowX: "auto" }}>
              <Box
                aria-hidden="true"
                sx={{
                  alignItems: "center",
                  bgcolor: "#FBFBFB",
                  borderBottom: `1px solid ${BORDER}`,
                  display: { xs: "none", sm: "grid" },
                  gap: 2,
                  gridTemplateColumns: "minmax(360px, 1.55fr) minmax(155px, 0.75fr) minmax(230px, 1fr) minmax(130px, 0.55fr)",
                  minHeight: 73,
                  minWidth: 930,
                  px: { xs: 2, sm: 3 },
                }}
              >
                <Typography sx={{ color: "#525252", fontSize: 16, fontWeight: 500 }}>Título do Formulário</Typography>
                <Typography sx={{ color: "#525252", fontSize: 16, fontWeight: 500 }}>Status</Typography>
                <Typography sx={{ color: "#525252", fontSize: 16, fontWeight: 500 }}>Última Atualização</Typography>
                <Typography sx={{ color: "#525252", fontSize: 16, fontWeight: 500 }}>Ações</Typography>
              </Box>
              {loading ? <LoadingRows /> : error ? null : forms.length ? forms.map((form) => (
                <FormRow
                  action={action}
                  form={form}
                  key={form.id}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  username={user.username}
                />
              )) : (
                <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 180, px: 3 }}>
                  <Typography sx={{ color: BODY_TEXT, fontSize: 15 }}>Nenhum formulário encontrado.</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {!loading && !error && totalPages > 0 && (
            <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 0 }, justifyContent: "space-between", mt: 3 }}>
              <Box sx={{ display: { xs: "none", sm: "block" }, flex: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "center", order: { xs: 2, sm: 1 }, width: { xs: "100%", sm: "auto" } }}>
                <Pagination onChange={setPage} page={page} totalPages={totalPages} />
              </Box>
              <Box sx={{ display: "flex", flex: { sm: 1 }, justifyContent: { xs: "center", sm: "flex-end" }, order: { xs: 1, sm: 2 } }}>
                <Tooltip title="Criar um novo formulário">
                  <span>
                    <Button
                      aria-label="Novo formulário"
                      component={NextLink}
                      href="/admin/formularios/novo"
                      startIcon={<AddRoundedIcon />}
                      sx={{
                        bgcolor: FOREST_GREEN,
                        color: PAGE_BACKGROUND,
                        fontSize: 14,
                        fontWeight: 600,
                        height: 52,
                        px: 2,
                        textTransform: "none",
                        whiteSpace: "nowrap",
                        "&.Mui-disabled": { bgcolor: FOREST_GREEN, color: PAGE_BACKGROUND, opacity: 0.55 },
                      }}
                    >
                      Novo formulário
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <AdminFooter />
      <DeleteFormDialog
        busy={Boolean(deleteTarget) && action === `delete:${deleteTarget?.id}`}
        form={deleteTarget}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </Box>
  );
}
