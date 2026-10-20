/**
 * Receives the browser's Content-Security-Policy violation reports (the policy is in report-only
 * mode, see next.config.ts) and writes one short line to the server log. Nothing is stored.
 */
export async function POST(request: Request) {
  const text = (await request.text()).slice(0, 4000);
  try {
    const report = JSON.parse(text)["csp-report"] ?? {};
    console.warn(
      "CSP report:",
      JSON.stringify({ directive: report["violated-directive"], blocked: report["blocked-uri"], page: String(report["document-uri"] ?? "").split("?")[0] }),
    );
  } catch {
    // Not a report we understand; ignore it.
  }
  return new Response(null, { status: 204 });
}
