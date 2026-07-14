"use client";

import { useFormState } from "react-dom";
import { registerAction, type FormState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";
import { BUSINESS_TYPES } from "@/lib/businessTypes";

const initial: FormState = {};

export function RegisterForm() {
  const [state, formAction] = useFormState(registerAction, initial);
  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="orgName">
          Business name
        </label>
        <input id="orgName" name="orgName" required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="businessType">
            Business type
          </label>
          <select id="businessType" name="businessType" className="input">
            {BUSINESS_TYPES.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">
            City
          </label>
          <input id="city" name="city" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input id="name" name="name" required className="input" />
      </div>
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
          autoComplete="new-password"
          required
          className="input"
          placeholder="At least 8 characters"
        />
      </div>
      <SubmitButton pendingText="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
