import type { Metadata } from "next";
import { IBM_Plex_Mono, Onest } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/* THE voice — Onest variable, used at in-between weights (340/430/450/480)
   via the wght axis. Never 400/600 (docs/DESIGN.md). */
const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

/* the system-label mono (cofounder DNA) */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

/* the numeral voice — Departure Mono (local woff2; not on Google Fonts) */
const departureMono = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sayhello — before you say hello, know their story",
  description:
    "A self-improving GTM harness that builds a grounded story around a sales lead — and catches the agent lying.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${onest.variable} ${plexMono.variable} ${departureMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
