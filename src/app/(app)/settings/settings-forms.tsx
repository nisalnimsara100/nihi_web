"use client";

import { changePassword, updateProfile } from "@/actions/settings";
import { SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { Card, CardHeader, Field, inputClass } from "@/components/ui";
import { CURRENCIES } from "@/lib/constants";

export function ProfileForm({ name, email, defaultCurrency }: { name: string; email: string; defaultCurrency: string }) {
  const { state, pending, onSubmit } = useActionForm(updateProfile);
  const errors = state.fieldErrors ?? {};
  return (
    <Card>
      <CardHeader title="Profile" />
      <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5" noValidate>
        <Field label="Email" htmlFor="email">
          <input id="email" value={email} disabled className={`${inputClass} opacity-70`} />
        </Field>
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input id="name" name="name" defaultValue={name} aria-invalid={!!errors.name} className={inputClass} />
        </Field>
        <Field
          label="Main currency"
          htmlFor="defaultCurrency"
          error={errors.defaultCurrency}
          hint="Used for the dashboard totals and as the default for new accounts."
        >
          <select id="defaultCurrency" name="defaultCurrency" defaultValue={defaultCurrency} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <SubmitButton pending={pending}>Save profile</SubmitButton>
      </form>
    </Card>
  );
}

export function PasswordForm() {
  const { state, pending, formRef, onSubmit } = useActionForm(changePassword, { resetOnSuccess: true });
  const errors = state.fieldErrors ?? {};
  return (
    <Card>
      <CardHeader title="Password" />
      <form ref={formRef} onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5" noValidate>
        <Field label="Current password" htmlFor="current" error={errors.current}>
          <input id="current" name="current" type="password" autoComplete="current-password" aria-invalid={!!errors.current} className={inputClass} />
        </Field>
        <Field label="New password" htmlFor="next" error={errors.next}>
          <input id="next" name="next" type="password" autoComplete="new-password" aria-invalid={!!errors.next} className={inputClass} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm}>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} className={inputClass} />
        </Field>
        <SubmitButton pending={pending}>Change password</SubmitButton>
      </form>
    </Card>
  );
}
