"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import type { ScoreResult } from "../domain/scoring";

type ScoringSession =
  | { status: "result"; score: number; band: ScoreResult["band"]; percentage: number }
  | { status: "error"; code: string };

type ScoringSessionApi = {
  publishResult: (catalogKey: string, result: ScoreResult) => void;
  publishError: (catalogKey: string, code: string) => void;
  clearResult: (catalogKey: string) => void;
  takeResult: (catalogKey: string) => ScoringSession | null;
};

// In-memory only, on purpose: individual answers/scores/results must never
// touch the DB, logs, analytics, a durable cache, browser storage, or the
// URL (see docs/requirements RF38-40). A useRef Map survives client-side
// Pages Router navigation between /formulario and /resultado (this module
// tree stays mounted across page swaps, same as _app's ThemeProvider), but
// is wiped on any full page reload since _app itself remounts from scratch.
const ScoringSessionContext = createContext<ScoringSessionApi | null>(null);

export function ScoringSessionProvider({ children }: { children: ReactNode }) {
  const sessions = useRef(new Map<string, ScoringSession>());

  const publishResult = useCallback((catalogKey: string, result: ScoreResult) => {
    sessions.current.set(catalogKey, { status: "result", score: result.score, band: result.band, percentage: result.percentage });
  }, []);

  const publishError = useCallback((catalogKey: string, code: string) => {
    sessions.current.set(catalogKey, { status: "error", code });
  }, []);

  const clearResult = useCallback((catalogKey: string) => {
    sessions.current.delete(catalogKey);
  }, []);

  // Read-once: a second visit (back/forward nav, or a raw reload of the same
  // client session) must not replay a stale result.
  const takeResult = useCallback((catalogKey: string) => {
    const session = sessions.current.get(catalogKey) ?? null;
    sessions.current.delete(catalogKey);
    return session;
  }, []);

  const api = useMemo<ScoringSessionApi>(
    () => ({ publishResult, publishError, clearResult, takeResult }),
    [publishResult, publishError, clearResult, takeResult],
  );

  return <ScoringSessionContext.Provider value={api}>{children}</ScoringSessionContext.Provider>;
}

export function useScoringSession(): ScoringSessionApi {
  const context = useContext(ScoringSessionContext);
  if (!context) throw new Error("useScoringSession must be used within ScoringSessionProvider");
  return context;
}
