"use client";

import { useFormState } from "react-dom";
import { forgotPasswordAction, type FormState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState & { ok?: boolean } = {};

export function ForgotForm() {
  const [state, formAction] = useFormState(forgotPasswordAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-md bg-ok/10 px-3 py-3 text-sm text-content">
        If an account exists for that email, a reset link is on its way. Check
        your inbox (and spam).
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="you@shop.com"
        />
      </div>
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}
