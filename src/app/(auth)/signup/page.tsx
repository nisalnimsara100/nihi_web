import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNext } from "@/lib/next-path";
import { param, type SearchParams } from "@/lib/search-params";
import { SignupForm } from "../auth-forms";
import { RedirectIfSignedIn } from "../redirect-if-signed-in";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<SignupForm />}>
      <SignupContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupContent({ searchParams }: { searchParams: SearchParams }) {
  // Only keep a "next" that points at this site; anything else is dropped.
  const raw = param(await searchParams, "next");
  const next = raw && safeNext(raw) === raw ? raw : undefined;
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn next={next} />
      </Suspense>
      <SignupForm next={next} />
    </>
  );
}
