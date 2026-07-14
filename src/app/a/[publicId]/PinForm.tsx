"use client";

import { useFormState } from "react-dom";
import { verifyPinAction, type PublicState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: PublicState = {};

export function PinForm({ publicId }: { publicId: string }) {
  const bound = verifyPinAction.bind(null, publicId);
  const [state, formAction] = useFormState(bound, initial);
  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-graphite">Enter shop PIN</h2>
        <p className="mt-1 text-sm text-graphite/60">
          Ask your manager for today&apos;s PIN. You&apos;ll only enter it once
          per shift.
        </p>
      </div>
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <input
        name="pin"
        inputMode="numeric"
        autoFocus
        maxLength={4}
        className="input text-center text-2xl tracking-[0.5em]"
        placeholder="••••"
      />
      <SubmitButton className="btn-primary w-full" pendingText="Checking…">
        Continue
      </SubmitButton>
    </form>
  );
}
