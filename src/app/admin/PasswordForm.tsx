"use client";

import { useFormState } from "react-dom";
import { changeAdminPassword, type AdminState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: AdminState = {};

export function AdminPasswordForm() {
  const [state, formAction] = useFormState(changeAdminPassword, initial);
  return (
    <form action={formAction} className="max-w-md space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      {state.ok && state.message && (
        <div className="rounded-md bg-ok/10 px-3 py-2 text-sm text-ok">
          {state.message}
        </div>
      )}
      <div>
        <label className="label" htmlFor="current">
          Current password
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="next">
          New password
        </label>
        <input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          required
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="input"
        />
      </div>
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
