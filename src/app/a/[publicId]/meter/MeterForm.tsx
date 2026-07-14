"use client";

import { useFormState } from "react-dom";
import { submitMeterAction, type PublicState } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

const initial: PublicState = {};

export function MeterForm({
  publicId,
  names,
  defaultUnit,
}: {
  publicId: string;
  names: string[];
  defaultUnit: string;
}) {
  const bound = submitMeterAction.bind(null, publicId);
  const [state, formAction] = useFormState(bound, initial);
  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="label" htmlFor="value">
            Reading
          </label>
          <input
            id="value"
            name="value"
            inputMode="decimal"
            required
            autoFocus
            className="input text-lg"
            placeholder="12500"
          />
        </div>
        <div>
          <label className="label" htmlFor="unitLabel">
            Unit
          </label>
          <input
            id="unitLabel"
            name="unitLabel"
            defaultValue={defaultUnit}
            className="input"
            placeholder="miles"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="reporterName">
          Your name
        </label>
        <input
          id="reporterName"
          name="reporterName"
          list="reporter-names"
          required
          className="input"
          placeholder="Pick or type your name"
        />
        <datalist id="reporter-names">
          {names.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </div>
      <SubmitButton
        className="btn-primary w-full py-4 text-base"
        pendingText="Saving…"
      >
        Save reading
      </SubmitButton>
    </form>
  );
}
