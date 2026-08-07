"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { completeGoogleIdTokenSignIn } from "@/lib/auth/complete-google-sign-in";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";

function LoginContent() {
  const { sessionReady, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (sessionReady) router.replace("/dashboard");
  }, [sessionReady, router]);

  useEffect(() => {
    const qError = searchParams.get("error");
    if (qError) setAuthError(qError);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.includes("google_credential=")) return;

    const raw = hash.replace(/^#/, "");
    const params = new URLSearchParams(raw);
    const idToken = params.get("google_credential");
    if (!idToken) return;

    let cancelled = false;
    setFinishing(true);
    setAuthError(null);

    void (async () => {
      try {
        await completeGoogleIdTokenSignIn(idToken);
        if (cancelled) return;
        history.replaceState(null, "", "/login");
        router.replace("/dashboard");
      } catch (error) {
        if (cancelled) return;
        setAuthError(error instanceof Error ? error.message : "google-sign-in-failed");
        history.replaceState(null, "", "/login");
      } finally {
        if (!cancelled) setFinishing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="text-xl font-bold">
          Invite<span className="text-primary">Events</span>
        </Link>
        <CardTitle className="mt-4">Ласкаво просимо</CardTitle>
        <CardDescription>
          {finishing ? "Завершуємо вхід…" : "Увійдіть, щоб керувати запрошеннями"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <GoogleSignInButton disabled={loading || finishing} />

        {authError ? (
          <p className="text-center text-sm text-red-600">
            Помилка входу: {authError}
          </p>
        ) : null}

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Входячи, ви погоджуєтесь з Умовами використання та Політикою конфіденційності.
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Завантаження…</p>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
