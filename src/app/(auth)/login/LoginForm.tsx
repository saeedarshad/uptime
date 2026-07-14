"use client";

import { useFormState } from "react-dom";
import { loginAction, type FormState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = {};

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);
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
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
