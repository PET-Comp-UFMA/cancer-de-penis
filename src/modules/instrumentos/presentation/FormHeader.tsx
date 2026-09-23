"use client";

import { AppBar, Box, Link, Toolbar } from "@mui/material";
import { useRouter } from "next/router";
import type { FormDefinition } from "../domain/form-definitions";

type FormHeaderProps = { form: FormDefinition };

export default function FormHeader({ form }: FormHeaderProps) {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];
  const menuItems = [
    { label: "Início", href: "/" },
    { label: "Ferramentas de Avaliação", href: "/tela-avaliacao" },
    { label: "Autores", href: "/autores" },
    { label: "Centros de Atendimento", href: "/locais" },
  ];
  return <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#015D67", zIndex: 1201 }}>
    <Toolbar sx={{ minHeight: { xs: 76, md: 91 }, px: { xs: 2, md: 5 }, gap: 3 }}>
      <Box component="a" href="/" aria-label="Página inicial" sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Box component="img" src="/logo-avaliapen.svg" alt="Câncer de Pênis" sx={{ width: { xs: 140, md: 210 }, height: { xs: 60, md: 90 } }} />
      </Box>
      <Box component="nav" aria-label={`Navegação do formulário ${form.title}`} sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flex: 1, gap: { xs: 2, sm: 3, md: 5, lg: 11.25 }, overflowX: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
        {menuItems.map((item) => {
          const isActive = currentPath === item.href || (item.href === "/tela-avaliacao" && currentPath.startsWith("/tela-avaliacao/"));
          return <Link key={item.label} href={item.href} underline="none" aria-current={isActive ? "page" : undefined} sx={{ color: "#FAFCFC", fontSize: { xs: 14, sm: 18, md: 24.19 }, whiteSpace: "nowrap", fontWeight: 500, position: "relative", pb: "6px", "&::after": { content: '""', position: "absolute", left: 0, right: 0, bottom: 2, height: 2, bgcolor: "#FAFCFC", transform: isActive ? "scaleX(1)" : "scaleX(0)", transition: "transform .2s" }, "&:hover::after": { transform: "scaleX(1)" } }}>{item.label}</Link>;
        })}
      </Box>
    </Toolbar>
  </AppBar>;
}
