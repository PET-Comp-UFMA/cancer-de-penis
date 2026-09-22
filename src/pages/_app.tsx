import "@/shared/styles/globals.css";
import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "@/config/theme";
import { ScoringSessionProvider } from "@/modules/instrumentos/presentation/ScoringSessionContext";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScoringSessionProvider>
        <Component {...pageProps} />
      </ScoringSessionProvider>
    </ThemeProvider>
  );
}
