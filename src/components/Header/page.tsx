"use client";

import {
  AppBar,
  Toolbar,
  Box,
  Link,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { isHmrRefresh } from "next/dist/server/app-render/work-unit-async-storage.external";
import MenuIcon from "@mui/icons-material/Menu";
import { usePathname } from "next/navigation";
import { useState } from "react";

// const toggleDrawer = (value) => () => {
//   setOpen(value);
// };

const menuItems = [
  { label: "Início", href: "/" },
  { label: "Avaliação de Risco", href: "/tela-avaliacao/tela-avaliacao" },
  { label: "Autores", href: "/autores" },
  { label: "Centro de Atendimento", href: "atendimento" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ bgcolor: "#015D67", zIndex: 1201 }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src="/logo-avaliapen.svg"
              alt="Logo site"
              style={{ height: 60 }}
            />
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 10, px: 2 }}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  underline="none"
                  sx={{
                    color: "#fff",
                    fontWeight: 500,
                    position: "relative",
                    pb: "6px",

                    "&::after": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      bottom: 0,
                      width: "100%",
                      height: "2px",
                      bgcolor: "#fff",
                      transform: isActive ? "scaleX(1)" : "scaleX(0)",
                      transition: "transform 0.2s ease-in-out",
                    },

                    "&:hover::after": {
                      transform: "scaleX(1)",
                    },
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </Box>

          {/* Botão Mobile */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }}
            onClick={() => setOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box
          sx={{
            width: 260,
            bgcolor: "#015D67",
            height: "100%",
            color: "#fff",
            p: 2,
          }}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.label}
                component="a"
                href={item.href}
                onClick={() => setOpen(false)}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
