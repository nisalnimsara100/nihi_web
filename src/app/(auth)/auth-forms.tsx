"use client";

import Link from "next/link";
import { login, signup } from "@/actions/auth";
import { FormError, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { ButtonLink, Card, Field, inputClass } from "@/components/ui";
import { CURRENCIES } from "@/lib/constants";

/** `next` is the page to return to after signing in, e.g. an invite link. */
export function LoginForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useActionForm(login);
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-soft">Log in to your NiHi account.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <FormError state={state} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} aria-invalid={!!state.fieldErrors?.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} aria-invalid={!!state.fieldErrors?.password} />
        </Field>
        <SubmitButton pending={pending} className="h-13 w-full text-base">
          Log in
        </SubmitButton>
      </form>
      <div className="mt-3">
        <ButtonLink href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"} variant="soft" className="h-13 w-full text-base">
          Create account
        </ButtonLink>
      </div>
    </Card>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useActionForm(signup);
  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-ink-soft">Start tracking in under a minute.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <FormError state={state} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
          <input id="name" name="name" autoComplete="name" required className={inputClass} aria-invalid={!!state.fieldErrors?.name} />
        </Field>
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} aria-invalid={!!state.fieldErrors?.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={state.fieldErrors?.password} hint="At least 8 characters.">
          <input id="password" name="password" type="password" autoComplete="new-password" required className={inputClass} aria-invalid={!!state.fieldErrors?.password} />
        </Field>
        <Field label="Main currency" htmlFor="currency" error={state.fieldErrors?.currency}>
          <select id="currency" name="currency" defaultValue="LKR" className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <SubmitButton pending={pending} className="h-13 w-full text-base">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
