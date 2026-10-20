/**
 * Turns a server error into a short, safe record: what failed and where, never cookies, headers,
 * form data or query strings (they can hold personal or financial details).
 */
export type ErrorRecord = {
  time: string;
  message: string;
  digest?: string;
  path: string;
  method: string;
  route: string;
  kind: string;
};

export function toErrorRecord(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
  now = new Date(),
): ErrorRecord {
  const err = error as { message?: unknown; digest?: unknown } | null;
  return {
    time: now.toISOString(),
    message: String(typeof err?.message === "string" ? err.message : error).slice(0, 500),
    digest: typeof err?.digest === "string" ? err.digest : undefined,
    path: request.path.split("?")[0].slice(0, 200),
    method: request.method,
    route: context.routePath,
    kind: context.routeType,
  };
}
