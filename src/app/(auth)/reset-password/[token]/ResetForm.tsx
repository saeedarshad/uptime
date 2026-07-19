"use client";

import { useFormState } from "react-dom";
import { resetPasswordAction, type FormState } from "../../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = {};

export function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(resetPasswordAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          placeholder="At least 8 characters"
        />
      </div>
      <SubmitButton pendingText="Saving…">Set new password</SubmitButton>
    </form>
  );
}
