/* S0 — the paper-light shell. The Element A dashboard (LoopCanvas + status groups
   + report) lands here at S1; this page proves the world: page ground, raised card,
   the type system, the shadow grammar. */
export default function Home() {
  return (
    <main className="min-h-screen bg-page flex items-center justify-center p-8">
      <div className="ring-card bg-raised rounded-2xl px-10 py-9 max-w-xl w-full">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
          gtm harness · grounded lead-stories
        </p>
        <h1 className="mt-4 text-3xl text-ink" style={{ fontWeight: 480 }}>
          sayhello
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          before you say hello, know their story.
        </p>
        <div className="divider-dashed mt-7 pt-5 flex items-center justify-between">
          <p className="font-mono text-[11px] text-faint">
            scrape → draft → judge → archive → render
          </p>
          <p className="font-numeral text-[11px] text-mute">S0</p>
        </div>
      </div>
    </main>
  );
}
