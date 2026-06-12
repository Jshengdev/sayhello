import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* ALL three faces are SELF-HOSTED woff2 in app/fonts/ (network-proof — a
   Google Fonts fetch failure at dev silently collapsed the whole page to
   Times; never again). Onest variable, used at in-between weights
   (340/430/450/480) via the wght axis. Never 400/600 (docs/DESIGN.md). */
const onest = localFont({
  src: "./fonts/Onest-Variable-latin.woff2",
  weight: "100 900",
  variable: "--font-onest",
  display: "swap",
});

/* the system-label mono (cofounder DNA) */
const plexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBMPlexMono-Medium-latin.woff2", weight: "500", style: "normal" },
  ],
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
    /* font variables MUST live on <html>: globals.css composes them into
       --font-sans/--font-mono at :root — declared on <body> they are invisible
       there, --font-sans goes guaranteed-invalid, and font-family collapses to
       the UA default (Times). THE root cause of the serif page. */
    <html
      lang="en"
      className={`${onest.variable} ${plexMono.variable} ${departureMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
