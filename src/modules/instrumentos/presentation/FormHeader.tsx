"use client";

import { AppBar, Box, Link, Toolbar } from "@mui/material";
import { useRouter } from "next/router";
import type { FormDefinition } from "../domain/form-definitions";
import {
  getFormAuthorsPath,
  getFormBasePath,
  getFormQuestionnairePath,
} from "../domain/form-definitions";

type FormHeaderProps = {
  form: FormDefinition;
};

export default function FormHeader({ form }: FormHeaderProps) {
  const router = useRouter();
  const currentPath = router.asPath.split("?")[0];
  const basePath = getFormBasePath(form);
  const questionnairePath = getFormQuestionnairePath(form);

  const menuItems = [
    { label: "Início", href: basePath },
    { label: "Formulário", href: questionnairePath },
    { label: "Outros Formulários", href: "/tela-avaliacao" },
    { label: "Autores", href: getFormAuthorsPath(form) },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "#015D67",
        zIndex: 1201,
        boxShadow: "0 1px 6px rgba(0,0,0,0.16)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 76, md: 91 },
          px: { xs: 2, md: 5 },
          gap: { xs: 2, md: 7 },
        }}
      >
        <Box
          component="a"
          href="/"
          aria-label="Página inicial"
          sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <Box
            component="img"
            src="/logo-avaliapen.svg"
            alt="Câncer de Pênis"
            sx={{ height: { xs: 52, md: 60 }, width: "auto" }}
          />
        </Box>

        <Box
          component="nav"
          aria-label={`Navegação do formulário ${form.title}`}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            flex: 1,
            gap: { xs: 2, sm: 3, md: 5 },
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {menuItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              (item.label === "Formulário" && currentPath.startsWith(`${questionnairePath}/`));

            return (
              <Link
                key={item.label}
                href={item.href}
                underline="none"
                aria-current={isActive ? "page" : undefined}
                sx={{
                  color: "#FAFCFC",
                  fontSize: { xs: 15, md: 18 },
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  position: "relative",
                  py: 1,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 2,
                    height: 2,
                    bgcolor: "#FAFCFC",
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "center",
                    transition: "transform 0.2s ease-in-out",
                  },
                  "&:hover::after": { transform: "scaleX(1)" },
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
