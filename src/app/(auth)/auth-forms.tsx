"use client";

import Link from "next/link";
import { login, signup } from "@/actions/auth";
import { FormError, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { ButtonLink, Card, Field, inputClass } from "@/components/ui";
import { CURRENCIES } from "@/lib/constants";

export function LoginForm() {
  const { state, pending, onSubmit } = useActionForm(login);
  return (
    <Card className="p-6 sm:p-7">
      <h1 className="font-display text-4xl leading-none font-black tracking-tight text-headline uppercase font-stretch-condensed">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-soft">Log in to your NiHi account.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <FormError state={state} />
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} aria-invalid={!!state.fieldErrors?.email} />
        </Field>
        <Field label="Password" htmlFor="password" error={state.fieldErrors?.password}>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} aria-invalid={!!state.fieldErrors?.password} />
        </Field>
        <SubmitButton pending={pending} className="h-14 w-full text-base tracking-wide uppercase">
          Log in
        </SubmitButton>
      </form>
      <div className="mt-3">
        <ButtonLink href="/signup" variant="lime" size="lg" className="w-full tracking-wide uppercase">
          Create account
        </ButtonLink>
      </div>
    </Card>
  );
}

export function SignupForm() {
  const { state, pending, onSubmit } = useActionForm(signup);
  return (
    <Card className="p-6 sm:p-7">
      <h1 className="font-display text-4xl leading-none font-black tracking-tight text-headline uppercase font-stretch-condensed">Create your account</h1>
      <p className="mt-2 text-sm text-ink-soft">Start tracking in under a minute.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <FormError state={state} />
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
        <SubmitButton pending={pending} className="h-14 w-full text-base tracking-wide uppercase">
          Create account
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-ink hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
