"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function LoginPage() {
  const { user, loading, signInGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="text-xl font-bold">
            Invite<span className="text-primary">Events</span>
          </Link>
          <CardTitle className="mt-4">Ласкаво просимо</CardTitle>
          <CardDescription>Увійдіть, щоб керувати запрошеннями</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={signInGoogle} disabled={loading}>
            Продовжити з Google
          </Button>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Входячи, ви погоджуєтесь з Умовами використання та Політикою конфіденційності.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
