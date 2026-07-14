"use client";

import { useFormState } from "react-dom";
import { acceptInvite, type AcceptState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: AcceptState = {};

export function AcceptForm({ token }: { token: string }) {
  const [state, formAction] = useFormState(acceptInvite, initial);
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
          Choose a password
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
      <SubmitButton className="btn-primary w-full" pendingText="Joining…">
        Join team
      </SubmitButton>
    </form>
  );
}
