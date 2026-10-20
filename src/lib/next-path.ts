/**
 * Where to go after signing in: the "next" path a page asked for, but only
 * if it is a path on this site. Anything else (other hosts, "//host",
 * backslashes) falls back to the dashboard, so it can't be an open redirect.
 */
export function safeNext(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  return value;
}
