import { NextResponse } from "next/server";

/**
 * Google Identity Services (ux_mode=redirect) POSTs the ID token here.
 * We bounce to /login with the token in the URL hash via a tiny HTML bridge
 * so the client can finish Firebase sign-in without popups.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const credential = String(formData.get("credential") ?? "");

  if (!credential) {
    return NextResponse.redirect(new URL("/login?error=missing_google_credential", request.url));
  }

  const html = `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <title>Вхід…</title>
  </head>
  <body>
    <p>Завершуємо вхід…</p>
    <script>
      location.replace('/login#google_credential=' + encodeURIComponent(${JSON.stringify(credential)}));
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}
