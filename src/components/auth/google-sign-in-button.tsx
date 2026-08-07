"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "555531619775-ilqtudddc3oivvvigq5orlseqeoq90m0.apps.googleusercontent.com";

type Props = {
  disabled?: boolean;
};

/** Google button using full-page redirect (no popup). */
export function GoogleSignInButton({ disabled }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function render() {
      if (cancelled || !hostRef.current || !window.google?.accounts?.id) return;
      hostRef.current.innerHTML = "";

      const loginUri = `${window.location.origin}/api/auth/google/callback`;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: "redirect",
        login_uri: loginUri,
        auto_select: false,
        use_fedcm_for_prompt: false,
      });

      window.google.accounts.id.renderButton(hostRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 320,
        locale: "uk",
        // Force redirect UX for the button itself.
        // (initialize ux_mode=redirect is the source of truth)
      });
      setReady(true);
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      if (window.google?.accounts?.id) render();
      else existing.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => setLoadError("Не вдалося завантажити Google Sign-In");
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      try {
        window.google?.accounts.id.cancel();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
      <div ref={hostRef} className="flex min-h-10 justify-center" />
      {!ready && !loadError ? (
        <p className="text-center text-xs text-muted-foreground">Завантаження Google…</p>
      ) : null}
      {loadError ? (
        <p className="text-center text-sm text-red-600">{loadError}</p>
      ) : null}
    </div>
  );
}
