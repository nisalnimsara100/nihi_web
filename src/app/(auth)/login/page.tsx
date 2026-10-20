import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNext } from "@/lib/next-path";
import { param, type SearchParams } from "@/lib/search-params";
import { LoginForm } from "../auth-forms";
import { RedirectIfSignedIn } from "../redirect-if-signed-in";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  // Only keep a "next" that points at this site; anything else is dropped.
  const sp = await searchParams;
  const raw = param(sp, "next");
  // Used only to pre-fill the email box (an invite link carries the invited address).
  const email = param(sp, "email")?.slice(0, 254);
  const next = raw && safeNext(raw) === raw ? raw : undefined;
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn next={next} />
      </Suspense>
      <LoginForm next={next} email={email} />
    </>
  );
}
