"use client";

import { AppBar, Box, Drawer, IconButton, Link, List, ListItem, ListItemText, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  getFormAuthorsPath,
  getFormBasePath,
  getFormQuestionnairePath,
  getFormResultPath,
  type FormDefinition,
} from "../domain/form-definitions";
import { useAdminPreview } from "./AdminPreviewContext";

type FormHeaderProps = { form: FormDefinition };

export default function FormHeader({ form }: FormHeaderProps) {
  const router = useRouter();
  const adminPreview = useAdminPreview();
  const [open, setOpen] = useState(false);
  const currentPath = router.asPath.split("?")[0];
  // Each form behaves as its own mini-site: home, questionnaire, the form's authors,
  // plus a way out to the full catalog.
  const base = getFormBasePath(form);
  const menuItems = [
    { label: "Início", href: base, active: currentPath === base },
    { label: "Formulário", href: getFormQuestionnairePath(form), active: currentPath === getFormQuestionnairePath(form) || currentPath === getFormResultPath(form) },
    { label: "Outros Formulários", href: "/tela-avaliacao", active: false },
    { label: "Autores", href: getFormAuthorsPath(form), active: currentPath === getFormAuthorsPath(form) },
    ...(adminPreview ? [{ label: "Painel Admin", href: "/admin/formularios", active: false }] : []),
  ];
  // Same bar, logo, link size and underline as the main site header
  // (src/shared/components/Header.tsx), including the mobile drawer.
  return <>
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#015D67", zIndex: 1201 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box component="a" href="/" aria-label="Página inicial" sx={{ display: "flex", alignItems: "center" }}>
          <Box component="img" src="/logo-avaliapen.svg" alt="Câncer de Pênis" sx={{ height: 60 }} />
        </Box>
        <Box component="nav" aria-label={`Navegação do formulário ${form.title}`} sx={{ display: { xs: "none", md: "flex" }, gap: 10, px: 2 }}>
          {menuItems.map((item) => <Link key={item.label} href={item.href} underline="none" aria-current={item.active ? "page" : undefined} sx={{ color: "#fff", fontWeight: 500, position: "relative", pb: "6px", whiteSpace: "nowrap", "&::after": { content: '""', position: "absolute", left: 0, bottom: 0, width: "100%", height: "2px", bgcolor: "#fff", transform: item.active ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.2s ease-in-out" }, "&:hover::after": { transform: "scaleX(1)" } }}>{item.label}</Link>)}
        </Box>
        <IconButton aria-label="Abrir menu" onClick={() => setOpen(true)} sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
      <Box sx={{ width: 260, bgcolor: "#015D67", height: "100%", color: "#fff", p: 2 }}>
        <List>
          {menuItems.map((item) => <ListItem key={item.label} component="a" href={item.href} onClick={() => setOpen(false)}>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: item.active ? 700 : 400 }} />
          </ListItem>)}
        </List>
      </Box>
    </Drawer>
  </>;
}
