"use client";

/** The last safety net: shown when even the page shell fails. It uses plain styles because nothing else may have loaded. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
        <main style={{ maxWidth: 320 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#6e6e73", lineHeight: 1.5 }}>NiHi could not load. Your data is safe. Try again.</p>
          {error.digest ? <p style={{ fontFamily: "monospace", fontSize: 12, color: "#6e6e73" }}>{error.digest}</p> : null}
          <button type="button" onClick={reset} style={{ marginTop: 16, background: "#4744f7", color: "#fff", border: 0, borderRadius: 14, padding: "12px 22px", fontWeight: 600 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
