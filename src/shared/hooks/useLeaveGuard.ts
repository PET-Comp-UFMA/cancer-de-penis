import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

type LeaveAction = () => void | Promise<unknown>;

// Asks for confirmation before leaving a page with unfinished work.
// - Links (plain <a> and next/link) and the browser back button go through the
//   page's own dialog via `pending` / `leave` / `stay`.
// - Closing the tab or reloading can only use the browser's built-in prompt.
// - Code that navigates on purpose (e.g. "Finalizar") is not intercepted; wrap
//   buttons that leave the page (Voltar, Sair) in `guard(...)`.
export function useLeaveGuard(active: boolean, backButtonMessage: string) {
  const router = useRouter();
  const [pending, setPending] = useState<LeaveAction | null>(null);

  const guard = useCallback((action: LeaveAction) => {
    if (active) setPending(() => action);
    else void action();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // leaving the site: the browser prompt covers it
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setPending(() => () => router.push(`${url.pathname}${url.search}${url.hash}`));
    };
    // Back/forward: the history entry has already moved, so on "stay" put this page back on top.
    const current = { state: window.history.state, url: window.location.href };
    router.beforePopState(() => {
      if (window.confirm(backButtonMessage)) return true;
      window.history.pushState(current.state, "", current.url);
      return false;
    });
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      router.beforePopState(() => true);
    };
  }, [active, backButtonMessage, router]);

  const stay = useCallback(() => setPending(null), []);
  const leave = useCallback(async () => {
    const action = pending;
    setPending(null);
    if (action) await action();
  }, [pending]);

  return { leaveRequested: pending !== null, guard, stay, leave, pendingAction: pending };
}
