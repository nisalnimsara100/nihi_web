import type { Instrumentation } from "next";
import { toErrorRecord } from "@/lib/report-error";

/**
 * Called by Next.js for every error on the server (pages, actions, route handlers). It writes one
 * line to the server log, which Vercel keeps and shows under Logs. If ERROR_WEBHOOK_URL is set (a
 * Slack, Discord or ntfy webhook), a short message is posted there too.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const record = toErrorRecord(error, request, context);
  console.error("Server error:", JSON.stringify(record));

  const hook = process.env.ERROR_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // "text" is what Slack expects and "content" what Discord expects; others ignore the extra key.
      body: JSON.stringify({ text: `NiHi error: ${record.message} (${record.method} ${record.path})`, content: `NiHi error: ${record.message} (${record.method} ${record.path})`, record }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Reporting must never make the original problem worse.
  }
};
