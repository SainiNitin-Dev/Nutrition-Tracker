"use client";

import { useEffect, useRef, useState } from "react";

export function AppBusyIndicator() {
  const currentHref = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    currentHref.current = window.location.href;
    const interval = window.setInterval(() => {
      if (currentHref.current === window.location.href) {
        return;
      }

      currentHref.current = window.location.href;
      setBusy(false);
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a");

      if (!link || !isInternalNavigation(link)) {
        return;
      }

      setBusy(true);
    }

    function handleSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) {
        return;
      }

      setBusy(true);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  useEffect(() => {
    if (!busy) {
      return;
    }

    const timeout = window.setTimeout(() => setBusy(false), 12000);

    return () => window.clearTimeout(timeout);
  }, [busy]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 shadow-[0_0_18px_rgba(59,130,246,0.45)] transition-opacity duration-150 ${
        busy ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full animate-app-progress rounded-r-full bg-white/45" />
    </div>
  );
}

function isInternalNavigation(link: HTMLAnchorElement) {
  if (link.target || link.hasAttribute("download")) {
    return false;
  }

  const href = link.getAttribute("href");

  if (!href || href.startsWith("#")) {
    return false;
  }

  const url = new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  return `${url.pathname}${url.search}` !==
    `${window.location.pathname}${window.location.search}`;
}
