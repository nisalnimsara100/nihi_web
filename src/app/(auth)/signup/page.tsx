import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "../auth-forms";
import { RedirectIfSignedIn } from "../redirect-if-signed-in";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <>
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <SignupForm />
    </>
  );
}
