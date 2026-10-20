import "server-only";
import { headers } from "next/headers";

/** The address the app is being served from, such as https://nihipay.vercel.app, taken from the request. */
export async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
