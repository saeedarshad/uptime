"use client";

import { useFormState } from "react-dom";
import { resendVerification, type ResendState } from "@/app/(app)/actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: ResendState = {};

/**
 * Soft nag shown in the app shell while the signed-in user hasn't confirmed
 * their email. Doesn't block anything — just offers to re-send the link.
 */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, formAction] = useFormState(resendVerification, initial);

  return (
    <div className="border-b border-safety/20 bg-safety/[0.08] px-4 py-2.5 text-sm text-content md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <span className="font-medium">
          {state.ok ? (
            <>Verification email sent to {email}. Check your inbox.</>
          ) : (
            <>
              Confirm your email — we sent a link to{" "}
              <span className="font-semibold">{email}</span>.
            </>
          )}
          {state.error && (
            <span className="ml-2 text-danger">{state.error}</span>
          )}
        </span>
        {!state.ok && (
          <form action={formAction}>
            <SubmitButton
              className="font-semibold text-safety underline underline-offset-2 hover:no-underline"
              pendingText="Sending…"
            >
              Resend email
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
