"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import type { ActionState } from "@/app/(app)/assets/actions";

export interface AssetFormValues {
  name?: string;
  category?: string | null;
  location?: string | null;
  status?: string;
  purchaseCostCents?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
  isComplianceTracked?: boolean;
}

const initial: ActionState = {};

export function AssetForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  values?: AssetFormValues;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initial);
  const cost =
    values.purchaseCostCents != null
      ? (values.purchaseCostCents / 100).toString()
      : "";
  const date = values.purchaseDate
    ? new Date(values.purchaseDate).toISOString().slice(0, 10)
    : "";

  return (
    <form action={formAction} className="card space-y-4 p-6">
      {state.error && (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </div>
      )}
      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name ?? ""}
          className="input"
          placeholder="Vehicle Lift #2"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={values.category ?? ""}
            className="input"
            placeholder="Lift"
          />
        </div>
        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={values.location ?? ""}
            className="input"
            placeholder="Bay 3"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status ?? "running"}
            className="input"
          >
            <option value="running">Running</option>
            <option value="down">Down</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="purchaseCost">
            Purchase cost ($)
          </label>
          <input
            id="purchaseCost"
            name="purchaseCost"
            defaultValue={cost}
            inputMode="decimal"
            className="input"
            placeholder="4800"
          />
        </div>
        <div>
          <label className="label" htmlFor="purchaseDate">
            Purchase date
          </label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="date"
            defaultValue={date}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={values.notes ?? ""}
          className="input min-h-20"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-graphite/80">
        <input
          type="checkbox"
          name="isComplianceTracked"
          defaultChecked={values.isComplianceTracked ?? false}
          className="h-4 w-4 rounded border-graphite/30 text-safety focus:ring-safety"
        />
        Compliance-tracked (DOT vehicle, calibrated instrument, etc.)
      </label>
      <div className="flex justify-end">
        <SubmitButton className="btn-primary" pendingText="Saving…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
