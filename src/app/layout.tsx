import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Cormorant_Garamond,
  Playfair_Display,
  Great_Vibes,
  Marck_Script,
  Caveat,
  Lobster,
  Pacifico,
  Bad_Script,
  Philosopher,
  Poiret_One,
  Arsenal,
  Lora,
  EB_Garamond,
  Amatic_SC,
} from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
});
const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});
const marckScript = Marck_Script({
  variable: "--font-marck-script",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "cyrillic"],
});
const lobster = Lobster({
  variable: "--font-lobster",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});
const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});
const badScript = Bad_Script({
  variable: "--font-bad-script",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});
const philosopher = Philosopher({
  variable: "--font-philosopher",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
});
const poiret = Poiret_One({
  variable: "--font-poiret",
  weight: "400",
  subsets: ["latin", "cyrillic"],
});
const arsenal = Arsenal({
  variable: "--font-arsenal",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "cyrillic"],
});
const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin", "cyrillic"],
});
const amatic = Amatic_SC({
  variable: "--font-amatic",
  weight: ["400", "700"],
  subsets: ["latin", "cyrillic"],
});

const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  cormorant.variable,
  playfair.variable,
  greatVibes.variable,
  marckScript.variable,
  caveat.variable,
  lobster.variable,
  pacifico.variable,
  badScript.variable,
  philosopher.variable,
  poiret.variable,
  arsenal.variable,
  lora.variable,
  ebGaramond.variable,
  amatic.variable,
].join(" ");

export const metadata: Metadata = {
  title: "InviteEvents — Красиві онлайн-запрошення",
  description:
    "Створюйте цифрові запрошення на весілля, дні народження та святкування. Керуйте гостями, RSVP та опитуваннями.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans antialiased`}>
        <ThemeProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
